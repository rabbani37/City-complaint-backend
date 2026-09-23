import {
	ComplaintStatus,
	PaymentStatus,
	Role,
	UserStatus,
} from "../../../generated/prisma/enums";
import { UserWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	IRegistrationStaffPayload,
	IRequestUser,
} from "../auth/auth.interface";
import HttpStatus from "http-status";
import bcrypt from "bcrypt";
import { fa, id, th } from "zod/locales";
import { Prisma } from "../../../generated/prisma/client";

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
					approvedAt: new Date(),
				},
			},
		},
		include: { staffProfile: true },
		omit: { password: true },
	});

	return createdStaff;
};

const userActiveBlock = async (userId: string, adminId: string) => {
	if (adminId === userId) {
		throw new AppError(
			HttpStatus.CONFLICT,
			"You can't changed your own status",
		);
	}

	const user = await prisma.user.findUnique({
		where: { id: userId, isDeleted: false },
	});

	if (!user) {
		throw new AppError(HttpStatus.NOT_FOUND, "User not found");
	}
	if (!user.emailVerified) {
		throw new AppError(HttpStatus.CONFLICT, "User is Not Verified");
	}
	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new AppError(HttpStatus.CONFLICT, "User is deleted");
	}

	if (user.status !== UserStatus.ACTIVE) {
		throw new AppError(HttpStatus.CONFLICT, "User is Not Verified");
	}

	const STATUS =
		user?.status === UserStatus.ACTIVE
			? UserStatus.BLOCKED
			: user?.status === UserStatus.BLOCKED
				? UserStatus.ACTIVE
				: UserStatus.ACTIVE;

	const statusChangedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			status: STATUS,
		},
		omit: { password: true },
	});

	return statusChangedUser;
};

const getDashboardStats = async () => {
	const [
		totalComplaints,
		resolvedComplaints,
		closedComplaints,
		pendingComplaints,
		totalServiceRequests,
		totalCitizens,
		totalStaff,
		pendingStaffApplications,
		totalDepartments,
		totalCategories,
		revenueResult,
	] = await Promise.all([
		prisma.complaint.count({ where: { isDeleted: false } }),

		prisma.complaint.count({
			where: { isDeleted: false, status: ComplaintStatus.RESOLVED },
		}),

		prisma.complaint.count({
			where: { isDeleted: false, status: ComplaintStatus.CLOSED },
		}),

		prisma.complaint.count({
			where: { isDeleted: false, status: ComplaintStatus.PENDING },
		}),

		prisma.serviceRequest.count({ where: { isDeleted: false } }),

		prisma.user.count({ where: { role: Role.CITIZEN, isDeleted: false } }),

		prisma.user.count({
			where: { role: Role.STAFF, isDeleted: false, status: UserStatus.ACTIVE },
		}),

		prisma.user.count({
			where: { role: Role.STAFF, isDeleted: false, status: UserStatus.PENDING },
		}),

		prisma.department.count({ where: { isDeleted: false } }),

		prisma.category.count({ where: { isDeleted: false } }),

		prisma.payment.aggregate({
			where: { status: PaymentStatus.PAID },
			_sum: { amount: true },
		}),
	]);

	const complaintsByCategory = await prisma.complaint.groupBy({
		by: ["categoryId"],
		where: { isDeleted: false },
		_count: { id: true },
		orderBy: { _count: { id: "desc" } },
		take: 5, // top 5 category
	});

	const categoryIds = complaintsByCategory.map((c) => c.categoryId);
	const categories = await prisma.category.findMany({
		where: { id: { in: categoryIds } },
		select: { id: true, name: true },
	});

	const topCategories = complaintsByCategory.map((item) => ({
		categoryName: categories.find((c) => c.id === item.categoryId)?.name,
		count: item._count.id,
	}));

	const departments = await prisma.department.findMany({
		where: { isDeleted: false },
		select: {
			id: true,
			name: true,
			categories: {
				select: {
					complaints: {
						where: { isDeleted: false },
						select: { status: true },
					},
				},
			},
		},
	});

	const departmentStats = departments.map((dept) => {
		const allComplaints = dept.categories.flatMap((c) => c.complaints);
		const resolved = allComplaints.filter(
			(c) => c.status === "RESOLVED" || c.status === "CLOSED",
		).length;

		return {
			departmentName: dept.name,
			totalComplaints: allComplaints.length,
			resolved,
			resolvedPercentage: allComplaints.length
				? Number(((resolved / allComplaints.length) * 100).toFixed(2))
				: 0,
		};
	});

	const recentComplaints = await prisma.complaint.findMany({
		where: { isDeleted: false },
		select: {
			id: true,
			title: true,
			status: true,
			createdAt: true,
			citizen: { select: { name: true } },
		},
		orderBy: { createdAt: "desc" },
		take: 5,
	});

	const resolvedOrClosed = resolvedComplaints + closedComplaints;
	const resolvedPercentage =
		totalComplaints > 0
			? Number(((resolvedOrClosed / totalComplaints) * 100).toFixed(2))
			: 0;

	return {
		complaints: {
			total: totalComplaints,
			pending: pendingComplaints,
			resolved: resolvedComplaints,
			closed: closedComplaints,
			resolvedPercentage,
			recentComplaints,
		},
		departmentStats,
		serviceRequests: {
			total: totalServiceRequests,
		},
		users: {
			totalCitizens,
			totalActiveStaff: totalStaff,
			pendingStaffApplications,
		},
		system: {
			totalDepartments,
			totalCategories,
			topCategories,
		},
		revenue: {
			total: revenueResult._sum.amount ?? 0,
		},
	};
};

