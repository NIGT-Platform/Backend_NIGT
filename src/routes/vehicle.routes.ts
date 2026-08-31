import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import * as vehicleController from '../controllers/vehicle.controller';

const router = Router();

// Only VEHICLE_OWNER can access these routes
router.use(authenticate, authorize('VEHICLE_OWNER'));

router.post('/', vehicleController.registerVehicle);
router.get('/my-vehicles', vehicleController.getMyVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.patch('/:id', vehicleController.updateVehicle);
router.post('/:id/documents', upload.single('document'), vehicleController.uploadVehicleDocument);

export default router;
