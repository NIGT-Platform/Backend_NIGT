import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all user routes
router.use(authenticate);

router.put('/profile', updateProfile);

export default router;
