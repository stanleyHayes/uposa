import { z } from 'zod';

// Multipart form posts (web + mobile register) encode arrays as JSON strings
// and booleans as 'true'/'false' — coerce them before validation.
const stringArrayField = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val.length ? val.split(',').map((entry) => entry.trim()) : [];
      }
    }
    return val;
  },
  z.array(z.string()).optional()
);

// Emails are compared/stored as trimmed lowercase ("Kofi@Mail.com " === "kofi@mail.com").
export const emailField = z.string().trim().toLowerCase().email('Invalid email address');

// Register is multipart (photo upload), so booleans arrive as 'true'/'false' strings.
const toBoolean = (val: unknown) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
};

const booleanField = z.preprocess(toBoolean, z.boolean().optional());

/** A box that must be ticked (literal true); anything else fails with `message`. */
const requiredTrue = (message: string) => z.preprocess(toBoolean, z.literal(true, { error: message }));

/** Optional opt-in, defaults to false (Act 843: consent must be affirmative). */
const optIn = z.preprocess(toBoolean, z.boolean().optional().default(false));

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: emailField,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']).optional(),
    mobileNumber: z.string().optional(),
    altPhoneNumber: z.string().optional(),
    residentialAddress: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    yearGroup: z.coerce.number().int().min(1981).optional(),
    programme: z.enum(['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE']).optional(),
    house: z.enum(['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA']).optional(),
    employmentType: z.enum(['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER']).optional(),
    occupation: z.string().optional(),
    organization: z.string().optional(),
    areaOfExpertise: stringArrayField,
    emergencyContactNumber: z.string().optional(),
    emergencyRelationship: z.string().optional(),
    nextOfKinName: z.string().optional(),
    nextOfKinContact: z.string().optional(),
    nextOfKinRelationship: z.string().optional(),
    isWhatsAppMember: booleanField,
    willingToVolunteer: z.enum(['YES', 'NO', 'MAYBE']).optional(),
    preferredContributions: stringArrayField,
    // Ghana Data Protection Act 2012 (Act 843) + app-store requirements.
    acceptTerms: requiredTrue('You must accept the Terms and Privacy Policy'),
    confirmAdult: requiredTrue('You must confirm you are 18 or older'),
    marketingOptIn: optIn,
    directoryOptIn: optIn,
    // Legacy checkbox, superseded by acceptTerms; still accepted from older clients.
    consentGiven: booleanField,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailField,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const adminLoginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1, 'Password is required'),
  }),
});

// Admin password reset uses the same shapes as the member flow.
export const adminForgotPasswordSchema = forgotPasswordSchema;
export const adminResetPasswordSchema = resetPasswordSchema;

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type AdminLoginInput = z.infer<typeof adminLoginSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
