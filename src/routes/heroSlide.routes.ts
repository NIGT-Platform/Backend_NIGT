import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import * as heroController from '../controllers/heroSlide.controller';

const router = Router();

// Public: Get all active slides for the landing page
router.get('/', heroController.getPublicHeroSlides);

// Admin: Manage hero slides
router.get('/admin', authenticate, authorize('ADMIN'), heroController.getAllHeroSlidesAdmin);
router.post('/admin', authenticate, authorize('ADMIN'), upload.single('image'), heroController.createHeroSlide);
router.delete('/admin/:id', authenticate, authorize('ADMIN'), heroController.deleteHeroSlide);

export default router;
