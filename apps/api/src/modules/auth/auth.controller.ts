import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  adminLoginSchema,
} from './auth.validation';
import {
  registerMember,
  loginMember,
  loginAdmin,
  verifyEmailToken,
  forgotPassword,
  resetPassword,
  getMe,
} from './auth.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.parse({ body: req.body });
  let photoUrl: string | undefined;
  if (req.file) {
    photoUrl = await uploadToCloudinary(req.file, 'members');
  }
  const member = await registerMember(parsed.body, photoUrl);
  successResponse(res, 'Registration successful. Please verify your email.', member, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.parse({ body: req.body });
  const result = await loginMember(parsed.body);

  res.cookie('accessToken', result.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', result.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  successResponse(res, 'Login successful', {
    token: result.accessToken,
    refreshToken: result.refreshToken,
    member: result.member,
  });
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  const parsed = adminLoginSchema.parse({ body: req.body });
  const result = await loginAdmin(parsed.body.email, parsed.body.password);

  res.cookie('adminToken', result.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('adminRefreshToken', result.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  successResponse(res, 'Admin login successful', {
    token: result.accessToken,
    refreshToken: result.refreshToken,
    admin: result.admin,
  });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  if (!token) {
    errorResponse(res, 'Token is required', 400);
    return;
  }
  const result = await verifyEmailToken(token);
  successResponse(res, result.message);
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordSchema.parse({ body: req.body });
  const result = await forgotPassword(parsed.body);
  successResponse(res, result.message);
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordSchema.parse({ body: req.body });
  const result = await resetPassword(parsed.body);
  successResponse(res, result.message);
}

export async function getMeHandler(req: Request, res: Response): Promise<void> {
  if (req.user) {
    const result = await getMe(req.user.id, false);
    successResponse(res, 'Profile retrieved', result);
    return;
  }
  if (req.admin) {
    const result = await getMe(req.admin.id, true);
    successResponse(res, 'Profile retrieved', result);
    return;
  }
  errorResponse(res, 'Not authenticated', 401);
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('adminToken');
  res.clearCookie('adminRefreshToken');
  successResponse(res, 'Logged out successfully');
}
