import crypto from 'crypto';
import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import { CreateJobInput, UpdateJobInput } from '../validators/job.validators';
import { JobPriority, JobStatus } from '@prisma/client';

const generateJobRef = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `JOB-${dateStr}-${randomSuffix}`;
};

const generateTripRef = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TRP-${dateStr}-${randomSuffix}`;
};

export const createJob = async (createdById: string, input: CreateJobInput) => {
  const referenceNumber = generateJobRef();

  const job = await prisma.transportJob.create({
    data: {
      referenceNumber,
      createdById,
      pickupLocation: input.pickupLocation,
      destination: input.destination,
      loadDescription: input.loadDescription,
      loadType: input.loadType,
      loadWeight: input.loadWeight,
      loadUnit: input.loadUnit,
      itemCount: input.itemCount,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      specialInstructions: input.specialInstructions,
      plannedPickupDate: input.plannedPickupDate ? new Date(input.plannedPickupDate) : undefined,
      expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
      priority: input.priority as JobPriority,
      status: 'PENDING_ASSIGNMENT',
    },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, role: true },
      },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: createdById,
      action: 'CREATE_JOB',
      entityType: 'TransportJob',
      entityId: job.id,
      details: `Created job ${job.referenceNumber} (${input.loadDescription})`,
    },
  });

  return job;
};

export const getJobs = async (filters: {
  status?: JobStatus;
  priority?: JobPriority;
  search?: string;
  userId?: string;
  userRole?: string;
}) => {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.search) {
    where.OR = [
      { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
      { pickupLocation: { contains: filters.search, mode: 'insensitive' } },
      { destination: { contains: filters.search, mode: 'insensitive' } },
      { loadDescription: { contains: filters.search, mode: 'insensitive' } },
      { customerName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Role based filtering
  if (filters.userRole === 'DRIVER') {
    where.driverId = filters.userId;
  } else if (filters.userRole === 'VEHICLE_OWNER') {
    // Owners see jobs they created, or jobs assigned to vehicles they own
    where.OR = [
      ...(where.OR ? [{ AND: where.OR }] : []),
      { createdById: filters.userId },
      { vehicle: { ownerId: filters.userId } },
    ];
  }

  return await prisma.transportJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, role: true },
      },
      vehicle: {
        select: { id: true, plateNumber: true, brand: true, model: true, capacity: true, capacityUnit: true },
      },
      driver: {
        select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true },
      },
      trips: {
        select: { id: true, referenceNumber: true, status: true, startingOdometer: true, endingOdometer: true },
      },
    },
  });
};

export const getJobById = async (id: string, userId: string, userRole: string) => {
  const job = await prisma.transportJob.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, role: true },
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
      trips: {
        include: {
          delivery: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!job) throw new AppError('Transport job not found', 404);

  // Access validation
  if (userRole === 'DRIVER' && job.driverId !== userId) {
    throw new AppError('You are not authorized to view this job', 403);
  }
  if (userRole === 'VEHICLE_OWNER' && job.createdById !== userId && job.vehicle?.ownerId !== userId) {
    throw new AppError('You are not authorized to view this job', 403);
  }

  return job;
};

export const assignJob = async (jobId: string, vehicleId: string, assignedById: string) => {
  const job = await prisma.transportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError('Transport job not found', 404);

  if (job.status === 'CANCELLED' || job.status === 'COMPLETED' || job.status === 'DELIVERED') {
    throw new AppError(`Cannot assign a job with status ${job.status}`, 400);
  }

  // Verify Vehicle is APPROVED and ACTIVE
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      assignments: {
        where: { status: 'ACTIVE' },
        include: { driver: true },
      },
    },
  });

  if (!vehicle) throw new AppError('Vehicle not found', 404);
  if (vehicle.approvalStatus !== 'APPROVED' || vehicle.vehicleStatus !== 'ACTIVE') {
    throw new AppError('Vehicle must be APPROVED and ACTIVE to be assigned to a job', 400);
  }

  // Find active driver assigned to this vehicle
  const activeAssignment = vehicle.assignments[0];
  const driverId = activeAssignment?.driverId || null;

  // Update job
  const updatedJob = await prisma.transportJob.update({
    where: { id: jobId },
    data: {
      vehicleId,
      driverId,
      status: 'ASSIGNED',
    },
    include: {
      vehicle: true,
      driver: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
    },
  });

  // If vehicle has an active driver, automatically create a scheduled Trip
  if (driverId) {
    const existingTrip = await prisma.trip.findFirst({
      where: { jobId, status: { not: 'CANCELLED' } },
    });

    if (!existingTrip) {
      await prisma.trip.create({
        data: {
          referenceNumber: generateTripRef(),
          jobId,
          vehicleId,
          driverId,
          pickupLocation: job.pickupLocation,
          destination: job.destination,
          status: 'SCHEDULED',
          plannedDeparture: job.plannedPickupDate,
          expectedArrival: job.expectedDeliveryDate,
        },
      });
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: assignedById,
      action: 'ASSIGN_JOB',
      entityType: 'TransportJob',
      entityId: jobId,
      details: `Assigned vehicle ${vehicle.plateNumber}${driverId ? ` and driver ${driverId}` : ' (no active driver)'}`,
    },
  });

  return updatedJob;
};

export const updateJob = async (jobId: string, input: UpdateJobInput, userId: string, userRole: string) => {
  const job = await prisma.transportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError('Transport job not found', 404);

  if (userRole !== 'ADMIN' && job.createdById !== userId) {
    throw new AppError('You do not have permission to edit this job', 403);
  }

  if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
    throw new AppError(`Cannot update a job that is already ${job.status}`, 400);
  }

  return await prisma.transportJob.update({
    where: { id: jobId },
    data: {
      ...input,
      plannedPickupDate: input.plannedPickupDate ? new Date(input.plannedPickupDate) : undefined,
      expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
      priority: input.priority ? (input.priority as JobPriority) : undefined,
    },
  });
};

export const cancelJob = async (jobId: string, reason: string, userId: string, userRole: string) => {
  const job = await prisma.transportJob.findUnique({
    where: { id: jobId },
    include: { trips: true },
  });
  if (!job) throw new AppError('Transport job not found', 404);

  if (userRole !== 'ADMIN' && job.createdById !== userId) {
    throw new AppError('You do not have permission to cancel this job', 403);
  }

  if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
    throw new AppError(`Job is already ${job.status}`, 400);
  }

  // Cancel any scheduled or in-transit trips associated with this job
  await prisma.trip.updateMany({
    where: {
      jobId,
      status: { in: ['SCHEDULED', 'STARTED', 'IN_TRANSIT', 'ARRIVED'] },
    },
    data: {
      status: 'CANCELLED',
      cancellationReason: `Job cancelled: ${reason}`,
      cancelledAt: new Date(),
    },
  });

  const cancelledJob = await prisma.transportJob.update({
    where: { id: jobId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CANCEL_JOB',
      entityType: 'TransportJob',
      entityId: jobId,
      details: `Cancelled job: ${reason}`,
    },
  });

  return cancelledJob;
};
