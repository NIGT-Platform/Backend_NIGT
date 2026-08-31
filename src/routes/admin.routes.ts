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

import * as adminVehicleController from '../controllers/admin.vehicle.controller';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// --- User Management ---
router.get('/users/pending', getPendingUsers);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);
router.patch('/users/:id/suspend', suspendUser);

// --- Vehicle Management ---
router.get('/vehicles/pending', adminVehicleController.getPendingVehicles);
router.get('/vehicles', adminVehicleController.getAllVehicles);
router.get('/vehicles/:id', adminVehicleController.getVehicleById);
router.patch('/vehicles/:id/approve', adminVehicleController.approveVehicle);
router.patch('/vehicles/:id/reject', adminVehicleController.rejectVehicle);
router.patch('/vehicles/:id/suspend', adminVehicleController.suspendVehicle);

export default router;
