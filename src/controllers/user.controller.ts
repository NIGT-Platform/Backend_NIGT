import { Request, Response, NextFunction } from 'express';
import * as profileService from '../service/profile.service';
import { profileEditRequestSchema } from '../validators/profile.validators';

// GET /api/users/profile
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = await profileService.getProfile(userId);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/profile/image
export const uploadProfileImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Image file is required' });
      return;
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const result = await profileService.updateProfileImage(userId, imageUrl);
    res.status(200).json({ success: true, message: 'Profile image updated', ...result });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/profile/edit-request
export const submitProfileEditRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parsed = profileEditRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const request = await profileService.submitProfileEditRequest(userId, parsed.data);
    res.status(201).json({ success: true, message: 'Profile change request submitted. Awaiting admin approval.', request });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile (legacy — keep for backward compat, now redirects to edit-request)
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parsed = profileEditRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const request = await profileService.submitProfileEditRequest(userId, parsed.data);
    res.status(201).json({ success: true, message: 'Profile change request submitted. Awaiting admin approval.', request });
  } catch (error) {
    next(error);
  }
};
