// taskAssigned.controller.ts
import { Request, Response } from "express";
import HttpStatus from "http-status";
import { TaskAssignedService } from "./taskAssigned.service";
import { IRequestUser } from "../auth/auth.interface";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const assignStaffToComplaint = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user as IRequestUser;

		const result = await TaskAssignedService.assignStaffToComplaint(
			req.params.id as string,
			req.body.staffId,
			user.userId,
		);

		sendResponse(res, {
			statusCode: HttpStatus.CREATED,
			success: true,
			message: "Staff assigned successfully",
			data: result,
		});
	},
);

const reassignStaff = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await TaskAssignedService.reassignStaff(
		req.params.id as string,
		req.body.staffId,
		user.userId,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Staff reassigned successfully",
		data: result,
	});
});

const getMyAssignments = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const query = req.query;
	const result = await TaskAssignedService.getMyAssignments(user.userId, query);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Your assignments retrieved successfully",
		data: result,
	});
});

export const TaskAssignedController = {
	assignStaffToComplaint,
	reassignStaff,
	getMyAssignments,
};
