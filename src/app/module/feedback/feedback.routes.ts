// এটা complaint.routes.ts এর মধ্যেই বসাতে পারো, অথবা আলাদা feedback.routes.ts
import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { FeedbackValidation } from "./feedback.validation";
import { FeedbackController } from "./feedback.controller";
import { validationRequest } from "../../middleware/validationRequest";
import { auth } from "../../middleware/authRole";

const router = Router();

router.post(
	"/:id/feedback",
	auth(Role.CITIZEN),
	validationRequest(FeedbackValidation.createFeedbackSchema),
	FeedbackController.createFeedback,
);

router.get(
	"/:id/feedback",
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
	FeedbackController.getFeedbackByComplaintId,
);

export const FeedbackRoutes = router;
