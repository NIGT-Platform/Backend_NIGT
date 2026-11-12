import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';

export const getPublicHeroSlides = async () => {
  return await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
};

export const getAllHeroSlidesAdmin = async () => {
  return await prisma.heroSlide.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
};

export const createHeroSlide = async (data: {
  imageUrl: string;
  caption?: string;
  subCaption?: string;
  order?: number;
}) => {
  return await prisma.heroSlide.create({
    data: {
      imageUrl: data.imageUrl,
      caption: data.caption,
      subCaption: data.subCaption,
      order: data.order || 0,
      isActive: true,
    },
  });
};

export const deleteHeroSlide = async (id: string) => {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) throw new AppError('Hero slide not found', 404);
  return await prisma.heroSlide.delete({ where: { id } });
};

