import { z } from 'zod';

export const createJobSchema = z.object({
  pickupLocation: z.string().min(2, 'Pickup location is required'),
  destination: z.string().min(2, 'Destination is required'),
  loadDescription: z.string().min(2, 'Load description is required'),
  loadType: z.string().min(2, 'Load type is required'),
  loadWeight: z.number().positive('Load weight must be a positive number'),
  loadUnit: z.enum(['TON', 'KG']).default('TON'),
  itemCount: z.number().int().positive().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  specialInstructions: z.string().optional(),
  plannedPickupDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const assignJobSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
});

export type AssignJobInput = z.infer<typeof assignJobSchema>;

export const updateJobSchema = createJobSchema.partial();

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const cancelJobSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
});

export type CancelJobInput = z.infer<typeof cancelJobSchema>;
