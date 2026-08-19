import folderService from './src/services/folderService';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  
  if (!user) return console.error('No user found');
  
  const folders = await folderService.listFolders(user.id, undefined, true);
  console.log('Folders from service:', JSON.stringify(folders, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
