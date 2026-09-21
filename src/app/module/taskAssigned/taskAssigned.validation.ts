// taskAssigned.validation.ts
import { z } from "zod";

const assignStaffSchema = z.object({
	staffId: z.string("Staff ID is required"),
});

const reassignStaffSchema = z.object({
	staffId: z.string("New staff ID is required"),
});

export const TaskAssignedValidation = {
	assignStaffSchema,
	reassignStaffSchema,
};
