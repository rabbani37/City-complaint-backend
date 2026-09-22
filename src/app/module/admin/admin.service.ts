import { Role, UserStatus } from "../../../generated/prisma/enums";
import { UserWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IRegistrationStaffPayload } from "../auth/auth.interface";
import HttpStatus from "http-status";
import bcrypt from "bcrypt";

const getAllStaff = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: UserWhereInput[] = [
		{ role: Role.STAFF, isDeleted: false },
	];

	if (query.searchTerm) {
		andCondition.push({
			OR: [
				{ name: { contains: query.searchTerm, mode: "insensitive" } },
				{ email: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.status) {
		andCondition.push({ status: query.status });
	}

	const staff = await prisma.user.findMany({
		where: { AND: andCondition },
		omit: { password: true },
		include: {
			staffProfile: {
				include: {
					department: { select: { name: true } },
					approvedPerson: { select: { name: true } },
				},
				// select: { name: true, email: true }
			},
		},
		orderBy: { [sortBy]: sortOrder },
		take: limit,
		skip,
	});

	const total = await prisma.user.count({
		where: { AND: andCondition },
	});

	return {
		data: staff,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const createAStaff = async (
	payload: IRegistrationStaffPayload,
	userId: string,
) => {
	const existingUser = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (existingUser) {
		throw new AppError(HttpStatus.CONFLICT, "Email already registered");
	}

	const department = await prisma.department.findUnique({
		where: { id: payload.departmentId },
	});

	if (!department) {
		throw new AppError(HttpStatus.NOT_FOUND, "Department not found");
	}

	const hashedPassword = await bcrypt.hash(
		payload.password,
		Number(config.bcrypt_salt_rounds),
	);
	const createdStaff = await prisma.user.create({
		data: {
			name: payload.name,
			email: payload.email,
			password: hashedPassword,
			role: Role.STAFF,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			staffProfile: {
				create: {
					name: payload.name,
					email: payload.email,
					experienceYears: Number(payload.experienceYears),
					expertise: payload.expertise as string,
					nid: payload.nid,
					departmentId: payload.departmentId,
					approvedById: userId,
				},
			},
		},
		include: { staffProfile: true },
		omit: { password: true },
	});

	return createdStaff;
};

export const AdminService = {
	getAllStaff,
	createAStaff,
};
