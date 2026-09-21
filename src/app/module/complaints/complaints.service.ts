import { UploadApiResponse } from "cloudinary";
import { ICreateComplaintPayload } from "./complaints.interface";
import { AppError } from "../../utils/AppError";
import { cloudinary } from "../../lib/cloudinary";
import HttpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { platform } from "os";
import { create } from "domain";
import { IQuery } from "../../interfaces";
import { ComplaintWhereInput } from "../../../generated/prisma/models";
import { IRequestUser } from "../auth/auth.interface";
import { ComplaintStatus, Role } from "../../../generated/prisma/enums";
import { ALLOWED_TRANSITIONS } from "../../utils/ALLOWED_TRANSITIONS";

const createComplaint = async (
	userId: string,
	payload: ICreateComplaintPayload,
	complaintFiles: Express.Multer.File[] | null,
) => {
	const category = await prisma.category.findUnique({
		where: { id: payload.categoryId, isDeleted: false },
	});
	if (!category) {
		throw new AppError(HttpStatus.NOT_FOUND, "Category Is Not Found!");
	}

	const uploadPromis = (complaintFiles || []).map((file) => {
		return new Promise<UploadApiResponse>((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{ resource_type: "auto" },
				async (error, result) => {
					if (error) {
						return reject(error);
					}
					if (!result) {
						return reject(result);
					}
					return resolve(result);
				},
			);

			uploadStream.end(file.buffer);
		});
	});

	const complaintFilesUploadResult = await Promise.all(uploadPromis);

	const imagesData = complaintFilesUploadResult.map((file) => ({
		url: file.secure_url,
		publicId: file.public_id,
	}));

	const createACompleint = await prisma.complaint.create({
		data: {
			title: payload.title,
			description: payload.description,
			location: payload.location,
			latitude: payload.latitude,
			longitude: payload.longitude,

			categoryId: payload.categoryId,
			citizenId: userId,
			complaintImages: imagesData,
		},
	});

	return createACompleint;
};

const getALLComplaint = async (query: IQuery) => {
	// search , filter, sorting, pagination

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: ComplaintWhereInput[] = [
		{ isDeleted: false, deletedAt: null },
	];

	// find complaints by location, title, categoryName || searching
	if (query.searchTerm) {
		andCondition.push({
			OR: [
				{ location: { contains: query.searchTerm, mode: "insensitive" } },
				{ title: { contains: query.searchTerm, mode: "insensitive" } },
				{
					category: {
						is: {
							name: { contains: query.searchTerm, mode: "insensitive" },
						},
					},
				},
			],
		});
	}

	// filter by queary parameter || Filtering
	if (query.location) {
		andCondition.push({
			location: { contains: query.location, mode: "insensitive" },
		});
	}
	if (query.title) {
		andCondition.push({
			title: { contains: query.title, mode: "insensitive" },
		});
	}
	if (query.status) {
		andCondition.push({
			status: query.status,
		});
	}

	const complaints = await prisma.complaint.findMany({
		where: {
			AND: andCondition,
		},
		orderBy: {
			[sortBy]: sortOrder,
		},
		take: limit,
		skip,
	});

	const total = await prisma.complaint.count({
		where: {
			AND: andCondition,
		},
	});

	return {
		data: complaints,
		meta: {
			page,
			limit,
			total: total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getMyComplaints = async (citizenId: string, query: IQuery) => {
	// search , filter, sorting, pagination

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: ComplaintWhereInput[] = [];

	// find complaints by location, title, categoryName || searching
	if (query.searchTerm) {
		andCondition.push({
			OR: [
				{ location: { contains: query.searchTerm, mode: "insensitive" } },
				{ title: { contains: query.searchTerm, mode: "insensitive" } },
				{
					category: {
						is: {
							name: { contains: query.searchTerm, mode: "insensitive" },
						},
					},
				},
			],
		});
	}

	// filter by queary parameter || Filtering
	if (query.location) {
		andCondition.push({
			location: { contains: query.location, mode: "insensitive" },
		});
	}

	const myComplaint = await prisma.complaint.findMany({
		where: { citizenId, isDeleted: false, AND: andCondition },
		orderBy: {
			[sortBy]: sortOrder,
		},
		take: limit,
		skip,
	});
	const total = await prisma.complaint.count({
		where: { citizenId, isDeleted: false, AND: andCondition },
	});

	return {
		data: myComplaint,
		meta: {
			page,
			limit,
			total: total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getComplaintById = async (id: string, user: IRequestUser) => {
	const complaint = await prisma.complaint.findFirst({
		where: { id },
		include: {
			category: { include: { department: true } },

			citizen: { select: { id: true, name: true, email: true } },
			taskAssigned: {
				orderBy: { createdAt: "desc" },
				include: {
					staff: { select: { id: true, name: true, email: true } },
					assignedBy: { select: { id: true, name: true } },
				},
			},

			feedback: true,
		},
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	if (user.role === Role.CITIZEN && complaint.citizenId !== user.userId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to view this complaint",
		);
	}

	if (user.role === Role.STAFF) {
		const isAssignedToMe = complaint.taskAssigned.some(
			(a) => a.staffId === user.userId && a.isActive,
		);
		if (!isAssignedToMe) {
			throw new AppError(
				HttpStatus.FORBIDDEN,
				"This complaint is not assigned to you",
			);
		}
	}

	return complaint;
};

const updateComplaintStatus = async (
	id: string,
	payload: { status: ComplaintStatus },
	user: IRequestUser,
) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id, deletedAt: null, isDeleted: false },
		include: { taskAssigned: { where: { isActive: true } } },
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	if (user.role === Role.STAFF) {
		const isAssignedToMe = complaint.taskAssigned.some(
			(a) => a.staffId === user.userId,
		);
		if (!isAssignedToMe) {
			throw new AppError(
				HttpStatus.FORBIDDEN,
				"This complaint is not assigned to you",
			);
		}
	}

	// State machine validation
	const allowedNextStatuses = ALLOWED_TRANSITIONS[complaint.status];
	if (!allowedNextStatuses.includes(payload.status)) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			`Cannot change status from ${complaint.status} to ${payload.status}`,
		);
	}

	const result = await prisma.complaint.update({
		where: { id },
		data: { status: payload.status },
	});

	return result;
};

const deleteComplaint = async (id: string, user: IRequestUser) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id, deletedAt: null },
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	if (user.role === Role.CITIZEN && complaint.citizenId !== user.userId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to delete this complaint",
		);
	}

	if (
		user.role === Role.CITIZEN &&
		complaint.status !== ComplaintStatus.PENDING
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Cannot delete a complaint that is already being processed",
		);
	}

	const result = await prisma.complaint.update({
		where: { id },
		data: { deletedAt: new Date(), isDeleted: true },
	});

	return result;
};

// ---------------- REOPEN ----------------
const reopenComplaint = async (id: string, citizenId: string) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id, deletedAt: null, isDeleted: false },
	});

	if (!complaint) {
		throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found");
	}

	if (complaint.citizenId !== citizenId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to reopen this complaint",
		);
	}

	if (
		complaint.status !== ComplaintStatus.RESOLVED &&
		complaint.status !== ComplaintStatus.CLOSED
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Only resolved or closed complaints can be reopened",
		);
	}

	const result = await prisma.complaint.update({
		where: { id },
		data: { status: ComplaintStatus.REOPENED },
	});

	return result;
};

export const ComplainsServices = {
	createComplaint,
	getALLComplaint,
	getMyComplaints,
	getComplaintById,
	updateComplaintStatus,
	deleteComplaint,
	reopenComplaint,
};
