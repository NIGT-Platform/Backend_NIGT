import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
    userId: string;
    email: string;
    role: String;
}

export const generateAccessToken = (payload: JwtPayload): string =>{
    return jwt.sign(payload,
        env.jwtAccessSecret,{
            expiresIn: env.jwtAccessExpiresIn,
        } as jwt.SignOptions
    );
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
};
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
};
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
};
