import { Role, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma"
import HttpStatus from "http-status"
import { IRequestUser } from "../auth/auth.interface";
import { AppError } from "../../utils/AppError";

const getMe = async (user: IRequestUser) => {

    const meUser = await prisma.user.findUnique({
        where: { id: user.userId, deletedAt: null },
        omit: { password: true }
    });

    if (!meUser) {
        throw new AppError(HttpStatus.NOT_FOUND, "User not found");
    };

    if (meUser.status === UserStatus.BLOCKED) {
        throw new AppError(HttpStatus.FORBIDDEN, "Your account has been blocked");
    };


    let profile = null;

    if (meUser.role === Role.CITIZEN) {
        profile = await prisma.citizenProfile.findUnique({
            where: { email: user.email },
        });
    } else if (meUser.role === Role.STAFF) {
        profile = await prisma.staffProfile.findUnique({
            where: { email: user.email },
            include: { department: true },
        });
        
    } else if (meUser.role === Role.ADMIN) {
        profile = await prisma.adminProfile.findUnique({
            where: { email: user.email },
        });
    }

    return { ...meUser, profile };
};


export const UserService = {
    getMe,
};







