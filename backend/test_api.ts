import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  
  if (!user) return console.error('No user found');
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'vaultx-dev-secret-change-in-production-abc123');
  
  const res = await fetch('http://localhost:5001/api/folders?includeDeleted=true', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.log('API RESPONSE:', JSON.stringify(data, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
