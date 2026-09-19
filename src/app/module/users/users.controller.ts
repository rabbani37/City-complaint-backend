import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";
import { UserService } from "./users.service";

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.getMe(user);


    sendResponse(res, {
        statusCode: HttpStatus.OK,
        success: true,
        message: "Retrive Users Profile successfully",
        data: result,
    });
    
});



export const UsersController = {
    getMe,
};
