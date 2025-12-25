import express from 'express';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  markHabitComplete,
  unmarkHabitComplete,
  getHabitHistory,
  getHabitSummary,
  getDashboardData
} from '../controllers/habitController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

// Dashboard and aggregate routes
router.get('/dashboard', getDashboardData);

// Habit CRUD operations
router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

// Habit completion tracking
router.post('/:id/mark', markHabitComplete);
router.post('/:id/unmark', unmarkHabitComplete);

// Habit history and summary
router.get('/:id/history', getHabitHistory);
router.get('/:id/summary', getHabitSummary);

export default router;
