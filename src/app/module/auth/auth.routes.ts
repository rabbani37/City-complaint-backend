import { Router } from "express";
import { validationRequest } from "../../middleware/validationRequest";
import { AuthValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
	"/register",
	validationRequest(AuthValidation.registerCitizenSchema),
	AuthController.registerCitizen,
);
router.post(
	"/verify-account",
	validationRequest(AuthValidation.accountVerifySchema),
	AuthController.verifyAccount,
);
router.post(
	"/login",
	validationRequest(AuthValidation.loginSchema),
	AuthController.loginUser,
);
router.post("/google", AuthController.googleLogin);
router.post(
	"/refresh-token",
	auth(Role.STAFF, Role.CITIZEN, Role.ADMIN),
	AuthController.refreshToken,
);

router.post(
	"/staff-apply",
	validationRequest(AuthValidation.registerStaffSchema),
	AuthController.registerStaff,
);

export const AuthRoutes = router;
