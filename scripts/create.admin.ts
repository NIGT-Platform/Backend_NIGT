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

  await prisma.$disconnect();
}

createOrUpdateAdmin().catch((e) => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
