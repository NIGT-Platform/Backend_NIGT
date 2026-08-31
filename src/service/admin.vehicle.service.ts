import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import { ApprovalStatus } from '@prisma/client';

export const getAllVehicles = async () => {
  return await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { owner: { select: { firstName: true, lastName: true, email: true } } },
  });
};

export const getPendingVehicles = async () => {
  return await prisma.vehicle.findMany({
    where: { approvalStatus: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { 
      owner: { select: { firstName: true, lastName: true, email: true } },
      documents: true 
    },
  });
};

export const getVehicleById = async (vehicleId: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { 
      documents: true,
      owner: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } }
    },
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  return vehicle;
};

export const updateVehicleApprovalStatus = async (vehicleId: string, status: ApprovalStatus) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  if (vehicle.approvalStatus === status) {
    throw new AppError(`Vehicle is already ${status}`, 400);
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { approvalStatus: status },
    include: { owner: { select: { email: true } } }
  });
  
  return updatedVehicle;
};
