import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";
import HttpStatus from "http-status";
import { IRequestUser } from "../auth/auth.interface";

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
const userActiveBlock = catchAsync(async (req: Request, res: Response) => {
	const adminId = req.user?.userId as string;
	const userId = req.params.id as string;
	const resutl = await AdminService.userActiveBlock(userId, adminId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Staff status changed successfully",
		data: resutl,
	});
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getDashboardStats();

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Dashboard statistics retrieved successfully",
		data: result,
	});
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
	const adminUser = req.user as IRequestUser;
	const targetUserId = req.params.id as string;
	const result = await AdminService.changeUserRole(
		targetUserId,
		req.body.role,
		adminUser,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "User role updated successfully",
		data: result,
	});
});

const staffActivetion = catchAsync(async (req: Request, res: Response) => {
	const adminUser = req.user as IRequestUser;
	const targetUserId = req.params.id as string;
	const result = await AdminService.staffActivetion(targetUserId, adminUser);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "User Activetion successfully",
		data: result,
	});
});

export const AdminController = {
	createAStaff,
	getAllStaff,
	userActiveBlock,
	getDashboardStats,
	changeUserRole,
	staffActivetion,
};
