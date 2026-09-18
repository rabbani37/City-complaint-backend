


export interface IRegistrationCitizenPayload {

    name: string;
    email: string;
    password: string;
    phone?: string;

}
export interface IRegistrationStaffPayload {
    name: string;
    email: string;
    password: string;
    nid: string;
    departmentId: string;
    experienceYears: number;
    expertise: string;
}