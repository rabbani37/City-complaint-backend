import { Router } from "express";
import { ComplainsController } from "./complaints.controller";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
	"/",
	upload.fields([{ name: "complaintFiles", maxCount: 5 }]),
	auth(Role.CITIZEN),
	ComplainsController.createComplaint,
);

export const ComplaintRouter = router;
