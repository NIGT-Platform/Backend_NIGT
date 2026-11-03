import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔐 Creating Admin account...');

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin already exists:', existingAdmin.email);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.create({
    data: {
      firstName: 'Super',
      middleName: 'NIGT',
      lastName: 'Admin',
      email: 'hadguab77@gmail.com',
      phoneNumber: '+224624376553',
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Admin created!');
  console.log('   Email   :', admin.email);
  console.log('   Phone   :', admin.phoneNumber);
  console.log('   Password: Admin@1234');
  console.log('   ⚠️  Change the password after first login!');

  await prisma.$disconnect();
}

createAdmin().catch((e) => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
