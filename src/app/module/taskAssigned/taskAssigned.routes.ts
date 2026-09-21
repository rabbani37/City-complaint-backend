// taskAssigned.routes.ts
import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";

import { TaskAssignedValidation } from "./taskAssigned.validation";
import { TaskAssignedController } from "./taskAssigned.controller";
import { auth } from "../../middleware/authRole";
import { validationRequest } from "../../middleware/validationRequest";

const router = Router();

// এটা complaint.routes.ts এ ও বসানো যায়, অথবা আলাদা রাখতে পারো
router.post(
	"/complaints/:id/assign",
	auth(Role.ADMIN),
	validationRequest(TaskAssignedValidation.assignStaffSchema),
	TaskAssignedController.assignStaffToComplaint,
);

router.get(
	"/staff/my-assignments",
	auth(Role.STAFF),
	TaskAssignedController.getMyAssignments,
);

router.patch(
	"/assignments/:id/reassign",
	auth(Role.ADMIN),
	validationRequest(TaskAssignedValidation.reassignStaffSchema),
	TaskAssignedController.reassignStaff,
);

export const TaskAssignedRoutes = router;
