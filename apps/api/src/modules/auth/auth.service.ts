import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getRepos } from '../../repositories';
import { env } from '../../config/env';
import { emailMatch } from '../../utils/search.utils';
import { toSafeAdmin } from '../admin/admin.service';
import {
  signMemberToken,
  signMemberRefreshToken,
  signAdminToken,
  signAdminRefreshToken,
  verifyMemberRefreshToken,
  verifyAdminRefreshToken,
  issuedBeforePasswordChange,
} from '../../utils/jwt.utils';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAdminPasswordResetEmail,
  sendWelcomeEmail,
} from '../../utils/email.utils';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validation';

export async function registerMember(data: RegisterInput, photoUrl?: string) {
  const { members } = getRepos();
  // Case-insensitive: older accounts may be stored mixed-case.
  const existing = await members.findOne({ email: emailMatch(data.email) });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const member = await members.create({
    fullName: data.fullName,
    email: data.email,
    password: hashedPassword,
    gender: data.gender || null,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    maritalStatus: data.maritalStatus || null,
    photoUrl: photoUrl || null,
    mobileNumber: data.mobileNumber || null,
    altPhoneNumber: data.altPhoneNumber || null,
    residentialAddress: data.residentialAddress || null,
    city: data.city || null,
    region: data.region || null,
    country: data.country || null,
    yearGroup: data.yearGroup || null,
    programme: data.programme || null,
    house: data.house || null,
    employmentType: data.employmentType || null,
    occupation: data.occupation || null,
    organization: data.organization || null,
    areaOfExpertise: data.areaOfExpertise || [],
    emergencyContactNumber: data.emergencyContactNumber || null,
    emergencyRelationship: data.emergencyRelationship || null,
    nextOfKinName: data.nextOfKinName || null,
    nextOfKinContact: data.nextOfKinContact || null,
    nextOfKinRelationship: data.nextOfKinRelationship || null,
    isAvailableAsMentor: false,
    mentorBio: null,
    isWhatsAppMember: data.isWhatsAppMember || false,
    willingToVolunteer: data.willingToVolunteer || null,
    preferredContributions: data.preferredContributions || [],
    membershipStatus: 'PENDING',
    isApproved: false,
    approvedAt: null,
    consentGiven: data.consentGiven,
    isVerified: false,
    verificationToken,
    resetToken: null,
    resetTokenExpiry: null,
  });

  try {
    await sendVerificationEmail(member.email, verificationToken, member.fullName);
    await sendWelcomeEmail(member.email, member.fullName);
  } catch (emailErr) {
    console.error('Failed to send email:', emailErr);
  }

  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member as any;
  return safeData;
}

export async function loginMember(data: LoginInput) {
  const { members } = getRepos();
  const member = await members.findOne({ email: emailMatch(data.email) });
  if (!member) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const passwordMatch = await bcrypt.compare(data.password, member.password);
  if (!passwordMatch) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (!member.isVerified) {
    if (process.env.NODE_ENV === 'development') {
      // Auto-verify in dev mode for testing convenience
      await members.updateById((member as any).id, { isVerified: true, verificationToken: null });
    } else {
      throw Object.assign(new Error('Please verify your email address before logging in'), { statusCode: 403 });
    }
  }

  if (!member.isApproved) {
    if (process.env.NODE_ENV === 'development') {
      // Auto-approve in dev mode for testing convenience
      await members.updateById((member as any).id, { isApproved: true, approvedAt: new Date(), membershipStatus: 'ACTIVE' });
    } else {
      throw Object.assign(new Error('Your membership is pending admin approval'), { statusCode: 403 });
    }
  }

  if (member.membershipStatus === 'SUSPENDED') {
    throw Object.assign(new Error('Your account has been suspended'), { statusCode: 403 });
  }

  if (member.membershipStatus === 'INACTIVE') {
    throw Object.assign(new Error('Your account is inactive'), { statusCode: 403 });
  }

  const tokenPayload = { id: (member as any).id, email: member.email };
  const accessToken = signMemberToken(tokenPayload);
  const refreshToken = signMemberRefreshToken(tokenPayload);

  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member as any;

  return { member: safeData, accessToken, refreshToken };
}

