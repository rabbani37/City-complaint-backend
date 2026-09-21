import { Router } from "express";
import { ComplainsController } from "./complaints.controller";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequest";
import { ComplaintValidation } from "./complaints.validation";

const router = Router();

router.post(
	"/",
	upload.fields([{ name: "complaintFiles", maxCount: 5 }]),
	auth(Role.CITIZEN),
	ComplainsController.createComplaint,
);

router.get("/", ComplainsController.getALLComplaint);

router.get(
	"/my-complaints",
	auth(Role.CITIZEN),
	ComplainsController.getMyComplaints,
);

router.patch(
	"/:id/status",
	auth(Role.STAFF, Role.ADMIN),
	validationRequest(ComplaintValidation.updateStatusSchema),
	ComplainsController.updateComplaintStatus,
);

router.get(
	"/:id",
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
	ComplainsController.getComplaintById,
);

router.delete(
	"/:id",
	auth(Role.CITIZEN, Role.ADMIN),
	ComplainsController.deleteComplaint,
);

router.post(
	"/:id/reopen",
	auth(Role.CITIZEN),
	ComplainsController.reopenComplaint,
);

export const ComplaintsRoutes = router;
