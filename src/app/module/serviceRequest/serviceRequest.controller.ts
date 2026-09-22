// serviceRequest.controller.ts
import { Request, Response } from "express";
import HttpStatus from "http-status";
import { ServiceRequestService } from "./serviceRequest.service";
import { IRequestUser } from "../auth/auth.interface";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ServiceRequestValidation } from "./serviceRequest.validation";
import { AppError } from "../../utils/AppError";

const createServiceRequest = catchAsync(async (req: Request, res: Response) => {
	const payload = JSON.parse(req.body.data);

	const zodValidationResult =
		ServiceRequestValidation.createServiceRequestSchema.safeParse(payload);
	if (!zodValidationResult.success) {
		throw new Error(zodValidationResult.error.issues[0].message);
	}

	const userId = req.user?.userId as string;

	const files = req.files as {
		[fieldname: string]: Express.Multer.File[] | undefined;
	};
	const imagesFile = files?.["images"] || [];

	const result = await ServiceRequestService.createServiceRequest(
		userId,
		payload,
		imagesFile,
	);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Service request created successfully",
		data: result,
	});
});

const getAllServiceRequests = catchAsync(
	async (req: Request, res: Response) => {
		const result = await ServiceRequestService.getAllServiceRequests(
			req.query as any,
		);

		sendResponse(res, {
			statusCode: HttpStatus.OK,
			success: true,
			message: "Service requests retrieved successfully",
			data: result,
		});
	},
);

const getMyServiceRequests = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const result = await ServiceRequestService.getMyServiceRequests(
		user.userId,
		req.query as any,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Your service requests retrieved successfully",
		data: result,
	});
});

const getServiceRequestById = catchAsync(
	async (req: Request, res: Response) => {
		const serviceId = req.params.id as string;
		if (!serviceId) {
			throw new AppError(HttpStatus.NOT_FOUND, "Complaint id must required");
		}

		const user = req.user as IRequestUser;
		const result = await ServiceRequestService.getServiceRequestById(
			serviceId,
			user,
		);

		sendResponse(res, {
			statusCode: HttpStatus.OK,
			success: true,
			message: "Service request retrieved successfully",
			data: result,
		});
	},
);

const updateServiceRequestStatus = catchAsync(
	async (req: Request, res: Response) => {
		const serviceId = req.params.id as string;
		if (!serviceId) {
			throw new AppError(HttpStatus.NOT_FOUND, "Complaint id must required");
		}
		const user = req.user as IRequestUser;
		const result = await ServiceRequestService.updateServiceRequestStatus(
			serviceId,
			req.body,
			user,
		);

		sendResponse(res, {
			statusCode: HttpStatus.OK,
			success: true,
			message: "Service request status updated successfully",
			data: result,
		});
	},
);

export const ServiceRequestController = {
	createServiceRequest,
	getAllServiceRequests,
	getMyServiceRequests,
	getServiceRequestById,
	updateServiceRequestStatus,
};
