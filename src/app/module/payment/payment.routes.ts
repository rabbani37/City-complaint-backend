import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { validationRequest } from "../../middleware/validationRequest";
import { serviceRequestSchema } from "./payment.validation";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
	"/service/initiate",
	auth(Role.CITIZEN),
	validationRequest(serviceRequestSchema),
	PaymentController.paymentInitiate,
);
router.get("/service/callback", PaymentController.paymentCallback);
router.get(
	"/my-payments",
	auth(Role.CITIZEN),
	PaymentController.getAllOwnPayments,
);

export const PaymentRoutes = router;
