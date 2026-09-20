import { Router } from "express";
import { auth } from "../../middleware/authRole";
import { Role } from "../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequest";
import { DepartmentController } from "./department.controller";
import { DepartmentValidation } from "./department.validation";

const router = Router();

router.post(
	"/",
	auth(Role.ADMIN),
	validationRequest(DepartmentValidation.createDepartmentSchema),
	DepartmentController.createDepartment,
);

router.get("/", DepartmentController.getAllDepartments);

router.get("/:id", DepartmentController.getDepartmentById);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validationRequest(DepartmentValidation.updateDepartmentSchema),
	DepartmentController.updateDepartment,
);

router.delete("/:id", auth(Role.ADMIN), DepartmentController.deleteDepartment);

export const DepartmentRoutes = router;
