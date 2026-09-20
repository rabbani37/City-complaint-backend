import { Role, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import HttpStatus from "http-status";
import type {
	ForgotPasswordPayload,
	IRequestUser,
} from "../auth/auth.interface";
import { AppError } from "../../utils/AppError";
import type { IUserUpdatePayload } from "./users.interface";
import { cloudinary } from "../../lib/cloudinary";

const getMe = async (user: IRequestUser) => {
	const meUser = await prisma.user.findUnique({
		where: { id: user.userId, deletedAt: null },
		omit: { password: true },
	});

	if (!meUser) {
		throw new AppError(HttpStatus.NOT_FOUND, "User not found");
	}

	if (meUser.status === UserStatus.BLOCKED) {
		throw new AppError(HttpStatus.FORBIDDEN, "Your account has been blocked");
	}

	let profile = null;

	if (meUser.role === Role.CITIZEN) {
		profile = await prisma.citizenProfile.findUnique({
			where: { email: user.email },
		});
	} else if (meUser.role === Role.STAFF) {
		profile = await prisma.staffProfile.findUnique({
			where: { email: user.email },
			include: { department: true },
		});
	} else if (meUser.role === Role.ADMIN) {
		profile = await prisma.adminProfile.findUnique({
			where: { email: user.email },
		});
	}

	return { ...meUser, profile };
};

const userUpdate = async (payload: IUserUpdatePayload, user: IRequestUser) => {
	const existingUser = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!existingUser) {
		throw new AppError(HttpStatus.NOT_FOUND, "User not found");
	}

	if (existingUser.status === UserStatus.DELETED && existingUser.isDeleted) {
		throw new AppError(HttpStatus.FORBIDDEN, "Your account has been deleted");
	}

	if (existingUser.status === UserStatus.BLOCKED) {
		throw new AppError(HttpStatus.FORBIDDEN, "Your account has been blocked");
	}
	if (existingUser.status !== UserStatus.ACTIVE) {
		throw new AppError(HttpStatus.FORBIDDEN, "Your account has not Active");
	}

	const result = await prisma.$transaction(async (tx) => {
		const updatedUser = await tx.user.update({
			where: { id: user.userId },
			data: {
				name: payload.name,
				phone: payload.phone,
			},
			omit: { password: true },
		});

		let updatedProfile = null;

		if (existingUser.role === Role.CITIZEN) {
			updatedProfile = await tx.citizenProfile.update({
				where: { email: user.email },
				data: {
					name: payload.name,
					address: payload.citizen?.address,
				},
			});
		} else if (existingUser.role === Role.STAFF) {
			updatedProfile = await tx.staffProfile.update({
				where: { email: user.email },
				data: {
					address: payload.staff?.address,
					abouts: payload.staff?.abouts,
					experienceYears: payload.staff?.experienceYears,
					expertise: payload.staff?.expertise,
					name: payload.name,
				},
				include: { department: true },
			});
		} else if (existingUser.role === Role.ADMIN) {
			updatedProfile = await tx.adminProfile.update({
				where: { email: user.email },
				data: {
					name: payload.name,
					address: payload.admin?.address,
				},
			});
		}

		return { updatedUser, updatedProfile };
	});

	return { ...result.updatedUser, profile: result.updatedProfile };
};

const profileImage = async (buffer: Buffer, user: IRequestUser) => {
	const currentUser = await prisma.user.findUnique({
		where: { id: user.userId, role: user.role },
	});

	let currentProfile: {
		image_url: string | null;
		imagePublicId: string | null;
	} | null = null;

	if (user.role === Role.CITIZEN) {
		currentProfile = await prisma.citizenProfile.findUnique({
			where: { email: user.email },
			select: { image_url: true, imagePublicId: true },
		});
	} else if (user.role === Role.STAFF) {
		currentProfile = await prisma.staffProfile.findUnique({
			where: { email: user.email },
			select: { image_url: true, imagePublicId: true },
		});
	} else if (user.role === Role.ADMIN) {
		currentProfile = await prisma.adminProfile.findUnique({
			where: { email: user.email },
			select: { image_url: true, imagePublicId: true },
		});
	}

	if (currentProfile?.imagePublicId) {
		await cloudinary.uploader.destroy(currentProfile.imagePublicId, {
			resource_type: "image",
			invalidate: true,
		});
	}

	cloudinary.uploader
		.upload_stream({ resource_type: "auto" }, async (error, result) => {
			if (error) {
				throw new Error(error.message);
			}

			if (user.role === Role.CITIZEN) {
				currentProfile = await prisma.citizenProfile.update({
					where: { email: currentUser?.email },
					data: {
						image_url: result?.secure_url,
						imagePublicId: result?.public_id,
					},
				});
			} else if (user.role === Role.STAFF) {
				currentProfile = await prisma.staffProfile.update({
					where: { email: currentUser?.email },
					data: {
						image_url: result?.secure_url,
						imagePublicId: result?.public_id,
					},
				});
			} else if (user.role === Role.ADMIN) {
				currentProfile = await prisma.adminProfile.update({
					where: { email: currentUser?.email },
					data: {
						image_url: result?.secure_url,
						imagePublicId: result?.public_id,
					},
				});
			}
		})
		.end(buffer);

	return currentProfile;
};

export const UserService = {
	getMe,
	userUpdate,
	profileImage,
};
