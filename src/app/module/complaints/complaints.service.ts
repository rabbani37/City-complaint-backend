import { UploadApiResponse } from "cloudinary";
import { ICreateComplaintPayload } from "./complaints.interface";
import { AppError } from "../../utils/AppError";
import { cloudinary } from "../../lib/cloudinary";
import HttpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { platform } from "os";
import { create } from "domain";

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

export const ComplainsServices = {
	createComplaint,
};
