import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getRepos } from '../../repositories';
import { notify } from '../../utils/notify';
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
  const { members } = getRepos();
  const existing = await members.findOne({ email: data.email });
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
    region: null,
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
  const member = await members.findOne({ email: data.email });
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

export async function loginAdmin(email: string, password: string) {
  const { admins } = getRepos();
  const admin = await admins.findOne({ email });
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

  const { password: _pw, ...safeData } = admin as any;
  return { admin: safeData, accessToken, refreshToken };
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
  const member = await members.findOne({ email: data.email });
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
  await members.updateById((member as any).id, { password: hashedPassword, resetToken: null, resetTokenExpiry: null });

  return { message: 'Password reset successfully' };
}

export async function getMe(userId: string, isAdmin: boolean) {
  const { admins, members } = getRepos();

  if (isAdmin) {
    const admin = await admins.findById(userId);
    if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });
    const { password: _pw, ...safeData } = admin as any;
    return { type: 'admin', data: safeData };
  }

  const member = await members.findById(userId);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member as any;
  return { type: 'member', data: safeData };
}
