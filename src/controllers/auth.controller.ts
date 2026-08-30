import { Request, Response, NextFunction } from 'express';
import * as authService from '../service/auth.service';
import {
  vehicleOwnerRegisterSchema,
  driverRegisterSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validators';

export const registerVehicleOwner = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = vehicleOwnerRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const user = await authService.registerVehicleOwner(parsed.data);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user,
    });
  } catch (error) {
    next(error);
  }
};


export const registerDriver = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = driverRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const licenseDocumentUrl = req.file?.filename || '';
    if (!licenseDocumentUrl) {
      res.status(400).json({ success: false, message: 'License document is required' });
      return;
    }
    const user = await authService.registerDriver(parsed.data, licenseDocumentUrl);
    res.status(201).json({
      success: true,
      message: 'Driver registration successful. Please check your email to verify your account.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await authService.login(parsed.data);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await authService.verifyEmail(parsed.data.token);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};


export const resendVerification = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = resendVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await authService.resendVerification(parsed.data.email);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await authService.forgotPassword(parsed.data.email);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await authService.resetPassword(parsed.data.token, parsed.data.password);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await authService.refreshAccessToken(parsed.data.refreshToken);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};


export const logout = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }
    const result = await authService.logout(refreshToken);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
