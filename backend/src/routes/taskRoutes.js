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
  getDashboardData,
  bulkMarkTasks,
  bulkUnmarkTasks,
  restoreTask,
  getStatistics,
  updateTaskPosition,
  bulkUpdatePositions
} from '../controllers/taskController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

// Dashboard and aggregate routes
router.get('/dashboard', getDashboardData);
router.get('/statistics', getStatistics);

// Bulk operations
router.post('/bulk/mark', bulkMarkTasks);
router.post('/bulk/unmark', bulkUnmarkTasks);

// Positioning (sticky board)
router.patch('/:id/position', updateTaskPosition);
router.post('/positions/bulk', bulkUpdatePositions);

// Task CRUD operations
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/restore', restoreTask);

// Task completion tracking
router.post('/:id/mark', markTaskComplete);
router.post('/:id/unmark', unmarkTaskComplete);

// Task history and summary
router.get('/:id/history', getTaskHistory);
router.get('/:id/summary', getTaskSummary);

export default router;
