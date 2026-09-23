import HttpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import { IRequestUser } from "../auth/auth.interface";
import { IPaymentCallbackPayload } from "./payment.interface";

const paymentInitiate = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;
	const resutl = await paymentService.paymentInitiate(payload, user);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Payment initiate successfully",
		data: resutl,
	});
});

const paymentCallback = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const { redirectUrl } = await paymentService.paymentCallback(query);

	res.redirect(redirectUrl);
});

const getAllOwnPayments = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const query = req.query;
	const { data, meta } = await paymentService.getAllOwnPayments(user, query);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Your payments retrieved successfully",
		data,
		meta,
	});
});

export const PaymentController = {
	paymentInitiate,
	paymentCallback,
	getAllOwnPayments,
};
