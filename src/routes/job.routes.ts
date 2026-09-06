import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  assignJob,
  updateJob,
  cancelJob,
} from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Protect all job routes
router.use(authenticate);

// Create a job (ADMIN or VEHICLE_OWNER)
router.post('/', authorize('ADMIN', 'VEHICLE_OWNER'), createJob);

// List jobs (filtered by role in service)
router.get('/', getJobs);

// Get single job details
router.get('/:id', getJobById);

// Assign vehicle & driver to job (ADMIN or VEHICLE_OWNER)
router.post('/:id/assign', authorize('ADMIN', 'VEHICLE_OWNER'), assignJob);

// Update job details (ADMIN or creator)
router.patch('/:id', updateJob);

// Cancel a job (ADMIN or creator)
router.post('/:id/cancel', cancelJob);

export default router;
