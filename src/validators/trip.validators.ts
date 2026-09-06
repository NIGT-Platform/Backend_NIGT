import { z } from 'zod';

export const startTripSchema = z.object({
  startingOdometer: z.number().min(0, 'Starting odometer reading must be 0 or greater'),
});

export type StartTripInput = z.infer<typeof startTripSchema>;

export const deliverySchema = z.object({
  receiverName: z.string().min(2, 'Receiver name is required'),
  receiverPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type DeliveryInput = z.infer<typeof deliverySchema>;

export const completeTripSchema = z.object({
  endingOdometer: z.number().min(0, 'Ending odometer reading must be 0 or greater'),
});

export type CompleteTripInput = z.infer<typeof completeTripSchema>;

export const cancelTripSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
});

export type CancelTripInput = z.infer<typeof cancelTripSchema>;