const changeUserRole = async (
	targetUserId: string,
	newRole: Role,
	adminUser: IRequestUser,
) => {
	const targetUser = await prisma.user.findUnique({
		where: { id: targetUserId, isDeleted: false },
	});

	if (!targetUser) {
		throw new AppError(HttpStatus.NOT_FOUND, "User not found");
	}

	if (targetUser.id === adminUser.userId) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"You cannot change your own role",
		);
	}

	if (targetUser.role === newRole) {
		throw new AppError(HttpStatus.BAD_REQUEST, `User is already a ${newRole}`);
	}

	if (targetUser.role === Role.ADMIN && newRole !== Role.ADMIN) {
		const totalActiveAdmins = await prisma.user.count({
			where: { role: Role.ADMIN, isDeleted: false, status: UserStatus.ACTIVE },
		});

		if (totalActiveAdmins <= 1) {
			throw new AppError(
				HttpStatus.BAD_REQUEST,
				"Cannot demote the last remaining admin",
			);
		}
	}

	const oldRole = targetUser.role;

	const result = await prisma.$transaction(async (tx) => {
		// Step 1: User role update
		const updatedUser = await tx.user.update({
			where: { id: targetUserId },
			data: { role: newRole },
			omit: { password: true },
		});

		// Step 2: Old role  profile soft delete
		await softDeleteProfile(tx, oldRole, targetUserId);

		// Step 3: New role  profile reactivate
		await reactivateOrCreateProfile(tx, newRole, targetUser);

		return updatedUser;
	});

	return result;
};

const softDeleteProfile = async (
	tx: Prisma.TransactionClient,
	role: Role,
	userId: string,
) => {
	const softDeleteData = { isDeleted: true, deletedAt: new Date() };

	if (role === Role.CITIZEN) {
		await tx.citizenProfile.updateMany({
			where: { userId },
			data: softDeleteData,
		});
	} else if (role === Role.STAFF) {
		await tx.staffProfile.updateMany({
			where: { userId },
			data: softDeleteData,
		});
	} else if (role === Role.ADMIN) {
		await tx.adminProfile.updateMany({
			where: { userId },
			data: softDeleteData,
		});
	}
};

// ---------------- HELPER: New role profile reactivate/create ----------------
const reactivateOrCreateProfile = async (
	tx: Prisma.TransactionClient,
	role: Role,
	targetUser: { id: string; name: string; email: string },
) => {
	if (role === Role.CITIZEN) {
		const existing = await tx.citizenProfile.findUnique({
			where: { userId: targetUser.id },
		});

		if (existing) {
			await tx.citizenProfile.update({
				where: { userId: targetUser.id },
				data: { isDeleted: false, deletedAt: null },
			});
		} else {
			await tx.citizenProfile.create({
				data: {
					userId: targetUser.id,
					name: targetUser.name,
					email: targetUser.email,
				},
			});
		}
	} else if (role === Role.STAFF) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Promoting to STAFF requires department assignment. Use the staff approval flow instead.",
		);
	} else if (role === Role.ADMIN) {
		const existing = await tx.adminProfile.findUnique({
			where: { userId: targetUser.id },
		});

		if (existing) {
			await tx.adminProfile.update({
				where: { userId: targetUser.id },
				data: { isDeleted: false, deletedAt: null },
			});
		} else {
			await tx.adminProfile.create({
				data: {
					userId: targetUser.id,
					name: targetUser.name,
					email: targetUser.email,
				},
			});
		}
	}
};

const staffActivetion = async (
	targetUserId: string,
	adminUser: IRequestUser,
) => {
	const pendingStaff = await prisma.user.findUnique({
		where: { id: targetUserId },
	});

	if (!pendingStaff) {
		throw new AppError(HttpStatus.NOT_FOUND, "User not found");
	}

	if (pendingStaff?.status === UserStatus.ACTIVE) {
		throw new AppError(HttpStatus.CONFLICT, "User Already Active");
	}
	const approvedStaff = await prisma.user.update({
		where: { id: targetUserId },
		data: {
			status: UserStatus.ACTIVE,
			emailVerified: true,
			staffProfile: {
				update: {
					approvedAt: new Date(),
					approvedById: adminUser.userId,
				},
			},
		},
		omit: { password: true },
		include: { staffProfile: true },
	});
	return approvedStaff;
};

export const AdminService = {
	getAllStaff,
	getDashboardStats,
	changeUserRole,
	createAStaff,
	userActiveBlock,
	staffActivetion,
};
