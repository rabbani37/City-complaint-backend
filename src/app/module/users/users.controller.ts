import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";
import { UserService } from "./users.service";
import { fi } from "zod/locales";

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;
	const result = await UserService.getMe(user);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Retrive Users Profile successfully",
		data: result,
	});
});

const userUpdate = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;
	const payload = req.body;
	const result = await UserService.userUpdate(payload, user);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Updated Users Profile successfully",
		data: result,
	});
});

const profileImage = catchAsync(async (req: Request, res: Response) => {
	const file = req.file!;
	const user = req.user!;
	const result = await UserService.profileImage(file?.buffer, user);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Users Profile Photo Updated successfully",
		data: result,
	});
});

export const UsersController = {
	getMe,
	userUpdate,
	profileImage,
};
