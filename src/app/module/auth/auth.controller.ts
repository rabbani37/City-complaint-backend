import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";

const registerCitizen = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.registerCitizen(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Verify Account Please...",
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



const registerStaff = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.registerStaff(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Staff application submitted. Waiting for admin approval.",
		data: result,
	});
});

export const AuthController = {
	registerCitizen,
	verifyAccount,
	registerStaff,
};
