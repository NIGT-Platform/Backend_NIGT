import prisma from './prisma.utils';
import bcrypt from 'bcrypt';

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

    const categoryImageMap: Record<string, string> = {
      'oils-and-fluids': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&auto=format&fit=crop&q=80',
      'tires-and-wheels': 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&auto=format&fit=crop&q=80',
      'batteries-and-electrical': 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&auto=format&fit=crop&q=80',
      'brakes-and-suspension': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      'engine-and-transmission': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    };

    const defaultImg = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80';

    for (const p of products) {
      const catSlug = p.category?.slug || '';
      const fallbackUrl = categoryImageMap[catSlug] || defaultImg;

      // Check if product has any Cloudinary image
      const hasCloudinaryImg = p.images.some((i) => i.imageUrl.startsWith('https://res.cloudinary.com'));

      if (!hasCloudinaryImg) {
        // Find broken ephemeral local uploads
        const deadImages = p.images.filter(
          (i) => i.imageUrl.startsWith('uploads/') || i.imageUrl.startsWith('/uploads/')
        );

        if (deadImages.length > 0) {
          // Update the first image to a working high-res image and make it primary
          await prisma.productImage.update({
            where: { id: deadImages[0].id },
            data: { imageUrl: fallbackUrl, isPrimary: true },
          });
        } else if (p.images.length === 0) {
          await prisma.productImage.create({
            data: {
              productId: p.id,
              imageUrl: fallbackUrl,
              isPrimary: true,
            },
          });
        }
      }

      // Ensure at least one image is primary
      const updatedImages = await prisma.productImage.findMany({ where: { productId: p.id } });
      if (updatedImages.length > 0 && !updatedImages.some((i) => i.isPrimary)) {
        await prisma.productImage.update({
          where: { id: updatedImages[0].id },
          data: { isPrimary: true },
        });
      }
    }
    console.log('🖼️ Product images verified and repaired.');
  } catch (err: any) {
    console.error('⚠️ Could not repair product images:', err.message);
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
