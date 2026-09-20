import { CategoryTypes } from "../../../generated/prisma/enums";

export interface ICreateCategoryPayload {
	departmentId: string;
	name: string;
	type: CategoryTypes;
	isPaid: boolean;
	fee?: number;
}

export interface IUpdateCategoryPayload {
	name?: string;
	type?: CategoryTypes;
	isPaid?: boolean;
	fee?: number;
}
