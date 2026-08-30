import { Request, Response, NextFunction } from 'express';
import * as userService from '../service/user.service';
import { updateProfileSchema } from '../validators/user.validators';

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const updatedUser = await userService.updateProfile(userId, parsed.data);
    res.status(200).json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};
