import { z } from "zod";
import { Role } from "../../../generated/prisma/enums";

const changeUserRoleSchema = z.object({
	role: z.enum([Role.CITIZEN, Role.STAFF, Role.ADMIN], {
		error: "Role must be CITIZEN, STAFF, or ADMIN",
	}),
});

export const AdminValidation = {
	changeUserRoleSchema,
};
