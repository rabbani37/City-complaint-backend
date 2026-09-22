import { Router } from "express";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";
import { AdminController } from "./admin.controller";

const router = Router();

router.get("/staff", auth(Role.ADMIN), AdminController.getAllStaff);
router.post("/staff", auth(Role.ADMIN), AdminController.createAStaff);

export const AdminRoutes = router;
