import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';

export const getAllUsers = async () => {
  return prisma.user.findMany({
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
      createdAt: true,
      driverProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getPendingUsers = async () => {
  return prisma.user.findMany({
    where: { accountStatus: 'PENDING', emailVerified: true },
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
      createdAt: true,
      driverProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
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
      createdAt: true,
      driverProfile: true,
    },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const approveUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);
  if (user.accountStatus === 'ACTIVE') throw new AppError('User is already active', 400);

  return prisma.user.update({
    where: { id },
    data: { accountStatus: 'ACTIVE' },
    select: { id: true, email: true, accountStatus: true },
  });
};

export const rejectUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);

  return prisma.user.update({
    where: { id },
    data: { accountStatus: 'REJECTED' },
    select: { id: true, email: true, accountStatus: true },
  });
};

export const suspendUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'ADMIN') throw new AppError('Cannot suspend an admin account', 403);

  return prisma.user.update({
    where: { id },
    data: { accountStatus: 'SUSPENDED' },
    select: { id: true, email: true, accountStatus: true },
  });
};

