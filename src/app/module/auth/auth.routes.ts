import { Router } from "express";
import { validationRequest } from "../../middleware/validationRequest";
import { AuthValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";

const router = Router();

router.post(
	"/register",
	validationRequest(AuthValidation.registerCitizenSchema),
	AuthController.registerCitizen,
);
router.post(
	"/verify-account",
	// validationRequest(AuthValidation.registerCitizenSchema),
	AuthController.verifyAccount,
);

router.post(
	"/staff-apply",
	validationRequest(AuthValidation.registerStaffSchema),
	AuthController.registerStaff,
);

export const AuthRoutes = router;
