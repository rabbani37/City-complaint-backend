import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";
import { ComplainsServices } from "./complaints.service";
import { IRequestUser } from "../auth/auth.interface";
import { ComplaintValidation } from "./complaints.validation";

const createComplaint = catchAsync(async (req: Request, res: Response) => {
	const payload = JSON.parse(req.body.data);

	const zodValidationResult =
		ComplaintValidation.createComplaintSchema.safeParse(payload);
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
		data,
		meta,
	});
});

const getMyComplaints = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const query = req.query;
	const { data, meta } = await ComplainsServices.getMyComplaints(
		user.userId,
		query,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Your complaints retrieved successfully",
		data: data,
		meta,
	});
});

const getComplaintById = catchAsync(async (req: Request, res: Response) => {
	const complaintId = req.params.id as string;
	const user = req.user as IRequestUser;
	if (!complaintId) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint id must required");
	}
	const result = await ComplainsServices.getComplaintById(complaintId, user);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Complaint retrieved successfully",
		data: result,
	});
});

const updateComplaintStatus = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user as IRequestUser;
		const complaintId = req.params.id as string;
		if (!complaintId) {
			throw new AppError(HttpStatus.NOT_FOUND, "Complaint id must required");
		}

		const result = await ComplainsServices.updateComplaintStatus(
			complaintId,
			req.body,
			user,
		);

		sendResponse(res, {
			statusCode: HttpStatus.OK,
			success: true,
			message: "Complaint status updated successfully",
			data: result,
		});
	},
);

const deleteComplaint = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const complaintId = req.params.id as string;
	if (!complaintId) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint id must required");
	}
	const result = await ComplainsServices.deleteComplaint(complaintId, user);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Complaint deleted successfully",
		data: result,
	});
});

const reopenComplaint = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const complaintId = req.params.id as string;
	if (!complaintId) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint id must required");
	}
	const result = await ComplainsServices.reopenComplaint(
		complaintId,
		user.userId,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Complaint reopened successfully",
		data: result,
	});
});

export const ComplainsController = {
	createComplaint,
	getALLComplaint,
	getMyComplaints,
	getComplaintById,
	updateComplaintStatus,
	deleteComplaint,
	reopenComplaint,
};
