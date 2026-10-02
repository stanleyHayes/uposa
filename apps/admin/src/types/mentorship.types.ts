export type MentorshipStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED'

export interface MentorshipMember {
  id: string
  fullName: string
  email?: string
  photoUrl?: string | null
  occupation?: string | null
}

/** Request as returned by /mentorship/admin/requests (mentor/mentee attached server-side). */
export interface MentorshipRequest {
  id: string
  mentorId: string
  menteeId: string
  status: MentorshipStatus
  message?: string | null
  mentorResponse?: string | null
  createdAt: string
  updatedAt: string
  mentor: MentorshipMember | null
  mentee: MentorshipMember | null
}

/** Mentor as returned by /mentorship/admin/mentors. */
export interface Mentor {
  id: string
  fullName: string
  email?: string
  photoUrl?: string | null
  occupation?: string | null
  organization?: string | null
  areaOfExpertise?: string[]
  mentorBio?: string | null
  yearGroup?: number | null
  _count?: { mentorRequests: number }
}
