import { Router } from 'express';
import {
  getTrips,
  getTripById,
  startTrip,
  updateTripStatus,
  recordDelivery,
  completeTrip,
  cancelTrip,
} from '../controllers/trip.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Protect all trip routes
router.use(authenticate);

// List trips (filtered by user role)
router.get('/', getTrips);

// Get single trip details
router.get('/:id', getTripById);

// Driver actions:
// 1. Start trip & log initial odometer
router.post('/:id/start', authorize('DRIVER'), startTrip);

// 2. Update status (e.g. ARRIVED at destination)
router.patch('/:id/status', authorize('DRIVER'), updateTripStatus);

// 3. Confirm delivery with receiver details & optional proof document/photo
router.post('/:id/delivery', authorize('DRIVER'), upload.single('proof'), recordDelivery);

// 4. Complete trip with final odometer reading
router.post('/:id/complete', authorize('DRIVER'), completeTrip);

// Admin & Vehicle Owner actions:
// Cancel a trip
router.post('/:id/cancel', authorize('ADMIN', 'VEHICLE_OWNER'), cancelTrip);

export default router;
