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
