import { Router } from "express";
import { UsersController } from "./users.controller";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
	"/me",
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
	UsersController.getMe,
);

export const UsersRoutes = router;
