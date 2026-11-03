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
