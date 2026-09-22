// feedback.service.ts
import HttpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ComplaintStatus } from "../../../generated/prisma/enums";
import { ICreateFeedbackPayload } from "./feedback.interface";

// ---------------- CREATE FEEDBACK ----------------
const createFeedback = async (
	complaintId: string,
	citizenId: string,
	payload: ICreateFeedbackPayload,
) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId, isDeleted: false },
		include: { feedback: true },
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	if (complaint.citizenId !== citizenId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to give feedback on this complaint",
		);
	}

	if (complaint.status !== ComplaintStatus.RESOLVED) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Feedback can only be given on a resolved complaint",
		);
	}

	if (complaint.feedback) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Feedback already submitted for this complaint",
		);
	}

	const result = await prisma.$transaction(async (tx) => {
		const feedback = await tx.feedback.create({
			data: {
				complaintId,
				citizenId,
				rating: payload.rating,
				comment: payload.comment,
			},
		});

		await tx.complaint.update({
			where: { id: complaintId },
			data: { status: ComplaintStatus.CLOSED },
		});

		return feedback;
	});

	return result;
};

// ---------------- GET FEEDBACK ----------------
const getFeedbackByComplaintId = async (complaintId: string) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId, isDeleted: false },
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	const feedback = await prisma.feedback.findUnique({
		where: { complaintId },
		include: {
			citizen: { select: { name: true } },
		},
	});

	if (!feedback) {
		throw new AppError(
			HttpStatus.NOT_FOUND,
			"No feedback found for this complaint",
		);
	}

	return feedback;
};

export const FeedbackService = {
	createFeedback,
	getFeedbackByComplaintId,
};
