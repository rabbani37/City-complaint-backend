import HttpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

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

export const PaymentController = {
	paymentInitiate,
	paymentCallback,
};
