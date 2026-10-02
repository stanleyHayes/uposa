import { z } from 'zod';

// '' or null clears an optional field (stored as null); undefined leaves it unchanged.
const blankToNull = (val: unknown) => (val === '' ? null : val);
const clearableText = z.preprocess(blankToNull, z.string().nullable().optional());
const clearableEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess(blankToNull, z.enum(values).nullable().optional());

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    gender: clearableEnum(['MALE', 'FEMALE', 'OTHER']),
    dateOfBirth: clearableText,
    maritalStatus: clearableEnum(['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']),
    mobileNumber: clearableText,
    altPhoneNumber: clearableText,
    residentialAddress: clearableText,
    city: clearableText,
    region: clearableText,
    country: clearableText,
    yearGroup: z.preprocess(blankToNull, z.coerce.number().int().min(1981).nullable().optional()),
    programme: clearableEnum(['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE']),
    house: clearableEnum(['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA']),
    employmentType: clearableEnum(['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER']),
    occupation: clearableText,
    organization: clearableText,
    areaOfExpertise: z.array(z.string()).optional(),
    emergencyContactNumber: clearableText,
    emergencyRelationship: clearableText,
    nextOfKinName: clearableText,
    nextOfKinContact: clearableText,
    nextOfKinRelationship: clearableText,
    isWhatsAppMember: z.boolean().optional(),
    willingToVolunteer: clearableEnum(['YES', 'NO', 'MAYBE']),
    preferredContributions: z.array(z.string()).optional(),
  }),
});

export const listMembersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    yearGroup: z.string().optional(),
    house: z.enum(['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA']).optional(),
    programme: z.enum(['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE']).optional(),
    country: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const adminUpdateMemberStatusSchema = z.object({
  body: z.object({
    membershipStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE']),
    // Registration rejection (status INACTIVE) — `reason` accepted as an alias.
    rejectionReason: z.string().trim().max(2000).optional(),
    reason: z.string().trim().max(2000).optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
