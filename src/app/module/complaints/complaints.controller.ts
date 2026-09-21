import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";
import { ComplainsServices } from "./complaints.service";
import { createComplaintSchema } from "./complaints.validation";
import { prisma } from "../../lib/prisma";

const createComplaint = catchAsync(async (req: Request, res: Response) => {
	const payload = JSON.parse(req.body.data);

	const zodValidationResult = createComplaintSchema.safeParse(payload);
	if (!zodValidationResult.success) {
		throw new Error(zodValidationResult.error.issues[0].message);
	}

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
const getALLComplaint = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const { data, meta } = await ComplainsServices.getALLComplaint(query);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Retrive All Complaints Successfully",
		data: data,
		meta: meta,
	});
});

export const ComplainsController = {
	createComplaint,
	getALLComplaint,
};
