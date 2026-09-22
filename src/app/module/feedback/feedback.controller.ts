// feedback.controller.ts
import { Request, Response } from "express";
import HttpStatus from "http-status";
import { FeedbackService } from "./feedback.service";
import { IRequestUser } from "../auth/auth.interface";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createFeedback = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const complaintId = req.params.id as string;
	const payload = req.body;
	const result = await FeedbackService.createFeedback(
		complaintId,
		userId,
		payload,
	);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Feedback submitted successfully",
		data: result,
	});
});

const getFeedbackByComplaintId = catchAsync(
	async (req: Request, res: Response) => {
		const complaintId = req.params.id as string;
		const result = await FeedbackService.getFeedbackByComplaintId(complaintId);

		sendResponse(res, {
			statusCode: HttpStatus.OK,
			success: true,
			message: "Feedback retrieved successfully",
			data: result,
		});
	},
);

export const FeedbackController = {
	createFeedback,
	getFeedbackByComplaintId,
};
