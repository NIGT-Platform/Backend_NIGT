import { z } from 'zod';
import { VehicleType, CapacityUnit, DocumentType } from '@prisma/client';

export const registerVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required').max(20, 'Plate number is too long'),
  vehicleType: z.nativeEnum(VehicleType, {
    message: 'Invalid vehicle type',
  }),
  brand: z.string().min(1, 'Brand is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  manufacturingYear: z
    .number()
    .int()
    .min(1950, 'Manufacturing year must be 1950 or later')
    .max(new Date().getFullYear() + 1, 'Manufacturing year cannot be in the future'),
  capacity: z.number().positive('Capacity must be greater than zero'),
  capacityUnit: z.nativeEnum(CapacityUnit, {
    message: 'Invalid capacity unit',
  }),
});

export const updateVehicleSchema = registerVehicleSchema.partial();

export const uploadVehicleDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType, {
    message: 'Invalid document type',
  }),
});

export type RegisterVehicleInput = z.infer<typeof registerVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type UploadVehicleDocumentInput = z.infer<typeof uploadVehicleDocumentSchema>;
