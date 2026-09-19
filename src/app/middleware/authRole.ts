import type { NextFunction, Request, Response } from "express";
import type { Role } from "../../generated/prisma/enums";
import type { IRequestUser } from "../module/auth/auth.interface";
import { catchAsync } from "../utils/catchAsync";
import HttpStatus from "http-status";
import { AppError } from "../utils/AppError";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import type { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

declare global {
	namespace Express {
		interface Request {
			user?: IRequestUser;
		}
	}
}

export const auth = (...requiredRoles: Role[]) => {
	return catchAsync(
		async (req: Request, _res: Response, next: NextFunction) => {
			const token = req.cookies.accessToken
				? req.cookies.accessToken
				: req.headers.authorization?.startsWith("Bearer ")
					? req.headers.authorization?.split(" ")[1]
					: req.headers.authorization;

			if (!token) {
				throw new AppError(
					HttpStatus.NOT_FOUND,
					"You are not logged in. Please log in to access this resource.",
				);
			}

			const verifiedToken = jwtUtils.verifyToken(
				token,
				config.jwt_access_secret,
			);

			if (!verifiedToken.success) {
				throw new AppError(
					HttpStatus.INTERNAL_SERVER_ERROR,
					verifiedToken.error,
				);
			}

			const { email, name, userId, role } = verifiedToken.data as JwtPayload;

			if (requiredRoles.length && !requiredRoles.includes(role)) {
				throw new AppError(
					HttpStatus.FORBIDDEN,
					"Forbidden. You don't have permission to access this resource.",
				);
			}

			const user = await prisma.user.findUnique({
				where: {
					id: userId,
					email,
					name,
					role,
				},
			});

			if (!user) {
				throw new Error("User not found. Please log in again.");
			}

			if (user.status === "BLOCKED") {
				throw new AppError(
					HttpStatus.NOT_ACCEPTABLE,
					"Your account has been blocked. Please contact support.",
				);
			}

			req.user = {
				email,
				name,
				userId,
				role,
			};

			next();
		},
	);
};
