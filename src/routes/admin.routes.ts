import { Router } from 'express';
import {
  getAllUsers,
  getPendingUsers,
  getUserById,
  approveUser,
  rejectUser,
  suspendUser,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/users/pending', getPendingUsers);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);
router.patch('/users/:id/suspend', suspendUser);

export default router;
