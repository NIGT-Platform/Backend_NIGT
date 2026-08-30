import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils";
import { AppError } from "./error.middleware";
 
export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            throw new AppError("Unauthorized: No token provided", 401);
        }

        const token = 
            authHeader.split(" ")[1];
        const payload = 
    verifyAccessToken(token);
        req.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role as any,
        };
        next();
    }catch(error){
        if (error instanceof AppError){
            next(error);
        }else{
            next(
                new AppError("Invalid Token or expired access token", 401)
            );
        }

    }
};
