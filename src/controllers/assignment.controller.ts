import { Request, Response, NextFunction } from 'express';
import * as assignmentService from '../service/assignment.service';
import { assignDriverSchema } from '../validators/assignment.validators';
import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';

// POST /api/vehicles/:vehicleId/assign or /api/admin/vehicles/:vehicleId/assign
export const assignDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicleId = req.params.vehicleId as string;
    const assignedById = req.user!.id;
    const userRole = req.user!.role;
    
    const parsed = assignDriverSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // Authorization: If not ADMIN, user must be the owner of the vehicle
    if (userRole !== 'ADMIN') {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) throw new AppError('Vehicle not found', 404);
      if (vehicle.ownerId !== assignedById) {
        throw new AppError('You do not have permission to assign drivers to this vehicle', 403);
      }
    }

    const assignment = await assignmentService.assignDriver(vehicleId, parsed.data.driverId, assignedById);
    res.status(201).json({ success: true, message: 'Driver assigned successfully', assignment });
  } catch (error) {
    next(error);
  }
};

// POST /api/vehicles/:vehicleId/unassign or /api/admin/vehicles/:vehicleId/unassign
export const unassignDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicleId = req.params.vehicleId as string;
    const assignedById = req.user!.id;
    const userRole = req.user!.role;
    
    const parsed = assignDriverSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // Authorization
    if (userRole !== 'ADMIN') {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) throw new AppError('Vehicle not found', 404);
      if (vehicle.ownerId !== assignedById) {
        throw new AppError('You do not have permission to unassign drivers from this vehicle', 403);
      }
    }

    const assignment = await assignmentService.unassignDriver(vehicleId, parsed.data.driverId);
    res.status(200).json({ success: true, message: 'Driver unassigned successfully', assignment });
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/:vehicleId/assignments or /api/admin/vehicles/:vehicleId/assignments
export const getVehicleAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicleId = req.params.vehicleId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole !== 'ADMIN') {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle || vehicle.ownerId !== userId) {
        throw new AppError('You do not have permission to view assignments for this vehicle', 403);
      }
    }

    const assignments = await assignmentService.getVehicleAssignments(vehicleId);
    res.status(200).json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

// GET /api/driver/my-assignment
export const getMyAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.user!.id;
    if (req.user!.role !== 'DRIVER') {
      throw new AppError('Only drivers can access this endpoint', 403);
    }
    
    const assignment = await assignmentService.getDriverCurrentAssignment(driverId);
    res.status(200).json({ success: true, assignment });
  } catch (error) {
    next(error);
  }
};
