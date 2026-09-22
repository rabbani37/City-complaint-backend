import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { ServiceRequestController } from "./serviceRequest.controller";
import { auth } from "../../middleware/authRole";
import { validationRequest } from "../../middleware/validationRequest";
import { ServiceRequestValidation } from "./serviceRequest.validation";

const router = Router();

router.post(
	"/",
	auth(Role.CITIZEN),
	upload.fields([{ name: "images", maxCount: 5 }]),
	ServiceRequestController.createServiceRequest,
);

router.get(
	"/",
	auth(Role.STAFF, Role.ADMIN),
	ServiceRequestController.getAllServiceRequests,
);

router.get(
	"/my-requests",
	auth(Role.CITIZEN),
	ServiceRequestController.getMyServiceRequests,
);

router.get(
	"/:id",
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
	ServiceRequestController.getServiceRequestById,
);

router.patch(
	"/:id/status",
	auth(Role.STAFF, Role.ADMIN),
	validationRequest(ServiceRequestValidation.updateStatusSchema),
	ServiceRequestController.updateServiceRequestStatus,
);

export const ServiceRequestRoutes = router;
