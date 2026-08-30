import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phoneNumber: z.string().startsWith('+').min(11).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
