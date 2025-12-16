import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', checkAuth, getMe);
router.post('/logout', checkAuth, logout);

export default router;
