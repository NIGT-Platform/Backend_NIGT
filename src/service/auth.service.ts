import prisma from '../utils/prisma.utils';
import { hashPassword, comparePassword } from '../utils/hash.utils';
import { generateSecureToken, getExpiryDate, isExpired } from '../utils/token.utils';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.utils';
import { AppError } from '../middleware/error.middleware';
import { VehicleOwnerRegisterInput, DriverRegisterInput, LoginInput } from '../validators/auth.validators';



export const registerVehicleOwner = async (data: VehicleOwnerRegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }] },
  });
  if (existing) {
    throw new AppError('Email or phone number already in use', 409);
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      passwordHash,
      role: 'VEHICLE_OWNER',
    },
  });

  const token = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: getExpiryDate(24 * 60), // 24 hours
    },
  });

  await sendVerificationEmail(user.email, user.firstName, token);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
  };
};

export const registerDriver = async (
  data: DriverRegisterInput,
  licenseDocumentUrl: string
) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }] },
  });
  if (existing) throw new AppError('Email or phone number already in use', 409);

  const existingLicense = await prisma.driverProfile.findUnique({
    where: { licenseNumber: data.licenseNumber },
  });
  if (existingLicense) throw new AppError('License number already registered', 409);

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      passwordHash,
      role: 'DRIVER',
      driverProfile: {
        create: {
          licenseNumber: data.licenseNumber,
          licenseType: data.licenseType as any,
          licenseExpiryDate: new Date(data.licenseExpiryDate),
          licenseDocumentUrl,
        },
      },
    },
    include: { driverProfile: true },
  });

  const token = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: getExpiryDate(24 * 60) },
  });
  await sendVerificationEmail(user.email, user.firstName, token);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
  };
};


export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await comparePassword(data.password, user.passwordHash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  if (!user.emailVerified) throw new AppError('Please verify your email first', 403);
  if (user.accountStatus === 'PENDING') throw new AppError('Your account is pending admin approval', 403);
  if (user.accountStatus === 'REJECTED') throw new AppError('Your account has been rejected', 403);
  if (user.accountStatus === 'SUSPENDED') throw new AppError('Your account has been suspended', 403);

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getExpiryDate(7 * 24 * 60), // 7 days
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    },
  };
};


export const verifyEmail = async (token: string) => {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record) throw new AppError('Invalid verification token', 400);
  if (isExpired(record.expiresAt)) throw new AppError('Verification token has expired', 400);

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });

  await prisma.emailVerificationToken.delete({ where: { token } });

  return { message: 'Email verified successfully. Await admin approval.' };
};


export const resendVerification = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('No account found with this email', 404);
  if (user.emailVerified) throw new AppError('Email is already verified', 400);

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  const token = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: getExpiryDate(24 * 60) },
  });

  await sendVerificationEmail(user.email, user.firstName, token);
  return { message: 'Verification email sent' };
};


export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success (don't reveal if email exists)
  if (!user) return { message: 'If that email exists, a reset link has been sent' };

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = generateSecureToken();
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: getExpiryDate(60) }, // 1 hour
  });

  await sendPasswordResetEmail(user.email, user.firstName, token);
  return { message: 'If that email exists, a reset link has been sent' };
};


export const resetPassword = async (token: string, newPassword: string) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.used) throw new AppError('Invalid or expired reset token', 400);
  if (isExpired(record.expiresAt)) throw new AppError('Reset token has expired', 400);

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true },
  });

  return { message: 'Password reset successfully' };
};


export const refreshAccessToken = async (token: string) => {
  const record = await prisma.refreshToken.findUnique({ where: { token } });
  if (!record) throw new AppError('Invalid refresh token', 401);
  if (isExpired(record.expiresAt)) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new AppError('Refresh token has expired, please login again', 401);
  }

  const payload = verifyRefreshToken(token);
  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });


  await prisma.refreshToken.delete({ where: { token } });
  const newRefreshToken = generateRefreshToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: record.userId,
      expiresAt: getExpiryDate(7 * 24 * 60),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};


export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
  return { message: 'Logged out successfully' };
};
