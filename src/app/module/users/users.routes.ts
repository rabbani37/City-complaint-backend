import { Router } from "express";
import { UsersController } from "./users.controller";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequest";
import { UserValidation } from "./users.validation";
import { upload } from "../../lib/multer";

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

router.patch(
	"/me/profileImage",
	upload.single("profileImage"),
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
	UsersController.profileImage,
);

export const UsersRoutes = router;
