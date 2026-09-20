import { Request, Response } from "express";
import HttpStatus from "http-status";

import { CategoryService } from "./category.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

const createCategory = catchAsync(async (req: Request, res: Response) => {
	const result = await CategoryService.createCategory(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Category created successfully",
		data: result,
	});
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const result = await CategoryService.getAllCategories(query);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Categories retrieved successfully",
		data: result,
	});
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
	const categoryId = req.params.id as string;
	if (!categoryId) {
		throw new AppError(HttpStatus.FORBIDDEN, "CategoryId is Required");
	}
	const result = await CategoryService.getCategoryById(categoryId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Category retrieved successfully",
		data: result,
	});
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
	const categoryId = req.params.id as string;
	if (!categoryId) {
		throw new AppError(HttpStatus.FORBIDDEN, "CategoryId is Required");
	}
	const payload = req.body;

	const result = await CategoryService.updateCategory(categoryId, payload);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Category updated successfully",
		data: result,
	});
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
	const categoryId = req.params.id as string;
	if (!categoryId) {
		throw new AppError(HttpStatus.FORBIDDEN, "CategoryId is Required");
	}
	const result = await CategoryService.deleteCategory(categoryId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Category deleted successfully",
		data: result,
	});
});

export const CategoryController = {
	createCategory,
	getAllCategories,
	getCategoryById,
	updateCategory,
	deleteCategory,
};
