import HttpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	ICreateCategoryPayload,
	IUpdateCategoryPayload,
} from "./category.interface";
import { IQuery } from "../../interfaces";
import { CategoryWhereInput } from "../../../generated/prisma/models";
import { CategoryTypes } from "../../../generated/prisma/enums";

const createCategory = async (payload: ICreateCategoryPayload) => {
	const department = await prisma.department.findUnique({
		where: { id: payload.departmentId, isDeleted: false },
	});

	if (!department) {
		throw new AppError(HttpStatus.NOT_FOUND, "Department not found");
	}

	const existing = await prisma.category.findUnique({
		where: { name: payload.name, isDeleted: false },
	});

	if (existing) {
		throw new AppError(
			HttpStatus.CONFLICT,
			"Category with this name already exists",
		);
	}

	if (!payload.isPaid && payload.type !== CategoryTypes.COMPLAIN) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"If Type is false, category type must be COMPLAIN",
		);
	}

	if (payload.type === CategoryTypes.SERVICE) {
		if (!payload.isPaid) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Service category must have Paid",
			);
		}
		if (!payload.fee || Number(payload.fee) <= 0) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Paid service category must have a fee greater than 0",
			);
		}
	}
	if (payload.type === CategoryTypes.COMPLAIN) {
		if (payload.isPaid) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Complain category fee must have false",
			);
		}
	}

	if (!payload.isPaid && payload.type === CategoryTypes.COMPLAIN) {
		if (payload.fee && Number(payload.fee) > 0) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Free complaint category cannot have a fee",
			);
		}
	}

	const result = await prisma.category.create({
		data: {
			name: payload.name,
			departmentId: payload.departmentId,
			isPaid: payload.isPaid,
			type: payload.type,
			fee: payload.fee,
		},
		include: { department: true },
	});

	return result;
};

const getAllCategories = async (query: IQuery) => {
	// search , filter, sorting, pagination

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: CategoryWhereInput[] = [
		{ isDeleted: false, deletedAt: null },
	];

	// find Category name by searchBox or searchTerm || searching
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

	if (query.type) {
		andCondition.push({
			type: query.type,
		});
	}
	if (query.isPaid) {
		const Paid = query.isPaid === "true" ? true : false!;
		andCondition.push({
			isPaid: Paid,
		});
	}

	if (query.fee) {
		const feeNumber = Number(query.fee);
		if (feeNumber) {
			andCondition.push({
				fee: feeNumber,
			});
		}
	}

	const allCategories = await prisma.category.findMany({
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
	const totalCategoriesCount = await prisma.category.count({
		where: {
			AND: andCondition,
		},
	});

	return {
		data: allCategories,
		meta: {
			page,
			limit,
			total: totalCategoriesCount,
			totalPages: Math.ceil(totalCategoriesCount / limit),
		},
	};
};

const getCategoryById = async (id: string) => {
	const category = await prisma.category.findUnique({
		where: { id, deletedAt: null, isDeleted: false },
		include: { department: true },
	});

	if (!category) {
		throw new AppError(HttpStatus.NOT_FOUND, "Category not found");
	}

	return category;
};

const updateCategory = async (id: string, payload: IUpdateCategoryPayload) => {
	const category = await prisma.category.findUnique({
		where: { id, deletedAt: null },
	});

	if (!category) {
		throw new AppError(HttpStatus.NOT_FOUND, "Category not found");
	}

	if (payload.name) {
		const nameExists = await prisma.category.findFirst({
			where: { name: payload.name, id: { not: id } },
		});
		if (nameExists) {
			throw new AppError(
				HttpStatus.CONFLICT,
				"Category with this name already exists",
			);
		}
	}

	if (payload.type === CategoryTypes.SERVICE) {
		if (!payload.isPaid) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Service category must have Paid",
			);
		}
		if (!payload.fee || Number(payload.fee) <= 0) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Paid service category must have a fee greater than 0",
			);
		}
	}
	if (payload.type === CategoryTypes.COMPLAIN) {
		if (payload.isPaid) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Complain category fee must have false",
			);
		}
	}

	if (!payload.isPaid && payload.type === CategoryTypes.COMPLAIN) {
		if (payload.fee && Number(payload.fee) > 0) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Free complaint category cannot have a fee",
			);
		}
	}

	const result = await prisma.category.update({
		where: { id },
		data: payload,
		include: { department: true },
	});

	return result;
};

const deleteCategory = async (id: string) => {
	const category = await prisma.category.findUnique({
		where: { id, deletedAt: null, isDeleted: false },
	});

	if (!category) {
		throw new AppError(HttpStatus.NOT_FOUND, "Category not found");
	}

	const result = await prisma.category.update({
		where: { id },
		data: { deletedAt: new Date(), isDeleted: true },
	});

	return result;
};

export const CategoryService = {
	createCategory,
	getAllCategories,
	getCategoryById,
	updateCategory,
	deleteCategory,
};
