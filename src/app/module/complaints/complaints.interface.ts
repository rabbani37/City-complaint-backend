import { ComplaintStatus } from "../../../generated/prisma/enums";

export interface ICreateComplaintPayload {
	title: string;
	description: string;
	location?: string;
	latitude?: number;
	longitude?: number;
	categoryId: string;
}
