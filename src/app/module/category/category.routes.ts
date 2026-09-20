import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/authRole";
import { validationRequest } from "../../middleware/validationRequest";
import { CategoryValidation } from "./category.validation";
import { CategoryController } from "./category.controller";

const router = Router();

router.post(
	"/",
	auth(Role.ADMIN),
	validationRequest(CategoryValidation.createCategorySchema),
	CategoryController.createCategory,
);

router.get("/", CategoryController.getAllCategories);

router.get("/:id", CategoryController.getCategoryById);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validationRequest(CategoryValidation.updateCategorySchema),
	CategoryController.updateCategory,
);

router.delete("/:id", auth(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;
