import { Request, Response, NextFunction } from 'express';
import * as heroService from '../service/heroSlide.service';
import { uploadFileToCloudinary } from '../utils/cloudinary.util';

export const getPublicHeroSlides = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slides = await heroService.getPublicHeroSlides();
    res.status(200).json({ success: true, count: slides.length, slides });
  } catch (error) {
    next(error);
  }
};

export const getAllHeroSlidesAdmin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slides = await heroService.getAllHeroSlidesAdmin();
    res.status(200).json({ success: true, count: slides.length, slides });
  } catch (error) {
    next(error);
  }
};

export const createHeroSlide = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = await uploadFileToCloudinary(req.file, 'hero');
    }

    if (!imageUrl) {
      res.status(400).json({ success: false, message: 'Image file or imageUrl is required' });
      return;
    }

    const { caption, subCaption, order } = req.body;
    const slide = await heroService.createHeroSlide({
      imageUrl,
      caption: caption || undefined,
      subCaption: subCaption || undefined,
      order: order ? Number(order) : 0,
    });

    res.status(201).json({ success: true, message: 'Hero slide created successfully', slide });
  } catch (error) {
    next(error);
  }
};

export const deleteHeroSlide = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await heroService.deleteHeroSlide(id);
    res.status(200).json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (error) {
    next(error);
  }
};
