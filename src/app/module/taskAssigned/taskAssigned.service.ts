// taskAssigned.service.ts
import HttpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	ComplaintStatus,
	Role,
	UserStatus,
} from "../../../generated/prisma/enums";
import { IQuery } from "../../interfaces";
import { TaskAssignedWhereInput } from "../../../generated/prisma/models";

const assignStaffToComplaint = async (
	complaintId: string,
	staffId: string,
	adminId: string,
) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId, isDeleted: false },
		include: { category: true },
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	const existingActiveAssignment = await prisma.taskAssigned.findFirst({
		where: { complaintId: complaintId, isActive: true },
	});

	if (existingActiveAssignment) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"This complaint is already assigned. Use reassign instead.",
		);
	}

	const staffUser = await prisma.user.findUnique({
		where: { id: staffId, isDeleted: false },
		include: { staffProfile: true },
	});

	if (!staffUser || staffUser.role !== Role.STAFF) {
		throw new AppError(HttpStatus.NOT_FOUND, "Staff not found");
	}

	if (staffUser.status !== UserStatus.ACTIVE) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"This staff account is not active",
		);
	}

	if (
		staffUser.staffProfile?.departmentId !== complaint.category.departmentId
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Staff does not belong to the department responsible for this category",
		);
	}

	console.log(staffUser.staffProfile.userId);
	const result = await prisma.$transaction(async (tx) => {
		const assignment = await tx.taskAssigned.create({
			data: {
				staffId: staffUser.staffProfile?.userId as string,
				assignedById: adminId,
				complaintId: complaintId,
				isActive: true,
			},
		});

		await tx.complaint.update({
			where: { id: complaintId },
			data: { status: ComplaintStatus.ASSIGNED },
		});

		return assignment;
	});

	return result;
};

// ---------------- REASSIGN ----------------
const reassignStaff = async (
	assignmentId: string,
	newStaffId: string,
	adminId: string,
) => {
	const currentAssignment = await prisma.taskAssigned.findUnique({
		where: { id: assignmentId },
	});

	if (!currentAssignment || !currentAssignment.isActive) {
		throw new AppError(HttpStatus.NOT_FOUND, "Active assignment not found");
	}

	if (!currentAssignment.complaintId) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"This endpoint only supports complaint reassignment",
		);
	}

	const complaint = await prisma.complaint.findUnique({
		where: { id: currentAssignment.complaintId },
		include: { category: true },
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	const newStaffUser = await prisma.user.findUnique({
		where: { id: newStaffId, isDeleted: false },
		include: { staffProfile: true },
	});

	if (!newStaffUser || newStaffUser.role !== Role.STAFF) {
		throw new AppError(HttpStatus.NOT_FOUND, "Staff not found");
	}

	if (newStaffUser.status !== UserStatus.ACTIVE) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"This staff account is not active",
		);
	}

	if (
		newStaffUser.staffProfile?.departmentId !== complaint.category.departmentId
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Staff does not belong to the department responsible for this category",
		);
	}

	if (currentAssignment.staffId === newStaffId) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Complaint is already assigned to this staff",
		);
	}

	const result = await prisma.$transaction(async (tx) => {
		await tx.taskAssigned.update({
			where: { id: assignmentId },
			data: { isActive: false },
		});

		const newAssignment = await tx.taskAssigned.create({
			data: {
				staffId: newStaffId,
				assignedById: adminId,
				complaintId: currentAssignment.complaintId,
				isActive: true,
			},
		});

		return newAssignment;
	});

	return result;
};

// ---------------- MY ASSIGNMENTS (STAFF) ----------------
const getMyAssignments = async (staffId: string, query: IQuery) => {
	// search , filter, sorting, pagination

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: TaskAssignedWhereInput[] = [];

	// find Department name by searchBox or searchTerm || searching
	if (query.searchTerm) {
		andCondition.push({
			OR: [
				{
					complaint: {
						is: {
							title: { contains: query.searchTerm, mode: "insensitive" },
							location: { contains: query.searchTerm, mode: "insensitive" },
						},
					},
				},
			],
		});
	}

	// filter by queary parameter || Filtering
	if (query.title) {
		andCondition.push({
			complaint: {
				is: {
					title: { contains: query.name, mode: "insensitive" },
				},
			},
		});
	}
	if (query.location) {
		andCondition.push({
			complaint: {
				is: {
					location: { contains: query.name, mode: "insensitive" },
				},
			},
		});
	}

	const taskAssignd = await prisma.taskAssigned.findMany({
		where: {
			staffId,
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

	const total = await prisma.taskAssigned.count({
		where: {
			AND: andCondition,
		},
	});

	return {
		data: taskAssignd,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const TaskAssignedService = {
	assignStaffToComplaint,
	reassignStaff,
	getMyAssignments,
};
