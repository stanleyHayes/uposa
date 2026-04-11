export type RegistrationStatus = 'pending' | 'approved' | 'rejected'
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'SEPARATED' | 'DIVORCED' | 'WIDOWED'
export type Programme = 'GENERAL_ARTS' | 'BUSINESS' | 'HOME_ECONOMICS' | 'VISUAL_ARTS' | 'SCIENCE'
export type House = 'ACKAH' | 'DENSU' | 'TANO' | 'NKRUMAH' | 'PRA' | 'VOLTA'
export type EmploymentType = 'RETIRED' | 'STUDENT' | 'UNEMPLOYED' | 'SELF_EMPLOYED' | 'GOVERNMENT_WORKER' | 'PRIVATE_WORKER'
export type WillingnessToVolunteer = 'YES' | 'NO' | 'MAYBE'

export interface AlumniRegistration {
  id: string
  status: RegistrationStatus
  membershipStatus: MembershipStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string

  // Personal Information
  fullName: string
  gender: Gender
  dateOfBirth: string
  maritalStatus: MaritalStatus
  photoUrl: string

  // Contact Details
  email: string
  mobileNumber: string
  altPhoneNumber: string
  residentialAddress: string
  city: string
  country: string

  // Academic Information
  yearGroup: number
  programme: Programme
  house: House

  // Professional Information
  employmentType: EmploymentType
  occupation: string
  organization: string
  areaOfExpertise: string[]

  // Emergency Contact & Next of Kin
  emergencyContactNumber: string
  emergencyRelationship: string
  nextOfKinName: string
  nextOfKinContact: string
  nextOfKinRelationship: string

  // Association Engagement
  isWhatsAppMember: boolean
  willingToVolunteer: WillingnessToVolunteer
  preferredContributions: string[]
  isAvailableAsMentor: boolean
  mentorBio: string

  // System
  isVerified: boolean
  isApproved: boolean
  approvedAt: string
  consentGiven: boolean
  createdAt: string
  updatedAt: string
}
