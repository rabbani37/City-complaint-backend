// serviceRequest.service.ts
import HttpStatus from "http-status";
import { UploadApiResponse } from "cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { cloudinary } from "../../lib/cloudinary";
import { ICreateServiceRequestPayload } from "./serviceRequest.interface";
import { Role, ServiceRequestStatus } from "../../../generated/prisma/enums";
import { IRequestUser } from "../auth/auth.interface";
import { IQuery } from "../../interfaces";
import { ServiceRequestWhereInput } from "../../../generated/prisma/models";

const createServiceRequest = async (
	userId: string,
	payload: ICreateServiceRequestPayload,
	serviceFiles: Express.Multer.File[] | null,
) => {
	const category = await prisma.category.findUnique({
		where: { id: payload.categoryId, isDeleted: false },
	});

	if (!category) {
		throw new AppError(HttpStatus.NOT_FOUND, "Category Is Not Found!");
	}

	if (!category.isPaid || category.type !== "SERVICE") {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"This category is not eligible for a paid service request. Use complaint instead.",
		);
	}

	if (!category.fee) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Fee is not configured for this category",
		);
	}

	const uploadPromis = (serviceFiles || []).map((file) => {
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

	const serviceFilesUploadResult = await Promise.all(uploadPromis);

	const imagesData = serviceFilesUploadResult.map((file) => ({
		url: file.secure_url,
		publicId: file.public_id,
	}));

	const createAServiceRequest = await prisma.serviceRequest.create({
		data: {
			title: payload.title,
			description: payload.description,
			location: payload.location,
			latitude: payload.latitude,
			longitude: payload.longitude,
			categoryId: payload.categoryId,
			citizenId: userId,
			fee: category.fee,
			serviceImages: imagesData,
		},
	});

	return createAServiceRequest;
};

// serviceRequest.service.ts

const ALLOWED_TRANSITIONS: Record<
	ServiceRequestStatus,
	ServiceRequestStatus[]
> = {
	PENDING_PAYMENT: [],
	PAID: [ServiceRequestStatus.PROCESSING],
	PROCESSING: [ServiceRequestStatus.APPROVED, ServiceRequestStatus.REJECTED],
	APPROVED: [],
	REJECTED: [],
};

// ---------------- ALL SERVICE REQUESTS (STAFF/ADMIN) ----------------
const getAllServiceRequests = async (query: IQuery) => {
	// search, filter, sorting, pagination

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: ServiceRequestWhereInput[] = [
		{ isDeleted: false, deletedAt: null },
	];

	// find service requests by location, title, categoryName || searching
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

	// filter by query parameter || Filtering
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

	const serviceRequests = await prisma.serviceRequest.findMany({
		where: {
			AND: andCondition,
		},
		include: {
			category: { include: { department: true } },
			citizen: { select: { id: true, name: true, email: true } },
			payment: true,
		},
		orderBy: {
			[sortBy]: sortOrder,
		},
		take: limit,
		skip,
	});

	const total = await prisma.serviceRequest.count({
		where: {
			AND: andCondition,
		},
	});

	return {
		data: serviceRequests,
		meta: {
			page,
			limit,
			total: total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// ---------------- MY SERVICE REQUESTS (CITIZEN) ----------------
const getMyServiceRequests = async (citizenId: string, query: IQuery) => {
	// search, filter, sorting, pagination

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andCondition: ServiceRequestWhereInput[] = [];

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

	if (query.location) {
		andCondition.push({
			location: { contains: query.location, mode: "insensitive" },
		});
	}
	if (query.status) {
		andCondition.push({
			status: query.status,
		});
	}

	const myServiceRequests = await prisma.serviceRequest.findMany({
		where: { citizenId, isDeleted: false, AND: andCondition },
		include: { category: true, payment: true },
		orderBy: {
			[sortBy]: sortOrder,
		},
		take: limit,
		skip,
	});

	const total = await prisma.serviceRequest.count({
		where: { citizenId, isDeleted: false, AND: andCondition },
	});

	return {
		data: myServiceRequests,
		meta: {
			page,
			limit,
			total: total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// ---------------- DETAIL ----------------
const getServiceRequestById = async (id: string, user: IRequestUser) => {
	const serviceRequest = await prisma.serviceRequest.findUnique({
		where: { id },
		include: {
			category: { include: { department: true } },
			citizen: { select: { id: true, name: true, email: true } },
			payment: true,
			taskAssigned: {
				orderBy: { createdAt: "desc" },
				include: {
					staff: { select: { id: true, name: true, email: true } },
					assignedBy: {
						include: {
							adminProfile: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!serviceRequest) {
		throw new AppError(HttpStatus.NOT_FOUND, "Service request not found");
	}

	if (user.role === Role.CITIZEN && serviceRequest.citizenId !== user.userId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to view this service request",
		);
	}

	if (user.role === Role.STAFF) {
		const isAssignedToMe = serviceRequest.taskAssigned.some(
			(a) => a.staffId === user.userId && a.isActive,
		);
		if (!isAssignedToMe) {
			throw new AppError(
				HttpStatus.FORBIDDEN,
				"This service request is not assigned to you",
			);
		}
	}

	return serviceRequest;
};

// ---------------- STATUS UPDATE ----------------
const updateServiceRequestStatus = async (
	id: string,
	payload: { status: ServiceRequestStatus },
	user: IRequestUser,
) => {
	const serviceRequest = await prisma.serviceRequest.findUnique({
		where: { id, deletedAt: null, isDeleted: false },
		include: { taskAssigned: { where: { isActive: true } } },
	});

	if (!serviceRequest) {
		throw new AppError(HttpStatus.NOT_FOUND, "Service request not found");
	}

	if (user.role === Role.STAFF) {
		const isAssignedToMe = serviceRequest.taskAssigned.some(
			(a) => a.staffId === user.userId,
		);
		if (!isAssignedToMe) {
			throw new AppError(
				HttpStatus.FORBIDDEN,
				"This service request is not assigned to you",
			);
		}
	}

	if (serviceRequest.status === ServiceRequestStatus.PENDING_PAYMENT) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Cannot process a service request before payment is completed",
		);
	}

	// if (serviceRequest.status === ServiceRequestStatus.) {
	// 	throw new AppError(
	// 		HttpStatus.BAD_REQUEST,
	// 		"Complaint must be assigned first before updating the status",
	// 	);
	// }
	// State machine validation
	const allowedNextStatuses = ALLOWED_TRANSITIONS[serviceRequest.status];
	if (!allowedNextStatuses.includes(payload.status)) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			`Cannot change status from ${serviceRequest.status} to ${payload.status}`,
		);
	}

	const result = await prisma.serviceRequest.update({
		where: { id },
		data: { status: payload.status },
	});

	return result;
};

export const ServiceRequestService = {
	createServiceRequest,
	getAllServiceRequests,
	getMyServiceRequests,
	getServiceRequestById,
	updateServiceRequestStatus,
};
