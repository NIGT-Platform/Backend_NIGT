import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';

export const assignDriver = async (vehicleId: string, driverId: string, assignedById: string) => {
  // 1. Verify Vehicle exists and is ACTIVE/APPROVED
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  if (vehicle.vehicleStatus !== 'ACTIVE' || vehicle.approvalStatus !== 'APPROVED') {
    throw new AppError('Vehicle must be ACTIVE and APPROVED before assigning a driver', 400);
  }

  // 2. Verify Driver exists and is ACTIVE
  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    include: { driverProfile: true },
  });
  if (!driver) throw new AppError('Driver not found', 404);
  if (driver.role !== 'DRIVER') throw new AppError('The specified user is not a DRIVER', 400);
  if (driver.accountStatus !== 'ACTIVE') {
    throw new AppError('Driver account must be ACTIVE to be assigned', 400);
  }
  
  // 3. Ensure Driver is not already actively assigned to another vehicle
  const activeDriverAssignment = await prisma.vehicleAssignment.findFirst({
    where: { driverId, status: 'ACTIVE' },
  });
  if (activeDriverAssignment) {
    if (activeDriverAssignment.vehicleId === vehicleId) {
      throw new AppError('This driver is already assigned to this vehicle', 400);
    } else {
      throw new AppError('This driver is already actively assigned to another vehicle', 400);
    }
  }

  // 4. End any existing active assignment for this vehicle
  await prisma.vehicleAssignment.updateMany({
    where: { vehicleId, status: 'ACTIVE' },
    data: { status: 'ENDED', endedAt: new Date() },
  });

  // 5. Create new assignment
  const newAssignment = await prisma.vehicleAssignment.create({
    data: {
      vehicleId,
      driverId,
      assignedById,
      status: 'ACTIVE',
    },
    include: {
      driver: {
        select: { id: true, firstName: true, lastName: true, phoneNumber: true },
      },
    },
  });

  return newAssignment;
};

export const unassignDriver = async (vehicleId: string, driverId: string) => {
  const assignment = await prisma.vehicleAssignment.findFirst({
    where: { vehicleId, driverId, status: 'ACTIVE' },
  });
  if (!assignment) throw new AppError('Active assignment not found for this vehicle and driver', 404);

  const endedAssignment = await prisma.vehicleAssignment.update({
    where: { id: assignment.id },
    data: { status: 'ENDED', endedAt: new Date() },
  });

  return endedAssignment;
};

export const getVehicleAssignments = async (vehicleId: string) => {
  return await prisma.vehicleAssignment.findMany({
    where: { vehicleId },
    orderBy: { assignedAt: 'desc' },
    include: {
      driver: {
        select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true },
      },
      assignedBy: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });
};

export const getDriverCurrentAssignment = async (driverId: string) => {
  const assignment = await prisma.vehicleAssignment.findFirst({
    where: { driverId, status: 'ACTIVE' },
    include: {
      vehicle: {
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
        },
      },
    },
  });
  return assignment;
};
