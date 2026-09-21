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

export const ComplainsServices = {
	createComplaint,
	getALLComplaint,
};
