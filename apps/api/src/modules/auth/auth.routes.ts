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
} from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Public routes
router.post('/register', uploadSingle('photo'), register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);
router.get('/verify-email/:token', verifyEmail);
router.post('/logout', logout);

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
