import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.get('/search', userController.searchUsers);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.changePassword);
router.post('/onboarding', userController.completeOnboarding);
router.get('/storage/quota', userController.getStorageQuota);
router.get('/storage', userController.getStorageAnalytics);
router.post('/upgrade-plan', userController.upgradePlan);
router.get('/activity', userController.getActivityLog);

export default router;
