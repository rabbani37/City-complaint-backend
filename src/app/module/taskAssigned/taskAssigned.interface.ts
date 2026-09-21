export interface IAssignStaffToComplaintPayload {
	complaintId: string;
	staffId: string;
}

export interface IReassignStaffPayload {
	assignmentId: string;
	newStaffId: string;
}
