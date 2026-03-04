import express from 'express';
import { checkAuth } from '../middleware/auth.js';
import {
  handleMessage,
  getHistory,
  resetConversation,
  getSuggestions,
} from '../controllers/assistantController.js';

const router = express.Router();

router.use(checkAuth);

router.post('/message', handleMessage);
router.get('/history', getHistory);
router.post('/reset', resetConversation);
router.get('/suggestions', getSuggestions);

export default router;
