import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createOrUpdateAdmin() {
  console.log('🔐 Setting up Admin account...');

  const targetEmail = 'hadguab77@gmail.com';
  const targetPhone = '+224624376553';
  const newPassword = 'Admin123!';
  const passwordHash = await bcrypt.hash(newPassword, 12);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: targetEmail },
        { role: 'ADMIN' },
      ],
    },
  });

  if (existingAdmin) {
    const updated = await prisma.user.update({
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

    console.log('✅ Admin account updated successfully!');
    console.log('   Email   :', updated.email);
    console.log('   Phone   :', updated.phoneNumber);
    console.log('   Password:', newPassword);
  } else {
    const admin = await prisma.user.create({
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

    console.log('✅ Admin account created successfully!');
    console.log('   Email   :', admin.email);
    console.log('   Phone   :', admin.phoneNumber);
    console.log('   Password:', newPassword);
  }

  // Seed default product categories
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
  console.log('📦 Default product categories created/verified.');

  await prisma.$disconnect();
}

createOrUpdateAdmin().catch((e) => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
