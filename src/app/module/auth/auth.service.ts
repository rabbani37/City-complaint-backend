import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IRegistrationCitizenPayload, IRegistrationStaffPayload } from "./auth.interface";
import HttpStatus from "http-status";
import bcrypt from 'bcrypt'
import config from "../../config";
import { Role, UserStatus } from "../../../generated/prisma/enums";

// ---------------- CITIZEN REGISTER ----------------
const registerCitizen = async (payload: IRegistrationCitizenPayload) => {

    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (existingUser) {
        throw new AppError(HttpStatus.NOT_FOUND, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));


    const user = await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            phone: payload.phone,
            role: Role.CITIZEN,
            status: UserStatus.ACTIVE,
            citizenProfile: {
                create: {
                    name: payload.name,
                    email: payload.email,
                }
            }
        },
        include: { citizenProfile: true },
        omit: { password: true }
    });


    return user
};




// ---------------- STAFF APPLY (REGISTER) ----------------
const registerStaff = async (payload: IRegistrationStaffPayload) => {

    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (existingUser) {
        throw new AppError(HttpStatus.CONFLICT, "Email already registered");
    }

    const department = await prisma.department.findUnique({
        where: { id: payload.departmentId },
    });

    if (!department) {
        throw new AppError(HttpStatus.NOT_FOUND, "Department not found");
    }

    const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));




    const user = await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: Role.STAFF,
            status: UserStatus.PENDING,
            staffProfile: {
                create: {
                    name: payload.name,
                    email: payload.email,
                    experienceYears: Number(payload.experienceYears),
                    expertise: payload.expertise as string,
                    nid: payload.nid,
                    departmentId: payload.departmentId
                }
            }
        },
        include:{staffProfile:true},
        omit: { password: true }
    });




    return user
};



export const AuthService = {
    registerCitizen,
    registerStaff,
};

