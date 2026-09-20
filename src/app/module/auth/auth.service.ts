import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegistrationCitizenPayload,
	IRegistrationStaffPayload,
	IVerifyEmailPayload,
	ResetPasswordPayload,
} from "./auth.interface";
import HttpStatus from "http-status";
import bcrypt from "bcrypt";
import config from "../../config";
import {
	AuthProvider,
	Role,
	UserStatus,
} from "../../../generated/prisma/enums";
import crypto from "crypto";
import { redisClient } from "../../lib/redist";
import { nodmailerTransporter } from "../../lib/nodmailer";
import path from "path";
import ejs from "ejs";
import { jwtUtils } from "../../utils/jwt";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { googleClient } from "../../lib/googleAuth";
import type { TokenPayload } from "google-auth-library";
import { email } from "zod";
import { EURLACCESS } from "nodemailer/lib/errors.js";

const registerCitizen = async (payload: IRegistrationCitizenPayload) => {
	// 1.User create
	const existingUser = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (existingUser) {
		throw new AppError(HttpStatus.CONFLICT, "Email already registered");
	}

	const hashedPassword = await bcrypt.hash(
		payload.password,
		Number(config.bcrypt_salt_rounds),
	);

	// 2. User Push In Redis

	const otpKey = `verify-email-OTP:${payload.email}`;
	const userKey = `user-key:${payload.email}`;
	const otpValue = crypto.randomInt(100000, 1000000);
	const otpExpirationTime = 60 * 5;

	const redisPayload = {
		name: payload.name,
		email: payload.email,
		password: hashedPassword,
		phone: payload.phone,
		role: Role.CITIZEN,
		status: UserStatus.ACTIVE,
		citizenProfile: {
			create: {
				name: payload.name,
				email: payload.email,
			},
		},
	};

	// set user to redist
	await redisClient.set(userKey, JSON.stringify(redisPayload), {
		expiration: {
			type: "EX",
			value: otpExpirationTime,
		},
	});

	// set OTP to redist
	await redisClient.set(otpKey, otpValue, {
		expiration: {
			type: "EX",
			value: otpExpirationTime,
		},
	});

	// 3. send OTP for email verify

	const templatePath = path.join(
		process.cwd(),
		"src/app/template/verify-account.ejs",
	);
	const templateData = {
		Name: payload.name,
		Email: payload.email,
		OTP: otpValue,
		Expiration: otpExpirationTime / 60,
	};
	const templeteHtml = await ejs.renderFile(templatePath, templateData);

	nodmailerTransporter.sendMail({
		from: config.smtp_sender,
		to: payload.email,
		subject: "Account-Verify-OTP",
		html: templeteHtml,
	});
};

const verifyAccount = async (payload: IVerifyEmailPayload) => {
	const email = payload.email.trim().toString();
	const otp = payload.otp.trim();

	const isUserExsist = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExsist?.emailVerified) {
		throw new AppError(HttpStatus.CONFLICT, "User Email Already Verified");
	}
	if (isUserExsist?.status === UserStatus.BLOCKED) {
		throw new AppError(HttpStatus.CONFLICT, "User is blocked");
	}
	if (isUserExsist?.status === UserStatus.DELETED || isUserExsist?.isDeleted) {
		throw new AppError(HttpStatus.CONFLICT, "User is deleted");
	}

	const otpKey = `verify-email-OTP:${payload.email}`;
	const userKey = `user-key:${payload.email}`;

	const redisOTP = await redisClient.get(otpKey);
	if (!redisOTP) {
		throw new AppError(HttpStatus.NOT_FOUND, "Invalid OTP");
	}
	if (redisOTP !== otp) {
		throw new AppError(HttpStatus.NOT_FOUND, "Dose Not Mathed OTP");
	}

	const redisUser = await redisClient.get(userKey);
	if (!redisUser) {
		throw new AppError(HttpStatus.NOT_FOUND, "User Dose Not Exsist");
	}

	const citizenUser = JSON.parse(redisUser);

	const user = await prisma.user.create({
		data: {
			...citizenUser,
			emailVerified: true,
		},
		omit: { password: true },
		include: { citizenProfile: true },
	});

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		user,
		accessToken,
		refreshToken,
	};
};

