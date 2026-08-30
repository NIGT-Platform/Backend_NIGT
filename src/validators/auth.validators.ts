import {z} from 'zod';

const passwordSchema = z
 .string()
 .min(8,'Password must be at least 8 characters')
 .max(128,'Password must be less than 128 characters')
 .regex(/[a-z]/,'Password must contain at least one lowercase letter')
 .regex(/[A-Z]/,'Password must contain at least one uppercase letter')
 .regex(/[0-9]/,'Password must contain at least one number')
 .regex(/[^a-zA-Z0-9]/,'Password must contain at least one special character'); 

 const phoneSchema = z
  .string()
  .startsWith('+')
  .min(11, 'Phone number must be at least 11 characters')
  .max(15, 'Phone number must be less than 15 characters')
  .regex(/^[0-9+]+$/, 'Phone number must contain only numbers and the + symbol'); 


export const vehicleOwnerRegisterSchema = z.object({
    firstName: z.string().min(1,'First name is required'),
    middleName: z.string().min(1,'Middle name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
  
export const driverRegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().min(1,'Middle name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseType: z.enum(['CLASS_A', 'CLASS_B', 'CLASS_C', 'CLASS_D', 'CLASS_E']),
  licenseExpiryDate: z.string().refine((date) => {
    const expiry = new Date(date);
    return expiry > new Date();
  }, 'License has expired or date is invalid'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
    
export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type VehicleOwnerRegisterInput = z.infer<typeof vehicleOwnerRegisterSchema>;
export type DriverRegisterInput = z.infer<typeof driverRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;