// feedback.validation.ts
import { z } from "zod";

const createFeedbackSchema = z.object({
	rating: z
		.number("Rating is required")
		.int("Rating must be a whole number")
		.min(1, "Rating must be between 1 and 5")
		.max(5, "Rating must be between 1 and 5"),
	comment: z
		.string()
		.trim()
		.max(500, "Comment must be under 500 characters")
		.optional(),
});

export const FeedbackValidation = {
	createFeedbackSchema,
};
