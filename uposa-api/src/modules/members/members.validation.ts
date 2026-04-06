import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']).optional(),
    mobileNumber: z.string().optional(),
    altPhoneNumber: z.string().optional(),
    residentialAddress: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    yearGroup: z.coerce.number().int().min(1982).optional(),
    programme: z.enum(['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE']).optional(),
    house: z.enum(['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA']).optional(),
    employmentType: z.enum(['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER']).optional(),
    occupation: z.string().optional(),
    organization: z.string().optional(),
    areaOfExpertise: z.array(z.string()).optional(),
    emergencyContactNumber: z.string().optional(),
    emergencyRelationship: z.string().optional(),
    nextOfKinName: z.string().optional(),
    nextOfKinContact: z.string().optional(),
    nextOfKinRelationship: z.string().optional(),
    isWhatsAppMember: z.boolean().optional(),
    willingToVolunteer: z.enum(['YES', 'NO', 'MAYBE']).optional(),
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
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
