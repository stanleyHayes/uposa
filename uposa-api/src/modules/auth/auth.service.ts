import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/db';
import {
  signMemberToken,
  signMemberRefreshToken,
  signAdminToken,
  signAdminRefreshToken,
} from '../../utils/jwt.utils';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../../utils/email.utils';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validation';

export async function registerMember(data: RegisterInput, photoUrl?: string) {
  const existing = await prisma.member.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const member = await prisma.member.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      maritalStatus: data.maritalStatus,
      photoUrl: photoUrl || null,
      mobileNumber: data.mobileNumber,
      altPhoneNumber: data.altPhoneNumber,
      residentialAddress: data.residentialAddress,
      city: data.city,
      country: data.country,
      yearGroup: data.yearGroup,
      programme: data.programme,
      house: data.house,
      employmentType: data.employmentType,
      occupation: data.occupation,
      organization: data.organization,
      areaOfExpertise: data.areaOfExpertise || [],
      emergencyContactNumber: data.emergencyContactNumber,
      emergencyRelationship: data.emergencyRelationship,
      nextOfKinName: data.nextOfKinName,
      nextOfKinContact: data.nextOfKinContact,
      nextOfKinRelationship: data.nextOfKinRelationship,
      isWhatsAppMember: data.isWhatsAppMember || false,
      willingToVolunteer: data.willingToVolunteer,
      preferredContributions: data.preferredContributions || [],
      consentGiven: data.consentGiven,
      verificationToken,
      membershipStatus: 'PENDING',
      isApproved: false,
    },
  });

  try {
    await sendVerificationEmail(member.email, verificationToken, member.fullName);
    await sendWelcomeEmail(member.email, member.fullName);
  } catch (emailErr) {
    console.error('Failed to send email:', emailErr);
  }

  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member;
  return safeData;
}

export async function loginMember(data: LoginInput) {
  const member = await prisma.member.findUnique({ where: { email: data.email } });
  if (!member) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const passwordMatch = await bcrypt.compare(data.password, member.password);
  if (!passwordMatch) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (!member.isVerified) {
    throw Object.assign(new Error('Please verify your email address before logging in'), { statusCode: 403 });
  }

  if (!member.isApproved) {
    throw Object.assign(new Error('Your membership is pending admin approval'), { statusCode: 403 });
  }

  if (member.membershipStatus === 'SUSPENDED') {
    throw Object.assign(new Error('Your account has been suspended'), { statusCode: 403 });
  }

  if (member.membershipStatus === 'INACTIVE') {
    throw Object.assign(new Error('Your account is inactive'), { statusCode: 403 });
  }

  const tokenPayload = { id: member.id, email: member.email };
  const accessToken = signMemberToken(tokenPayload);
  const refreshToken = signMemberRefreshToken(tokenPayload);

  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member;
  return { member: safeData, accessToken, refreshToken };
}

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
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

  const tokenPayload = { id: admin.id, email: admin.email, role: admin.role as 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' };
  const accessToken = signAdminToken(tokenPayload);
  const refreshToken = signAdminRefreshToken(tokenPayload);

  const { password: _pw, ...safeData } = admin;
  return { admin: safeData, accessToken, refreshToken };
}

export async function verifyEmailToken(token: string) {
  const member = await prisma.member.findFirst({ where: { verificationToken: token } });
  if (!member) {
    throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { isVerified: true, verificationToken: null },
  });

  return { message: 'Email verified successfully' };
}

export async function forgotPassword(data: ForgotPasswordInput) {
  const member = await prisma.member.findUnique({ where: { email: data.email } });
  // Always return success to avoid email enumeration
  if (!member) return { message: 'If an account exists with that email, a reset link has been sent' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.member.update({
    where: { id: member.id },
    data: { resetToken, resetTokenExpiry },
  });

  try {
    await sendPasswordResetEmail(member.email, resetToken, member.fullName);
  } catch (emailErr) {
    console.error('Failed to send reset email:', emailErr);
  }

  return { message: 'If an account exists with that email, a reset link has been sent' };
}

export async function resetPassword(data: ResetPasswordInput) {
  const member = await prisma.member.findFirst({
    where: {
      resetToken: data.token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!member) {
    throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  await prisma.member.update({
    where: { id: member.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
  });

  return { message: 'Password reset successfully' };
}

export async function getMe(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    const admin = await prisma.admin.findUnique({ where: { id: userId } });
    if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });
    const { password: _pw, ...safeData } = admin;
    return { type: 'admin', data: safeData };
  }

  const member = await prisma.member.findUnique({ where: { id: userId } });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member;
  return { type: 'member', data: safeData };
}
