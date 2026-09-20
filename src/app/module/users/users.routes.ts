import { Router } from "express";
import { UsersController } from "./users.controller";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequest";
import { UserValidation } from "./users.validation";

const router = Router();

router.get(
	"/me",
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
	UsersController.getMe,
);

router.patch(
	"/me",
	validationRequest(UserValidation.updateUserSchema),
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
	UsersController.userUpdate,
);

export const UsersRoutes = router;
