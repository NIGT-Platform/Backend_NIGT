import { Request, Response, NextFunction } from 'express';
import * as vehicleService from '../service/vehicle.service';
import { registerVehicleSchema, updateVehicleSchema, uploadVehicleDocumentSchema } from '../validators/vehicle.validators';
import { uploadFileToCloudinary } from '../utils/cloudinary.util';

export const registerVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const parsed = registerVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const vehicle = await vehicleService.registerVehicle(ownerId, parsed.data);
    res.status(201).json({ success: true, message: 'Vehicle registered successfully', vehicle });
  } catch (error) {
    next(error);
  }
};

export const getMyVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const vehicles = await vehicleService.getOwnerVehicles(ownerId);
    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const id = req.params.id as string;
    const vehicle = await vehicleService.getVehicleById(id, ownerId);
    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const id = req.params.id as string;
    
    const parsed = updateVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const updatedVehicle = await vehicleService.updateVehicle(id, ownerId, parsed.data);
    res.status(200).json({ success: true, message: 'Vehicle updated successfully', vehicle: updatedVehicle });
  } catch (error) {
    next(error);
  }
};

export const uploadVehicleDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const id = req.params.id as string;
    
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Document file is required' });
      return;
    }

    const parsed = uploadVehicleDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const documentUrl = await uploadFileToCloudinary(req.file, 'vehicles');

    const document = await vehicleService.addVehicleDocument(id, ownerId, parsed.data, documentUrl);
    res.status(201).json({ success: true, message: 'Document uploaded successfully', document });
  } catch (error) {
    next(error);
  }
};