// ---------------- STAFF APPLY (REGISTER) ----------------
const registerStaff = async (payload: IRegistrationStaffPayload) => {
	const existingUser = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (existingUser) {
		throw new AppError(HttpStatus.CONFLICT, "Email already registered");
	}

	const department = await prisma.department.findUnique({
		where: { id: payload.departmentId },
	});

	if (!department) {
		throw new AppError(HttpStatus.NOT_FOUND, "Department not found");
	}

	const hashedPassword = await bcrypt.hash(
		payload.password,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.create({
		data: {
			name: payload.name,
			email: payload.email,
			password: hashedPassword,
			role: Role.STAFF,
			status: UserStatus.PENDING,
			staffProfile: {
				create: {
					name: payload.name,
					email: payload.email,
					experienceYears: Number(payload.experienceYears),
					expertise: payload.expertise as string,
					nid: payload.nid,
					departmentId: payload.departmentId,
				},
			},
		},
		include: { staffProfile: true },
		omit: { password: true },
	});
};

const loginUser = async (payload: ILoginUserPayload) => {
	const email = payload.email.trim().toLowerCase();
	const password = payload.password.trim();
	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(HttpStatus.NOT_FOUND, "User Not Found!!!!");
	}

	if (!user.emailVerified) {
		throw new AppError(HttpStatus.CONFLICT, "User is Not Verified");
	}
	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(HttpStatus.CONFLICT, "User is blocked");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new AppError(HttpStatus.CONFLICT, "User is deleted");
	}
	if (user.password === null && user.googleId !== null) {
		throw new AppError(
			HttpStatus.CONFLICT,
			"User Already login Google. Please! Login with google",
		);
	}

	const isPasswordMatched = await bcrypt.compare(
		password,
		user.password as string,
	);

	if (!isPasswordMatched) {
		throw new AppError(HttpStatus.CONFLICT, "Invalid credentials");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
	console.log(payload.idToken);
	let googleIdTokenPayload: TokenPayload | null | undefined = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});

		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.log(`Google ID Token Vrification Failed:`, error);
		throw new AppError(
			HttpStatus.INTERNAL_SERVER_ERROR,
			"Invalid Or Expaired Google ID Token",
		);
	}
	if (!googleIdTokenPayload) {
		throw new AppError(
			HttpStatus.INTERNAL_SERVER_ERROR,
			"Invalid Or Expaired Google ID Token",
		);
	}
	if (!googleIdTokenPayload.name) {
		throw new AppError(HttpStatus.NOT_FOUND, "Google Name not found");
	}
	if (!googleIdTokenPayload.email) {
		throw new AppError(HttpStatus.NOT_FOUND, "Google Email not found");
	}

	const isUserInGoogleAuth = await prisma.user.findUnique({
		where: {
			email: googleIdTokenPayload.email,
			role: Role.CITIZEN,
			provider: AuthProvider.GOOGLE,
			googleId: googleIdTokenPayload.sub,
		},
	});

	let user = isUserInGoogleAuth;

	if (!isUserInGoogleAuth) {
		const isCredentialUser = await prisma.user.findUnique({
			where: {
				email: googleIdTokenPayload.email,
				role: Role.CITIZEN,
				provider: AuthProvider.CREDENTIALS,
			},
		});

		if (isCredentialUser) {
			if (!isCredentialUser?.emailVerified) {
				throw new AppError(HttpStatus.CONFLICT, "User is Not Verified");
			}
			if (isCredentialUser?.status === UserStatus.BLOCKED) {
				throw new AppError(HttpStatus.CONFLICT, "User is Blocked");
			}
			if (isCredentialUser?.status === UserStatus.DELETED || user?.isDeleted) {
				throw new AppError(HttpStatus.NOT_FOUND, "User is Deleted");
			}

			user = await prisma.user.update({
				where: { email: isCredentialUser.email },
				data: {
					id: isCredentialUser.id,
					name: googleIdTokenPayload.name as string,
					provider: AuthProvider.CREDENTIALS,
					googleId: googleIdTokenPayload.sub,
				},
			});
		} else {
			user = await prisma.user.create({
				data: {
					name: googleIdTokenPayload.name as string,
					email: googleIdTokenPayload.email as string,
					role: Role.CITIZEN,
					provider: AuthProvider.GOOGLE,
					googleId: googleIdTokenPayload.sub,
					emailVerified: true,

					status: UserStatus.ACTIVE,
					citizenProfile: {
						create: {
							name: googleIdTokenPayload.name as string,
							email: googleIdTokenPayload.email as string,
						},
					},
				},
			});
		}
	}

	if (!user) {
		throw new AppError(HttpStatus.NOT_FOUND, "User Not Found");
	}

	if (user?.status === UserStatus.BLOCKED) {
		throw new Error("User is Blocked");
	}
	if (user?.status === UserStatus.DELETED || user?.isDeleted) {
		throw new Error("User is Deleted");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};
	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);
	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new Error(
			config.node_env === "development"
				? verifiedRefreshToken.error
				: "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: data.userId },
	});

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new Error("User is inactive or not found");
	}

	if (user.password === null && user.googleId !== null) {
		throw new Error("User Register with google. Please login with GOOGLE");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const forgetPassword = async (payload: ForgotPasswordPayload) => {
	const { email } = payload;

	const isExsistUser = await prisma.user.findUnique({
		where: { email },
	});

	if (!isExsistUser) {
		throw new Error("User Not Found!");
	}
	if (isExsistUser.provider !== AuthProvider.CREDENTIALS) {
		throw new Error("User is not credential register");
	}
	if (isExsistUser.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}
	if (isExsistUser.status === "DELETED" || isExsistUser.isDeleted) {
		throw new Error("User is deleted");
	}
	if (!isExsistUser.emailVerified) {
		throw new Error("User not veryfied");
	}

	const otpKey = `forget-password-otp:${isExsistUser.email}`;
	const otpValue = crypto.randomInt(100000, 1000000);
	const otpExpirationTime = 60 * 5;

	// set OTP to redist
	await redisClient.set(otpKey, otpValue, {
		expiration: {
			type: "EX",
			value: otpExpirationTime,
		},
	});

	// 3. send OTP for email verify

	const templatePath = path.join(
		process.cwd(),
		"src/app/template/forgot-password.ejs",
	);
	const templateData = {
		Name: isExsistUser.name,
		Email: payload.email,
		OTP: otpValue,
		Expiration: otpExpirationTime / 60,
	};
	const templeteHtml = await ejs.renderFile(templatePath, templateData);

	nodmailerTransporter.sendMail({
		from: config.smtp_sender,
		to: payload.email,
		subject: "Forget Password OTP",
		html: templeteHtml,
	});
};

const resetPassword = async (payload: ResetPasswordPayload) => {
	const { email, newPassword } = payload;

	const isExsistUser = await prisma.user.findUnique({
		where: { email },
	});

	if (!isExsistUser) {
		throw new Error("User Not Found!");
	}
	if (isExsistUser.provider !== AuthProvider.CREDENTIALS) {
		throw new Error("User is not credential register");
	}
	if (isExsistUser.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}
	if (isExsistUser.status === UserStatus.DELETED || isExsistUser.isDeleted) {
		throw new Error("User is deleted");
	}
	if (!isExsistUser.emailVerified) {
		throw new Error("User not veryfied");
	}

	const newHashPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);
	await prisma.user.update({
		where: { email },
		data: { password: newHashPassword },
	});

	const templatesPath = path.join(
		process.cwd(),
		"src/app/template/reset-password.ejs",
	);
	const templetesHtml = await ejs.renderFile(templatesPath, {
		Name: isExsistUser.name,
		Email: isExsistUser.email,
	});

	await nodmailerTransporter.sendMail({
		from: config.smtp_sender,
		to: isExsistUser.email,
		subject: "Password Changed Successfully ",
		html: templetesHtml,
	});
};

export const AuthService = {
	registerCitizen,
	verifyAccount,
	loginUser,
	googleLogin,
	registerStaff,
	refreshToken,
	forgetPassword,
	resetPassword,
};
