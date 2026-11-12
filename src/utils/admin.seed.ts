import prisma from './prisma.utils';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

export async function ensureDefaultAdmin() {
  try {
    const targetEmail = 'hadguab77@gmail.com';
    const targetPhone = '+224624376553';
    const rawPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: targetEmail, mode: 'insensitive' } },
          { role: 'ADMIN' },
        ],
      },
    });

    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: targetEmail,
          phoneNumber: targetPhone,
          passwordHash,
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
          emailVerified: true,
        },
      });
      console.log(`🔐 Admin account verified & updated: ${targetEmail}`);
    } else {
      await prisma.user.create({
        data: {
          firstName: 'Super',
          middleName: 'NIGT',
          lastName: 'Admin',
          email: targetEmail,
          phoneNumber: targetPhone,
          passwordHash,
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
          emailVerified: true,
        },
      });
      console.log(`🔐 Admin account created: ${targetEmail}`);
    }
  } catch (err: any) {
    console.error('⚠️ Could not verify/seed admin account on startup:', err.message);
  }
}

export async function ensureDefaultCategories() {
  try {
    const defaultCategories = [
      { name: 'Tires & Wheels', slug: 'tires-and-wheels' },
      { name: 'Engine & Transmission', slug: 'engine-and-transmission' },
      { name: 'Brakes & Suspension', slug: 'brakes-and-suspension' },
      { name: 'Batteries & Electrical', slug: 'batteries-and-electrical' },
      { name: 'Oils & Fluids', slug: 'oils-and-fluids' },
      { name: 'Truck Accessories & Tools', slug: 'truck-accessories-and-tools' },
    ];

    for (const cat of defaultCategories) {
      await prisma.productCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }
    console.log('📦 Default product categories verified.');
  } catch (err: any) {
    console.error('⚠️ Could not seed default categories on startup:', err.message);
  }
}

export async function repairBrokenProductImages() {
  try {
    const products = await prisma.product.findMany({
      include: { images: true, category: true },
    });

    for (const p of products) {
      if (p.images.length === 0) continue;

      // Remove duplicate Unsplash fallback images if the product also has a real Cloudinary or existing local file
      const realImages = p.images.filter((i) => {
        if (i.imageUrl.startsWith('https://res.cloudinary.com')) return true;
        if (i.imageUrl.startsWith('/uploads/') || i.imageUrl.startsWith('uploads/')) {
          const relPath = i.imageUrl.replace(/^\/+/, '');
          return fs.existsSync(path.join(process.cwd(), relPath));
        }
        return !i.imageUrl.includes('images.unsplash.com');
      });

      if (realImages.length > 0) {
        const placeholderIds = p.images
          .filter((i) => i.imageUrl.includes('images.unsplash.com'))
          .map((i) => i.id);
        if (placeholderIds.length > 0) {
          await prisma.productImage.deleteMany({ where: { id: { in: placeholderIds } } });
        }
      }

      // Ensure at most one image is marked primary, preferring Cloudinary/real uploaded images
      const currentImages = await prisma.productImage.findMany({ where: { productId: p.id } });
      if (currentImages.length > 0) {
        const primaries = currentImages.filter((i) => i.isPrimary);
        if (primaries.length !== 1) {
          const preferred =
            currentImages.find((i) => i.isPrimary && i.imageUrl.startsWith('https://res.cloudinary.com')) ||
            currentImages.find((i) => i.isPrimary && !i.imageUrl.includes('images.unsplash.com')) ||
            currentImages.find((i) => i.imageUrl.startsWith('https://res.cloudinary.com')) ||
            currentImages.find((i) => !i.imageUrl.includes('images.unsplash.com')) ||
            currentImages[0];

          await prisma.productImage.updateMany({
            where: { productId: p.id },
            data: { isPrimary: false },
          });
          await prisma.productImage.update({
            where: { id: preferred.id },
            data: { isPrimary: true },
          });
        }
      }
    }
    console.log('🖼️ Product images verified.');
  } catch (err: any) {
    console.error('⚠️ Could not verify product images:', err.message);
  }
}

export async function ensureDatabaseSchemaAdditions() {
  try {
    // 1. Add BUYER to Role enum if not exists
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BUYER';`);

    // 2. Create hero_slides table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        caption TEXT,
        sub_caption TEXT,
        "order" INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✨ Database schema additions verified (BUYER role, hero_slides).');
  } catch (err: any) {
    console.error('⚠️ Could not run schema additions:', err.message);
  }
}
