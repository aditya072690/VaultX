import { Router } from 'express';
import * as fileController from '../controllers/fileController';
import { authenticate } from '../middleware/auth';
import { vaultProtected } from '../middleware/vault.middleware';
import { upload } from '../middleware/upload';

const router = Router();

// All file routes require authentication
router.use(authenticate);

// Private Vault protected routes (must be mounted before /:id wildcard)
router.get('/private', vaultProtected, fileController.getPrivateFiles);
router.post('/private', vaultProtected, upload.single('file'), fileController.uploadPrivateFile);

// General file routes
router.get('/', fileController.listFiles);
router.post('/', upload.single('file'), fileController.uploadFile);
router.post('/multiple', upload.array('files', 10), fileController.uploadMultiple);
router.post('/:id/toggle-vault', fileController.togglePrivateVault);
router.get('/:id', fileController.getFile);
router.get('/:id/download', fileController.downloadFile);
router.get('/:id/preview', fileController.previewFile);
router.put('/:id', fileController.renameFile);
router.put('/:id/move', fileController.moveFile);
router.put('/:id/visibility', fileController.toggleVisibility);
router.delete('/:id', fileController.deleteFile);
router.post('/:id/restore', fileController.restoreFile);
router.delete('/:id/permanent', fileController.permanentDelete);

export default router;
