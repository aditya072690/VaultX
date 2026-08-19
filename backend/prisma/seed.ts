import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for VaultX...');

  // Hash password for demo accounts
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);

  // Upsert Demo Admin / System User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vaultx.com' },
    update: {},
    create: {
      email: 'admin@vaultx.com',
      password: hashedPassword,
      firstName: 'VaultX',
      lastName: 'Admin',
      storageLimit: BigInt(1099511627776), // 1TB for admin
      storageUsed: BigInt(0),
      onboardingCompleted: true,
      isFirstLogin: false,
    },
  });

  console.log(`✅ Admin user verified: ${adminUser.email}`);

  // Create default Vault settings for admin user
  await prisma.vaultSettings.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      vaultPin: await bcrypt.hash('123456', salt),
      autoLockTimeout: 1800,
      lockOnAppClose: true,
      lockOnInactivity: true,
    },
  });

  console.log('✅ Vault security settings initialized.');
  console.log('🌱 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
