import HttpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	ICreateDepartmentPayload,
	IUpdatedDepartmentPayload,
} from "./department.interface";
import { IQuery } from "../../interfaces";
import { DepartmentWhereInput } from "../../../generated/prisma/models";

const createDepartment = async (payload: ICreateDepartmentPayload) => {
	const existing = await prisma.department.findUnique({
		where: { name: payload.name },
	});

	if (existing) {
		throw new AppError(
			HttpStatus.CONFLICT,
			"Department with this name already exists",
		);
	}

	const result = await prisma.department.create({
		data: payload,
	});

	return result;
};

const getAllDepartments = async (query: IQuery) => {
	// search , filter, sorting, pagination

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: DepartmentWhereInput[] = [{ isDeleted: false }];

	// find Department name by searchBox or searchTerm || searching
	if (query.searchTerm) {
		andCondition.push({
			OR: [{ name: { contains: query.searchTerm, mode: "insensitive" } }],
		});
	}

	// filter by queary parameter || Filtering
	if (query.name) {
		andCondition.push({
			name: { contains: query.name, mode: "insensitive" },
		});
	}

	const allDepartments = await prisma.department.findMany({
		where: {
			AND: andCondition,
		},

		// sorting,
		orderBy: {
			[sortBy]: sortOrder,
		},

		// pagination
		take: limit,
		skip: skip,
	});
	const totalDepartmentCount = await prisma.department.count({
		where: {
			AND: andCondition,
		},
	});

	return {
		data: allDepartments,
		meta: {
			page: page,
			limit: limit,
			skip: skip,
			total: totalDepartmentCount,
			totalPages: Math.ceil(totalDepartmentCount / limit),
		},
	};
};

const getDepartmentById = async (id: string) => {
	const department = await prisma.department.findUnique({
		where: { id, isDeleted: false },
		include: { categories: true },
	});

	if (!department) {
		throw new AppError(HttpStatus.NOT_FOUND, "Department not found");
	}

	return department;
};

const updateDepartment = async (
	id: string,
	payload: IUpdatedDepartmentPayload,
) => {
	const department = await prisma.department.findUnique({
		where: { id, isDeleted: false },
	});

	if (!department) {
		throw new AppError(HttpStatus.NOT_FOUND, "Department not found");
	}

	const nameExists = await prisma.department.findFirst({
		where: { name: payload.name.trim(), id: { not: id } },
	});
	if (nameExists) {
		throw new AppError(
			HttpStatus.CONFLICT,
			"Department with this name already exists",
		);
	}

	const result = await prisma.department.update({
		where: { id },
		data: payload,
	});

	return result;
};

const deleteDepartment = async (id: string) => {
	const department = await prisma.department.findUnique({
		where: { id, isDeleted: false },
	});

	if (!department) {
		throw new AppError(HttpStatus.NOT_FOUND, "Department not found");
	}

	const result = await prisma.department.update({
		where: { id },
		data: { deletedAt: new Date(), isDeleted: true },
	});

	return result;
};

export const DepartmentService = {
	createDepartment,
	getAllDepartments,
	getDepartmentById,
	updateDepartment,
	deleteDepartment,
};
