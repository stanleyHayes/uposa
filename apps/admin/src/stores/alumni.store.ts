// @ts-nocheck
import { create } from 'zustand'
import type { AlumniRegistration } from '../types'
import { adminMembersApi } from '../api/services'

interface AlumniState {
  registrations: AlumniRegistration[]
  loading: boolean
  fetchRegistrations: () => Promise<void>
  approveRegistration: (id: string, reviewerId: string, reviewerName: string) => Promise<void>
  rejectRegistration: (id: string, reviewerId: string, reviewerName: string, reason: string) => Promise<void>
  updateRegistration: (id: string, updates: Partial<AlumniRegistration>) => void
}

export const useAlumniStore = create<AlumniState>()((set, get) => ({
  registrations: [],
  loading: false,

  fetchRegistrations: async () => {
    set({ loading: true })
    try {
      const res = await adminMembersApi.list({ limit: 500 })
      const data = (res.data.data || []).map(mapMemberToRegistration)
      set({ registrations: data })
    } catch {
      // Keep existing data on error
    } finally {
      set({ loading: false })
    }
  },

  approveRegistration: async (id, _reviewerId, _reviewerName) => {
    await adminMembersApi.approve(id)
    // Optimistic update
    set((s) => ({
      registrations: s.registrations.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved' as const,
              membershipStatus: 'ACTIVE' as const,
              isApproved: true,
              approvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }))
  },

  rejectRegistration: async (id, _reviewerId, _reviewerName, _reason) => {
    await adminMembersApi.changeStatus(id, 'INACTIVE')
    // Optimistic update
    set((s) => ({
      registrations: s.registrations.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected' as const,
              membershipStatus: 'INACTIVE' as const,
              isApproved: false,
              rejectionReason: _reason,
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }))
  },

  updateRegistration: (id, updates) =>
    set((s) => ({
      registrations: s.registrations.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    })),
}))

/** Map the raw API member response to the AlumniRegistration shape used by the UI */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMemberToRegistration(m: any): AlumniRegistration {
  const isPending = m.membershipStatus === 'PENDING'
  const isActive = m.membershipStatus === 'ACTIVE'
  return {
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    mobileNumber: m.mobileNumber ?? '',
    altPhoneNumber: m.altPhoneNumber ?? '',
    gender: m.gender ?? 'OTHER',
    dateOfBirth: m.dateOfBirth ?? '',
    maritalStatus: m.maritalStatus ?? 'SINGLE',
    residentialAddress: m.residentialAddress ?? '',
    city: m.city ?? '',
    region: m.region ?? '',
    country: m.country ?? 'Ghana',
    yearGroup: m.yearGroup ?? 0,
    programme: m.programme ?? 'GENERAL_ARTS',
    house: m.house ?? 'ACKAH',
    employmentType: m.employmentType ?? 'UNEMPLOYED',
    occupation: m.occupation ?? '',
    organization: m.organization ?? '',
    areaOfExpertise: m.areaOfExpertise ?? [],
    emergencyContactNumber: m.emergencyContactNumber ?? '',
    emergencyRelationship: m.emergencyRelationship ?? '',
    nextOfKinName: m.nextOfKinName ?? '',
    nextOfKinContact: m.nextOfKinContact ?? '',
    nextOfKinRelationship: m.nextOfKinRelationship ?? '',
    isWhatsAppMember: m.isWhatsAppMember ?? false,
    willingToVolunteer: m.willingToVolunteer ?? 'NO',
    preferredContributions: m.preferredContributions ?? [],
    isAvailableAsMentor: m.isAvailableAsMentor ?? false,
    mentorBio: m.mentorBio ?? '',
    photoUrl: m.photoUrl ?? null,
    membershipStatus: m.membershipStatus ?? 'PENDING',
    isVerified: m.isVerified ?? false,
    isApproved: m.isApproved ?? false,
    consentGiven: m.consentGiven ?? false,
    status: isActive || m.isApproved ? 'approved' : isPending ? 'pending' : 'rejected',
    submittedAt: m.createdAt ?? new Date().toISOString(),
    reviewedAt: m.approvedAt ?? '',
    reviewedBy: '',
    rejectionReason: '',
    approvedAt: m.approvedAt ?? '',
    createdAt: m.createdAt ?? new Date().toISOString(),
    updatedAt: m.updatedAt ?? new Date().toISOString(),
  }
}
