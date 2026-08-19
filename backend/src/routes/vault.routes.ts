import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as vaultController from '../controllers/vaultController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rate limiter for unlock attempts (max 5 attempts per 15 minutes)
const unlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many vault unlock attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All vault routes require user authentication
router.use(authenticate);

router.post('/unlock', unlockLimiter, vaultController.unlock);
router.post('/lock', vaultController.lock);
router.post('/extend-session', vaultController.extendSession);
router.get('/status', vaultController.getStatus);
router.get('/settings', vaultController.getSettings);
router.patch('/settings', vaultController.updateSettings);

export default router;
