import { Router } from 'express';
import {
  registerVehicleOwner,
  registerDriver,
  registerBuyer,
  login,
  verifyEmail,
  verifyEmailLink,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/register/vehicle-owner', registerVehicleOwner);
router.post('/register/driver', upload.single('licenseDocument'), registerDriver);
router.post('/register/buyer', registerBuyer);
router.post('/register/user', registerBuyer);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmailLink);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

router.post('/logout', authenticate, logout);

export default router;
