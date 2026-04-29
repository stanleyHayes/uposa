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
} from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { authLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public routes (rate-limited to prevent brute force / abuse)
router.post('/register', authLimiter, uploadSingle('photo'), register);
router.post('/login', authLimiter, login);
router.post('/admin/login', authLimiter, adminLogin);
router.post('/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/reset-password', authLimiter, resetPasswordHandler);
router.post('/refresh', authLimiter, refreshTokenHandler);
router.get('/verify-email/:token', verifyEmail);
router.post('/logout', logout);

// Protected - member only
router.put('/change-password', authMiddleware, changePasswordHandler);

// Protected - member or admin
router.get('/me', (req, res, next) => {
  // Try member auth first, then admin auth
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    try {
      const { verifyMemberToken } = require('../../utils/jwt.utils');
      req.user = verifyMemberToken(token);
      next();
    } catch {
      try {
        const { verifyAdminToken } = require('../../utils/jwt.utils');
        req.admin = verifyAdminToken(token);
        next();
      } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    }
  } else {
    res.status(401).json({ success: false, message: 'Token required' });
  }
}, getMeHandler);

export default router;
