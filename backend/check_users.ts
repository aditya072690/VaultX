import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email })));
}

main().catch(console.error).finally(() => process.exit(0));
