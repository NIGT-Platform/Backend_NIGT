import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import { RegisterVehicleInput, UpdateVehicleInput, UploadVehicleDocumentInput } from '../validators/vehicle.validators';

export const registerVehicle = async (ownerId: string, data: RegisterVehicleInput) => {
  // Check plate number uniqueness
  const existing = await prisma.vehicle.findUnique({ where: { plateNumber: data.plateNumber } });
  if (existing) {
    throw new AppError('A vehicle with this plate number already exists', 409);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ownerId,
      ...data,
      approvalStatus: 'PENDING',
      vehicleStatus: 'ACTIVE',
    },
  });

  return vehicle;
};

export const getOwnerVehicles = async (ownerId: string) => {
  return await prisma.vehicle.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    include: { documents: true },
  });
};

export const getVehicleById = async (vehicleId: string, ownerId: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { documents: true },
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  if (vehicle.ownerId !== ownerId) {
    throw new AppError('Forbidden: You do not own this vehicle', 403);
  }

  return vehicle;
};

export const updateVehicle = async (vehicleId: string, ownerId: string, data: UpdateVehicleInput) => {
  const vehicle = await getVehicleById(vehicleId, ownerId);

  // If plate number is being changed, check for duplicates
  if (data.plateNumber && data.plateNumber !== vehicle.plateNumber) {
    const existing = await prisma.vehicle.findUnique({ where: { plateNumber: data.plateNumber } });
    if (existing) {
      throw new AppError('A vehicle with this plate number already exists', 409);
    }
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data,
    include: { documents: true },
  });

  return updatedVehicle;
};

export const addVehicleDocument = async (vehicleId: string, ownerId: string, data: UploadVehicleDocumentInput, documentUrl: string) => {
  // Ensure the vehicle belongs to this user
  await getVehicleById(vehicleId, ownerId);

  const document = await prisma.vehicleDocument.create({
    data: {
      vehicleId,
      documentType: data.documentType,
      documentUrl,
    },
  });

  return document;
};
