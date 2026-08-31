import { Request, Response, NextFunction } from 'express';
import * as adminVehicleService from '../service/admin.vehicle.service';

export const getAllVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await adminVehicleService.getAllVehicles();
    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    next(error);
  }
};

export const getPendingVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await adminVehicleService.getPendingVehicles();
    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vehicle = await adminVehicleService.getVehicleById(id);
    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
};

export const approveVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vehicle = await adminVehicleService.updateVehicleApprovalStatus(id, 'APPROVED');
    res.status(200).json({ success: true, message: 'Vehicle approved successfully', vehicle });
  } catch (error) {
    next(error);
  }
};

export const rejectVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vehicle = await adminVehicleService.updateVehicleApprovalStatus(id, 'REJECTED');
    res.status(200).json({ success: true, message: 'Vehicle rejected successfully', vehicle });
  } catch (error) {
    next(error);
  }
};

export const suspendVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vehicle = await adminVehicleService.suspendVehicle(id);
    res.status(200).json({ success: true, message: 'Vehicle suspended successfully', vehicle });
  } catch (error) {
    next(error);
  }
};
