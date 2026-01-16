import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  markTaskComplete,
  unmarkTaskComplete,
  getTaskHistory,
  getTaskSummary,
  getDashboardData
} from '../controllers/taskController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

// Dashboard and aggregate routes
router.get('/dashboard', getDashboardData);

// Task CRUD operations
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task completion tracking
router.post('/:id/mark', markTaskComplete);
router.post('/:id/unmark', unmarkTaskComplete);

// Task history and summary
router.get('/:id/history', getTaskHistory);
router.get('/:id/summary', getTaskSummary);

export default router;
