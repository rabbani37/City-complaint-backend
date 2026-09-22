import { Server } from "http";
import {
	PaymentStatus,
	ServiceRequestStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bKash";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IRequestUser } from "../auth/auth.interface";
import { IPaymetnInitatePayload } from "./payment.interface";
import HttpStatus from "http-status";

const paymentInitiate = async (
	payload: IPaymetnInitatePayload,
	user: IRequestUser,
) => {
	// 1. Transaction-er baire read operation korun performace ebong deadlock avoid korar jonno
	const serviceRequest = await prisma.serviceRequest.findUnique({
		where: { id: payload.serviceRequestId, isDeleted: false },
		include: { payment: true },
	});

	if (!serviceRequest) {
		throw new AppError(HttpStatus.NOT_FOUND, "Service Request Not Found!");
	}

	if (serviceRequest.citizenId !== user.userId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to pay for this service request",
		);
	}

	if (serviceRequest.status !== ServiceRequestStatus.PENDING_PAYMENT) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			`Cannot initiate payment. Current status is ${serviceRequest.status}`,
		);
	}

	if (
		serviceRequest.payment &&
		serviceRequest.payment.status === PaymentStatus.PAID
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Payment already completed for this request",
		);
	}

	const bkashIdToken = await getBkashIdToken();
	const bkashUrlResponse = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				authorization: bkashIdToken,
				"x-app-key": config.bkash_app_key,
			},
			body: JSON.stringify({
				mode: "0011",
				payerReference: user.email,
				callbackURL: `${config.bKash_callback_url}/service/callback`,
				amount: serviceRequest.fee,
				currency: "BDT",
				intent: "sale",
				merchantInvoiceNumber: serviceRequest.id || "abc11", // Proti bar unique korte chaile dynamic tracking ID use korte paren
			}),
		},
	);

	const bkashUrlResult = await bkashUrlResponse.json();

	if (!bkashUrlResult.bkashURL) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			bkashUrlResult.errorMessage || "Failed to create bKash payment URL",
		);
	}

	// 3. Database Write Operations dynamic (Upsert logic)
	const transaction = await prisma.$transaction(async (tx) => {
		if (serviceRequest.payment) {
			await tx.payment.update({
				where: { id: serviceRequest.payment.id },
				data: {
					merchantInvoiceNumber: bkashUrlResult.merchantInvoiceNumber,
					amount: serviceRequest.fee,
					gatewayResponse: bkashUrlResult,
					bkashPaymentId: bkashUrlResult.paymentID,
					payerReference: user.email,
					status: PaymentStatus.UNPAID, // Status-ti abr initiate (UNPAID) hobe
				},
			});
		} else {
			await tx.payment.create({
				data: {
					merchantInvoiceNumber: bkashUrlResult.merchantInvoiceNumber,
					serviceRequestId: serviceRequest.id,
					amount: serviceRequest.fee,
					gatewayResponse: bkashUrlResult,
					bkashPaymentId: bkashUrlResult.paymentID,
					payerReference: user.email,
					status: PaymentStatus.UNPAID,
				},
			});
		}

		return { paymentURL: bkashUrlResult.bkashURL };
	});

	return transaction;
};

const paymentCallback = async (query: any) => {
	const transactionResult = await prisma.$transaction(async (tx) => {
		const bkashIdToken = await getBkashIdToken();
		const paymentID = query.paymentID;
		const status = query.status;

		if (!bkashIdToken) {
			throw new Error("No Bkash Access Token Found!");
		}
		if (!paymentID) {
			throw new Error("Payment ID Missing");
		}
		if (!status) {
			throw new Error("Payment Status Missing");
		}

		const executePaymenResponse = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/execute`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					authorization: bkashIdToken,
					"x-app-key": config.bkash_app_key,
				},
				body: JSON.stringify({ paymentID }),
			},
		);

		const executePaymentResult = await executePaymenResponse.json();

		if (status === "success") {
			await tx.serviceRequest.update({
				where: {
					id: executePaymentResult.merchantInvoiceNumber,
				},
				data: {
					status: ServiceRequestStatus.PAID,
				},
			});

			await tx.payment.update({
				where: {
					bkashPaymentId: paymentID,
				},
				data: {
					status: PaymentStatus.PAID,
					bkashTrxId: executePaymentResult.trxID,
					paidAt: executePaymentResult.paymentExecuteTime,
					gatewayResponse: executePaymentResult,
				},
			});

			return {
				redirectUrl: `${config.frontend_url}/dashboard/service?status=success`,
			};
		} else if (status === "failure") {
			await tx.payment.update({
				where: {
					id: executePaymentResult.merchantInvoiceNumber,
					bkashPaymentId: paymentID,
				},
				data: {
					status: PaymentStatus.FAILED,
					gatewayResponse: executePaymentResult,
				},
			});

			return {
				redirectUrl: `${config.frontend_url}/dashboard/service?status=failure`,
			};
		} else if (status === "cancel") {
			await tx.payment.update({
				where: {
					appointmentId: executePaymentResult.merchantInvoiceNumber,
					bkashPaymentId: paymentID,
				},
				data: {
					status: PaymentStatus.CANCELLED,
					gatewayResponse: executePaymentResult,
				},
			});

			return {
				redirectUrl: `${config.frontend_url}/dashboard/service?status=cancel`,
			};
		} else {
			return {
				redirectUrl: `${config.frontend_url}/dashboard/service?status=error`,
			};
		}
	});

	return transactionResult;
};

export const paymentService = {
	paymentInitiate,
	paymentCallback,
};
