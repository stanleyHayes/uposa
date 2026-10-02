import { Router } from 'express';
import {
  register,
  login,
  adminLogin,
  verifyEmail,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMeHandler,
  logout,
  changePasswordHandler,
  refreshTokenHandler,
  adminRefreshTokenHandler,
  adminForgotPasswordHandler,
  adminResetPasswordHandler,
} from './auth.controller';
import { authMiddleware, memberOrAdminMiddleware } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { authLimiter, refreshLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public routes (rate-limited to prevent brute force / abuse)
router.post('/register', authLimiter, uploadSingle('photo'), register);
router.post('/login', authLimiter, login);
router.post('/admin/login', authLimiter, adminLogin);
router.post('/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/reset-password', authLimiter, resetPasswordHandler);
router.post('/refresh', refreshLimiter, refreshTokenHandler);
router.post('/admin/refresh', refreshLimiter, adminRefreshTokenHandler);
router.post('/admin/forgot-password', authLimiter, adminForgotPasswordHandler);
router.post('/admin/reset-password', authLimiter, adminResetPasswordHandler);
router.get('/verify-email/:token', verifyEmail);
router.post('/logout', logout);

// Protected - member only
router.put('/change-password', authMiddleware, changePasswordHandler);

// Protected - member or admin (live session check included)
router.get('/me', memberOrAdminMiddleware, getMeHandler);

export default router;
