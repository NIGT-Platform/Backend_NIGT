import { z } from 'zod';

export const profileEditRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phoneNumber: z
    .string()
    .min(10, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .startsWith('+', 'Phone number must start with +'),
});

export type ProfileEditRequestInput = z.infer<typeof profileEditRequestSchema>;
