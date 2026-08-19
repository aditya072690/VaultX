import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const folders = await prisma.folder.findMany({ where: { deletedAt: { not: null } } });
  console.log('Deleted folders:', folders);
}

main().catch(console.error).finally(() => prisma.$disconnect());
