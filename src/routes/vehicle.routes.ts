import { Router } from 'express';
import {
  registerVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  uploadVehicleDocuments
} from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import * as assignmentController from '../controllers/assignment.controller';

const router = Router();

// Protect all vehicle routes (Owners only for now)
router.use(authenticate, authorize('VEHICLE_OWNER'));

router.post('/register', registerVehicle);
router.get('/', getMyVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.post('/:id/documents', upload.array('documents', 5), uploadVehicleDocuments);

// Assignment Endpoints
router.post('/:vehicleId/assign', assignmentController.assignDriver);
router.post('/:vehicleId/unassign', assignmentController.unassignDriver);
router.get('/:vehicleId/assignments', assignmentController.getVehicleAssignments);

export default router;
