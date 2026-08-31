import { Router } from 'express';
import { getProfile, uploadProfileImage, submitProfileEditRequest, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Protect all user routes
router.use(authenticate);

router.get('/profile', getProfile);
router.post('/profile/image', upload.single('image'), uploadProfileImage);
router.post('/profile/edit-request', submitProfileEditRequest);
router.put('/profile', updateProfile); // legacy compatibility

export default router;
