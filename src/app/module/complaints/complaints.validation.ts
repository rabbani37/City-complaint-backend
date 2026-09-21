// complaint.validation.ts
import { z } from "zod";
import { ComplaintStatus } from "../../../generated/prisma/enums";

const createComplaintSchema = z.object({
	title: z
		.string("Title is required")
		.trim()
		.min(5, "Title must be at least 5 characters")
		.max(150, "Title must be under 150 characters"),

	description: z
		.string("Description is required")
		.trim()
		.min(10, "Description must be at least 10 characters")
		.max(2000, "Description must be under 2000 characters"),

	location: z.string().trim().min(1, "Location cannot be empty"),

	latitude: z
		.number("Latitude must be a number")
		.min(-90, "Invalid latitude")
		.max(90, "Invalid latitude"),

	longitude: z
		.number("Longitude must be a number")
		.min(-180, "Invalid longitude")
		.max(180, "Invalid longitude"),

	categoryId: z.string("Category is required"),
});

export type TCreateComplainInput = z.infer<typeof createComplaintSchema>;

const updateStatusSchema = z.object({
	status: z.enum(
		[
			ComplaintStatus.ASSIGNED,
			ComplaintStatus.IN_PROGRESS,
			ComplaintStatus.RESOLVED,
			ComplaintStatus.CLOSED,
		],
		{ error: "Invalid status value" },
	),
	note: z.string().trim().optional(), // status change এর সাথে optional note
});

export const ComplaintValidation = {
	createComplaintSchema, // আগের থেকে
	updateStatusSchema,
};
