import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import { ProfileEditRequestInput } from '../validators/profile.validators';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      role: true,
      accountStatus: true,
      emailVerified: true,
      profileImageUrl: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError('User not found', 404);

  // Get latest pending change request if any
  const pendingRequest = await prisma.profileChangeRequest.findFirst({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  const lastRequest = await prisma.profileChangeRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return { user, pendingRequest, lastRequest };
};

export const updateProfileImage = async (userId: string, imageUrl: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: imageUrl },
    select: { id: true, profileImageUrl: true },
  });
};

export const submitProfileEditRequest = async (userId: string, data: ProfileEditRequestInput) => {
  // Enforce: only one PENDING request at a time
  const existing = await prisma.profileChangeRequest.findFirst({
    where: { userId, status: 'PENDING' },
  });

  if (existing) {
    throw new AppError('You already have a pending profile change request. Please wait for admin review.', 409);
  }

  // Check if the new phone number conflicts with another user
  if (data.phoneNumber) {
    const phoneConflict = await prisma.user.findFirst({
      where: { phoneNumber: data.phoneNumber, NOT: { id: userId } },
    });
    if (phoneConflict) {
      throw new AppError('This phone number is already in use by another account.', 409);
    }
  }

  const request = await prisma.profileChangeRequest.create({
    data: { userId, ...data },
  });

  return request;
};

// ── Admin Service Functions ────────────────────────────

export const getAllProfileChangeRequests = async () => {
  return await prisma.profileChangeRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          profileImageUrl: true,
          role: true,
        },
      },
    },
  });
};

export const approveProfileChangeRequest = async (requestId: string, adminId: string) => {
  const request = await prisma.profileChangeRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Profile change request not found', 404);
  if (request.status !== 'PENDING') throw new AppError(`Request is already ${request.status}`, 400);

  // Apply changes to the user
  await prisma.user.update({
    where: { id: request.userId },
    data: {
      firstName: request.firstName,
      middleName: request.middleName ?? '',
      lastName: request.lastName,
      phoneNumber: request.phoneNumber,
    },
  });

  // Update request status
  const updated = await prisma.profileChangeRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() },
  });

  return updated;
};

export const rejectProfileChangeRequest = async (requestId: string, adminId: string) => {
  const request = await prisma.profileChangeRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Profile change request not found', 404);
  if (request.status !== 'PENDING') throw new AppError(`Request is already ${request.status}`, 400);

  const updated = await prisma.profileChangeRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date() },
  });

  return updated;
};
