import { Router } from 'express';
import { getMyAssignment } from '../controllers/assignment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Protect all driver routes
router.use(authenticate, authorize('DRIVER'));

router.get('/my-assignment', getMyAssignment);

export default router;
