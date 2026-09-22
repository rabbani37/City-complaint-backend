export interface ICreateServiceRequestPayload {
	title: string;
	description: string;
	location: string;
	latitude?: number;
	longitude?: number;
	categoryId: string;
}
