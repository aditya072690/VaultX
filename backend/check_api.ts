import axios from 'axios';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  
  // Need to generate a token or bypass auth...
  // Wait, I can just mock the request locally via Supertest, or I can just print the database object.
  const folders = await prisma.folder.findMany({ where: { deletedAt: { not: null } } });
  console.log('Deleted folders from DB:', folders);
  
  // Print exactly what Prisma returns
  for (const f of folders) {
     console.log(f.name, f.deletedAt, typeof f.deletedAt);
  }
}

main().catch(console.error).finally(() => process.exit(0));
