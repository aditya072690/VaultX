import multer from 'multer';
import path from 'path';
import { env } from '../config/env';

const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Block potentially dangerous file types
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (blockedExtensions.includes(ext)) {
    cb(new Error(`File type ${ext} is not allowed`));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE),
    files: 10, // Max 10 files per upload
  },
});
