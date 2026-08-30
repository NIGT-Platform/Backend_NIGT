import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import { UpdateProfileInput } from '../validators/user.validators';

export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // If changing phone number, check if it's already in use
  if (data.phoneNumber && data.phoneNumber !== user.phoneNumber) {
    const existing = await prisma.user.findFirst({ where: { phoneNumber: data.phoneNumber } });
    if (existing) throw new AppError('Phone number already in use', 409);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.middleName !== undefined && { middleName: data.middleName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    },
  });

  return {
    id: updatedUser.id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    phoneNumber: updatedUser.phoneNumber,
    role: updatedUser.role,
    accountStatus: updatedUser.accountStatus,
  };
};
