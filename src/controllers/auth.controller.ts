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
    const licenseDocumentUrl = req.file ? `/uploads/${req.file.filename}` : '';
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

export const verifyEmailLink = async (
  req: Request, res: Response
): Promise<void> => {
  const token = ((req.query.token as string) || '').trim();
  if (!token) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verification Failed</title></head>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: white; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">❌</div>
            <h2 style="color: #0f172a; margin-bottom: 8px;">Missing Verification Token</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Please use the complete link sent to your email address or copy the token into the NIGT mobile app.</p>
          </div>
        </body>
      </html>
    `);
    return;
  }

  try {
    await authService.verifyEmail(token);
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified Successfully</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: white; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; border: 1px solid #e2e8f0;">
            <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
            <h2 style="color: #0f172a; margin-bottom: 8px;">Email Verified!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">Your email address has been verified successfully. Your account is now pending admin approval.</p>
            <div style="background: #f1f5f9; border-radius: 10px; padding: 14px; font-size: 13px; color: #334155;">
              You can now return to the <strong>NIGT Mobile App</strong> or <strong>Web Dashboard</strong>.
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    const msg = error?.message || 'Verification token is invalid or has expired.';
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verification Notice</title></head>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: white; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; border: 1px solid #e2e8f0;">
            <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
            <h2 style="color: #0f172a; margin-bottom: 8px;">Verification Notice</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">${msg}</p>
            <div style="background: #f1f5f9; border-radius: 10px; padding: 14px; font-size: 13px; color: #334155;">
              If your email is already verified, you can open the <strong>NIGT App</strong> to sign in.
            </div>
          </div>
        </body>
      </html>
    `);
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
