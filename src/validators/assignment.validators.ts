import { z } from 'zod';

export const assignDriverSchema = z.object({
  driverId: z.string().uuid({ message: 'Invalid driver ID format' }),
});

export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
