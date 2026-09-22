import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";
import HttpStatus from "http-status";

const getAllStaff = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await AdminService.getAllStaff(req.query as any);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Staff list retrieved successfully",
		data,
		meta,
	});
});

const createAStaff = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const payload = req.body;
	const resutl = await AdminService.createAStaff(payload, userId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "New Staff Created successfully",
		data: resutl,
	});
});

export const AdminController = {
	createAStaff,
	getAllStaff,
};
