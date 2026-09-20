import { exactOptional } from "zod";

interface ICitizenUpdatePayload {
	address?: string;
}
interface IStaffUpdatePayload {
	address?: string;
	abouts?: string;
	experienceYears?: number;
	expertise?: string;
}

interface IAdminUpdatePayload {
	address?: string;
}

export interface IUserUpdatePayload {
	name?: string;
	phone?: string;
	citizen?: ICitizenUpdatePayload;
	staff?: IStaffUpdatePayload;
	admin?: IAdminUpdatePayload;
}
