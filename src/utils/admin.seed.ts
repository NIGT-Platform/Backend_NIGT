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
