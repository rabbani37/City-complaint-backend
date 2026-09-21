import { ComplaintStatus } from "../../generated/prisma/enums";

// ---------------- STATUS UPDATE (State Machine) ----------------
export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
	PENDING: [ComplaintStatus.ASSIGNED],
	ASSIGNED: [ComplaintStatus.IN_PROGRESS],
	IN_PROGRESS: [ComplaintStatus.RESOLVED],
	RESOLVED: [ComplaintStatus.CLOSED],
	CLOSED: [],
	REOPENED: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS],
};
