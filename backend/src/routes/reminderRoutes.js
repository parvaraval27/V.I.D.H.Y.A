import express from 'express';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getReminderTypes,
  createReminderType,
  updateReminderType,
  deleteReminderType
} from '../controllers/reminderController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(checkAuth);

// Reminders
router.get('/', getReminders);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

// Types
router.get('/types', getReminderTypes);
router.post('/types', createReminderType);
router.put('/types/:id', updateReminderType);
router.delete('/types/:id', deleteReminderType);

export default router;
