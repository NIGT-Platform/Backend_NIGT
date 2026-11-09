import { Request, Response, NextFunction } from 'express';
import * as profileService from '../service/profile.service';
import { profileEditRequestSchema } from '../validators/profile.validators';
import { uploadFileToCloudinary } from '../utils/cloudinary.util';

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
    const imageUrl = await uploadFileToCloudinary(req.file, 'avatars');
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

import prisma from '../utils/prisma.utils';

// GET /api/users/available-drivers
export const getAvailableDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        accountStatus: 'ACTIVE',
        // Drivers who do NOT have any ACTIVE assignments
        driverAssignments: {
          none: {
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profileImageUrl: true,
      },
      orderBy: { firstName: 'asc' }
    });
    
    res.status(200).json({ success: true, drivers });
  } catch (error) {
    next(error);
  }
};
