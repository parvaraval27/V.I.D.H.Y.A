import express from 'express';
import { checkAuth } from '../middleware/auth.js';
import { 
  getProfile, 
  updateProfile, 
  getStats,
  changePassword,
  updateUsername
} from '../controllers/profileController.js';

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

// Profile routes
router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/stats', getStats);
router.put('/password', changePassword);
router.put('/username', updateUsername);

export default router;
