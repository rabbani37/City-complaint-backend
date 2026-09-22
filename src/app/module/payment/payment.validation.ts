import z from "zod";

export const serviceRequestSchema = z.object({
	serviceRequestId: z.string("ServiceRequest ID  is required"),
});
