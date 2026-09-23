import { Router } from "express";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";
import { AdminController } from "./admin.controller";
import { validationRequest } from "../../middleware/validationRequest";
import { AdminValidation } from "./admin.validation";

const router = Router();

router.get("/staff", auth(Role.ADMIN), AdminController.getAllStaff);
router.post("/staff", auth(Role.ADMIN), AdminController.createAStaff);
router.patch(
	"/users/:id/status",
	auth(Role.ADMIN),
	AdminController.userActiveBlock,
);

router.get(
	"/dashboard-stats",
	auth(Role.ADMIN),
	AdminController.getDashboardStats,
);

router.patch(
	"/users/:id/role",
	auth(Role.ADMIN),
	validationRequest(AdminValidation.changeUserRoleSchema),
	AdminController.changeUserRole,
);
router.patch(
	"/users/:id/activetion",
	auth(Role.ADMIN),
	AdminController.staffActivetion,
);

export const AdminRoutes = router;
