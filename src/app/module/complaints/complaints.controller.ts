import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";
import { ComplainsServices } from "./complaints.service";

const createComplaint = catchAsync(async (req: Request, res: Response) => {
	const payload = JSON.parse(req.body.data);
	const userId = req.user?.userId as string;

	const files = req.files as {
		[fieldname: string]: Express.Multer.File[] | undefined;
	};
	const complaintFiles = files?.["complaintFiles"] || [];

	const result = await ComplainsServices.createComplaint(
		userId,
		payload,
		complaintFiles,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Create A Complaint Successfully",
		data: result,
	});
});

export const ComplainsController = {
	createComplaint,
};
