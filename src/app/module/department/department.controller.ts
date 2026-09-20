import { Request, Response } from "express";
import HttpStatus from "http-status";
import { DepartmentService } from "./department.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
	const result = await DepartmentService.createDepartment(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Department created successfully",
		data: result,
	});
});

const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await DepartmentService.getAllDepartments(
		req.query as any,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Departments retrieved successfully",
		data: data,
		meta,
	});
});

const getDepartmentById = catchAsync(async (req: Request, res: Response) => {
	const departmentId = req.params.id as string;
	const result = await DepartmentService.getDepartmentById(departmentId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Department retrieved successfully",
		data: result,
	});
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
	const departmentId = req.params.id as string;

	const result = await DepartmentService.updateDepartment(
		departmentId,
		req.body,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Department updated successfully",
		data: result,
	});
});

const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
	const departmentId = req.params.id as string;

	const result = await DepartmentService.deleteDepartment(departmentId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Department deleted successfully",
		data: result,
	});
});

export const DepartmentController = {
	createDepartment,
	getAllDepartments,
	getDepartmentById,
	updateDepartment,
	deleteDepartment,
};
