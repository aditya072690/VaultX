import { Router } from 'express';
import * as sharingController from '../controllers/sharingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/public/:token', sharingController.getPublicFile);
router.get('/public/:token/download', sharingController.downloadPublicFile);

// User-to-User Shared routes
router.get('/files/shared-with-me', authenticate, sharingController.getSharedWithMe);
router.get('/files/shared-by-me', authenticate, sharingController.getSharedByMe);
router.post('/files/:id/share-user', authenticate, sharingController.shareFileWithUser);
router.post('/files/:id/share-with-user', authenticate, sharingController.shareFileWithUser);
router.post('/files/:fileId/move-to-private', authenticate, sharingController.moveToPrivate);

// Share management routes
router.patch('/files/shares/:shareId/accept', authenticate, sharingController.acceptShare);
router.patch('/files/shares/:shareId/reject', authenticate, sharingController.rejectShare);
router.delete('/files/shares/:shareId', authenticate, sharingController.deleteShare);
router.delete('/shares/user/:shareId', authenticate, sharingController.deleteShare);

// Public links management routes
router.post('/files/:id/share', authenticate, sharingController.createPublicLink);
router.get('/files/:id/shares', authenticate, sharingController.getFileShares);
router.delete('/shares/:token', authenticate, sharingController.revokePublicLink);

export default router;