export async function refreshMemberSession(refreshToken: string) {
  let payload: { id: string; email: string; iat?: number };
  try {
    payload = verifyMemberRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const { members } = getRepos();
  const member = await members.findById(payload.id);
  if (!member) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  if ((member as any).membershipStatus === 'SUSPENDED' || (member as any).membershipStatus === 'INACTIVE') {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  // A password change/reset revokes every session issued before it.
  if (issuedBeforePasswordChange(payload.iat, member.passwordChangedAt)) {
    throw Object.assign(new Error('Session expired, please log in again'), { statusCode: 401 });
  }

  const tokenPayload = { id: (member as any).id, email: (member as any).email };
  const accessToken = signMemberToken(tokenPayload);
  const newRefreshToken = signMemberRefreshToken(tokenPayload);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function loginAdmin(email: string, password: string) {
  const { admins } = getRepos();
  const admin = await admins.findOne({ email: emailMatch(email) });
  if (!admin) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (!passwordMatch) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  if (!admin.isActive) {
    throw Object.assign(new Error('Admin account is deactivated'), { statusCode: 403 });
  }

  const tokenPayload = { id: (admin as any).id, email: admin.email, role: admin.role as 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' };
  const accessToken = signAdminToken(tokenPayload);
  const refreshToken = signAdminRefreshToken(tokenPayload);

  return { admin: toSafeAdmin(admin), accessToken, refreshToken };
}

/**
 * Exchange an admin refresh token for a new session. Admin access tokens last
 * 15 minutes; without this, admins were sent to /login mid-edit and lost the
 * form they were filling in. Re-reads the admin so deactivation and role
 * changes take effect at the next refresh.
 */
export async function refreshAdminSession(refreshToken: string) {
  let payload: { id: string; iat?: number };
  try {
    payload = verifyAdminRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const { admins } = getRepos();
  const admin = await admins.findById(payload.id);
  if (!admin || !admin.isActive) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }
  if (issuedBeforePasswordChange(payload.iat, admin.passwordChangedAt)) {
    throw Object.assign(new Error('Session expired, please log in again'), { statusCode: 401 });
  }

  const tokenPayload = { id: (admin as any).id, email: admin.email, role: admin.role as 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' };
  return { accessToken: signAdminToken(tokenPayload), refreshToken: signAdminRefreshToken(tokenPayload) };
}

export async function verifyEmailToken(token: string) {
  const { members } = getRepos();
  const member = await members.findOne({ verificationToken: token });
  if (!member) {
    throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
  }

  await members.updateById((member as any).id, { isVerified: true, verificationToken: null });
  return { message: 'Email verified successfully' };
}

export async function forgotPassword(data: ForgotPasswordInput) {
  const { members } = getRepos();
  const member = await members.findOne({ email: emailMatch(data.email) });
  if (!member) return { message: 'If an account exists with that email, a reset link has been sent' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await members.updateById((member as any).id, { resetToken, resetTokenExpiry });

  try {
    await sendPasswordResetEmail(member.email, resetToken, member.fullName);
  } catch (emailErr) {
    console.error('Failed to send reset email:', emailErr);
  }

  return { message: 'If an account exists with that email, a reset link has been sent' };
}

export async function resetPassword(data: ResetPasswordInput) {
  const { members } = getRepos();
  const member = await members.findOne({
    resetToken: data.token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!member) {
    throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  await members.updateById((member as any).id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null,
    passwordChangedAt: new Date(),
  });

  return { message: 'Password reset successfully' };
}

export async function changeMemberPassword(memberId: string, data: { currentPassword: string; newPassword: string }) {
  const { members } = getRepos();
  const member = await members.findById(memberId) as any;
  if (!member) {
    throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  }

  const ok = await bcrypt.compare(data.currentPassword, member.password);
  if (!ok) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });
  }

  if (data.currentPassword === data.newPassword) {
    throw Object.assign(new Error('New password must be different from current password'), { statusCode: 400 });
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 12);
  await members.updateById(member.id, { password: hashedPassword, passwordChangedAt: new Date() });

  // Older refresh tokens are now revoked; hand this device a fresh session.
  const tokenPayload = { id: member.id, email: member.email };
  return {
    message: 'Password changed successfully',
    accessToken: signMemberToken(tokenPayload),
    refreshToken: signMemberRefreshToken(tokenPayload),
  };
}

export async function getMe(userId: string, isAdmin: boolean) {
  const { admins, members } = getRepos();

  if (isAdmin) {
    const admin = await admins.findById(userId);
    if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });
    return { type: 'admin', data: toSafeAdmin(admin) };
  }

  const member = await members.findById(userId);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member as any;
  return { type: 'member', data: safeData };
}

// ── Admin password reset ──

const ADMIN_RESET_MESSAGE = 'If an admin account exists with that email, a reset link has been sent';

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Always resolves with the same message (no account enumeration). */
export async function adminForgotPassword(email: string) {
  const { admins } = getRepos();
  const admin = await admins.findOne({ email: emailMatch(email) });
  if (!admin || !admin.isActive) return { message: ADMIN_RESET_MESSAGE };

  // Only the hash is stored, so a database leak doesn't expose usable reset links.
  const token = crypto.randomBytes(32).toString('hex');
  await admins.updateById((admin as any).id, {
    resetTokenHash: sha256(token),
    resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
  });

  try {
    await sendAdminPasswordResetEmail(admin.email, `${env.ADMIN_URL}/reset-password?token=${token}`, admin.fullName);
  } catch (emailErr) {
    console.error('Failed to send admin reset email:', emailErr);
  }

  return { message: ADMIN_RESET_MESSAGE };
}

export async function adminResetPassword(token: string, password: string) {
  const { admins } = getRepos();
  const admin = await admins.findOne({
    resetTokenHash: sha256(token),
    resetTokenExpiry: { $gt: new Date() },
  });
  if (!admin || !admin.isActive) {
    throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
  }

  await admins.updateById((admin as any).id, {
    password: await bcrypt.hash(password, 12),
    resetTokenHash: null,
    resetTokenExpiry: null,
    passwordChangedAt: new Date(),
  });

  return { message: 'Password reset successfully' };
}
