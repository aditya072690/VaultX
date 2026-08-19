import { Router } from 'express';
import * as folderController from '../controllers/folderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', folderController.listFolders);
router.post('/', folderController.createFolder);
router.get('/:id', folderController.getFolder);
router.put('/:id', folderController.renameFolder);
router.delete('/:id', folderController.deleteFolder);
router.post('/:id/restore', folderController.restoreFolder);
router.delete('/:id/permanent', folderController.permanentDeleteFolder);
router.get('/:id/breadcrumb', folderController.getBreadcrumb);

export default router;
