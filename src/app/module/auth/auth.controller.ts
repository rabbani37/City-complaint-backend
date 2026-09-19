import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";
import config from "../../config";

const registerCitizen = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.registerCitizen(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: " Please! Verify Account ",
		data: result,
	});
});

const verifyAccount = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.verifyAccount(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Verification Successfully",
		data: result,
	});
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
	const { accessToken, refreshToken } = await AuthService.loginUser(req.body);

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "User Login Successfully",
		data: { accessToken, refreshToken },
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const { refreshToken, accessToken } = await AuthService.googleLogin(req.body);

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Google Login Successfully",
		data: { accessToken, refreshToken },
	});
});

const registerStaff = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.registerStaff(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Staff application submitted. Waiting for admin approval.",
		data: result,
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken) {
		throw new Error("Refresh token is missing");
	}
	const result = await AuthService.refreshToken(req.cookies.refreshToken);
	const { accessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken: newRefreshToken,
		},
	});
});

// auth.controller.ts
const logOut = catchAsync(async (_req: Request, res: Response) => {
	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: false,
		sameSite: "none",
	});
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: false,
		sameSite: "none",
	});

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "User Logged out successfully",
		data: {},
	});
});

export const AuthController = {
	registerCitizen,
	verifyAccount,
	loginUser,
	googleLogin,
	registerStaff,
	refreshToken,
	logOut,
};
