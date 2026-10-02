export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VOLUNTEER' | 'INTERNSHIP'
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED'

export interface JobApplication {
  id: string
  jobId: string
  applicantName: string
  applicantEmail: string
  coverLetter: string
  resumeUrl: string
  status: ApplicationStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  title: string
  description: string
  company: string
  location: string
  jobType: JobType
  contactEmail: string
  externalUrl: string
  postedByName: string
  isApproved: boolean
  expiresAt: string
  applications: JobApplication[]
  createdAt: string
  updatedAt: string
}

/** Job as returned by the admin jobs API (/jobs/admin/all). */
export interface ApiJob {
  id: string
  title: string
  description: string
  company: string
  location?: string | null
  jobType: JobType
  contactEmail?: string | null
  externalUrl?: string | null
  postedBy?: { id: string; fullName: string; email?: string } | null
  isApproved: boolean
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}

/** Application as returned by /jobs/admin/:id/applications. */
export interface ApiJobApplication {
  id: string
  status: ApplicationStatus
  createdAt: string
  applicant?: { id: string; fullName: string; email?: string } | null
}
