import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import {
  StartTripInput,
  DeliveryInput,
  CompleteTripInput,
} from '../validators/trip.validators';
import { TripStatus } from '@prisma/client';

export const getTrips = async (filters: {
  status?: TripStatus;
  search?: string;
  userId?: string;
  userRole?: string;
}) => {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
      { pickupLocation: { contains: filters.search, mode: 'insensitive' } },
      { destination: { contains: filters.search, mode: 'insensitive' } },
      { job: { referenceNumber: { contains: filters.search, mode: 'insensitive' } } },
      { vehicle: { plateNumber: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  // Role based filtering
  if (filters.userRole === 'DRIVER') {
    where.driverId = filters.userId;
  } else if (filters.userRole === 'VEHICLE_OWNER') {
    where.vehicle = { ownerId: filters.userId };
  }

  return await prisma.trip.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      job: {
        select: {
          id: true,
          referenceNumber: true,
          loadDescription: true,
          loadWeight: true,
          loadUnit: true,
          priority: true,
          customerName: true,
          customerPhone: true,
        },
      },
      vehicle: {
        select: { id: true, plateNumber: true, brand: true, model: true },
      },
      driver: {
        select: { id: true, firstName: true, lastName: true, phoneNumber: true },
      },
      delivery: true,
    },
  });
};

export const getTripById = async (id: string, userId: string, userRole: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      job: {
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
          },
        },
      },
      vehicle: {
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true },
          },
        },
      },
      driver: {
        select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true },
      },
      delivery: true,
    },
  });

  if (!trip) throw new AppError('Trip not found', 404);

  if (userRole === 'DRIVER' && trip.driverId !== userId) {
    throw new AppError('You are not authorized to view this trip', 403);
  }
  if (userRole === 'VEHICLE_OWNER' && trip.vehicle.ownerId !== userId) {
    throw new AppError('You are not authorized to view this trip', 403);
  }

  return trip;
};

export const startTrip = async (tripId: string, driverId: string, input: StartTripInput) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.driverId !== driverId) {
    throw new AppError('You are not assigned to this trip', 403);
  }

  if (trip.status !== 'SCHEDULED') {
    throw new AppError(`Trip cannot be started from status: ${trip.status}`, 400);
  }

  // Update trip status to IN_TRANSIT and set odometer
  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'IN_TRANSIT',
      startingOdometer: input.startingOdometer,
      actualDeparture: new Date(),
    },
    include: { job: true },
  });

  // Update associated Job status to IN_PROGRESS
  await prisma.transportJob.update({
    where: { id: trip.jobId },
    data: { status: 'IN_PROGRESS' },
  });

  await prisma.auditLog.create({
    data: {
      userId: driverId,
      action: 'START_TRIP',
      entityType: 'Trip',
      entityId: tripId,
      details: `Started trip ${trip.referenceNumber} with starting odometer ${input.startingOdometer} km`,
    },
  });

  return updatedTrip;
};

export const updateTripStatus = async (tripId: string, driverId: string, newStatus: TripStatus) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.driverId !== driverId) {
    throw new AppError('You are not assigned to this trip', 403);
  }

  const allowedTransitions: Record<TripStatus, TripStatus[]> = {
    SCHEDULED: ['STARTED', 'IN_TRANSIT', 'CANCELLED'],
    STARTED: ['IN_TRANSIT', 'ARRIVED', 'CANCELLED'],
    IN_TRANSIT: ['ARRIVED', 'DELIVERED', 'CANCELLED'],
    ARRIVED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!allowedTransitions[trip.status]?.includes(newStatus)) {
    throw new AppError(`Cannot change trip status from ${trip.status} to ${newStatus}`, 400);
  }

  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: newStatus,
      actualArrival: newStatus === 'ARRIVED' ? new Date() : undefined,
    },
  });

  return updatedTrip;
};

export const recordDelivery = async (
  tripId: string,
  driverId: string,
  input: DeliveryInput,
  proofDocumentUrl?: string
) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { delivery: true },
  });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.driverId !== driverId) {
    throw new AppError('You are not assigned to this trip', 403);
  }

  if (!['STARTED', 'IN_TRANSIT', 'ARRIVED'].includes(trip.status)) {
    throw new AppError(`Cannot record delivery for trip with status: ${trip.status}`, 400);
  }

  // Create Delivery record
  const delivery = await prisma.delivery.create({
    data: {
      tripId,
      receiverName: input.receiverName,
      receiverPhone: input.receiverPhone,
      notes: input.notes,
      proofDocumentUrl: proofDocumentUrl || null,
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
  });

  // Update Trip status to DELIVERED
  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'DELIVERED',
      actualArrival: trip.actualArrival || new Date(),
    },
  });

  // Update Job status to DELIVERED
  await prisma.transportJob.update({
    where: { id: trip.jobId },
    data: { status: 'DELIVERED' },
  });

  await prisma.auditLog.create({
    data: {
      userId: driverId,
      action: 'DELIVERY_CONFIRMED',
      entityType: 'Trip',
      entityId: tripId,
      details: `Delivery confirmed by ${input.receiverName}`,
    },
  });

  return { trip: updatedTrip, delivery };
};

export const completeTrip = async (tripId: string, driverId: string, input: CompleteTripInput) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { delivery: true },
  });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.driverId !== driverId) {
    throw new AppError('You are not assigned to this trip', 403);
  }

  if (trip.status !== 'DELIVERED') {
    throw new AppError('Trip must be marked DELIVERED before completion', 400);
  }

  if (trip.startingOdometer && input.endingOdometer < trip.startingOdometer) {
    throw new AppError(
      `Ending odometer (${input.endingOdometer}) cannot be less than starting odometer (${trip.startingOdometer})`,
      400
    );
  }

  const distanceTravelled = trip.startingOdometer
    ? Number((input.endingOdometer - trip.startingOdometer).toFixed(1))
    : undefined;

  const completedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'COMPLETED',
      endingOdometer: input.endingOdometer,
      distanceTravelled,
    },
    include: { delivery: true, job: true },
  });

  // Complete Job
  await prisma.transportJob.update({
    where: { id: trip.jobId },
    data: { status: 'COMPLETED' },
  });

  await prisma.auditLog.create({
    data: {
      userId: driverId,
      action: 'COMPLETE_TRIP',
      entityType: 'Trip',
      entityId: tripId,
      details: `Completed trip ${trip.referenceNumber}. Total distance: ${distanceTravelled ?? 'N/A'} km`,
    },
  });

  return completedTrip;
};

export const cancelTrip = async (tripId: string, reason: string, userId: string, userRole: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true },
  });
  if (!trip) throw new AppError('Trip not found', 404);

  if (userRole !== 'ADMIN' && trip.vehicle.ownerId !== userId) {
    throw new AppError('You do not have permission to cancel this trip', 403);
  }

  if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
    throw new AppError(`Trip is already ${trip.status}`, 400);
  }

  const cancelledTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CANCEL_TRIP',
      entityType: 'Trip',
      entityId: tripId,
      details: `Cancelled trip: ${reason}`,
    },
  });

  return cancelledTrip;
};
