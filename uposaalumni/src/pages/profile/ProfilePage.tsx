import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Save, User, Briefcase, GraduationCap, Phone } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuthStore } from '../../stores/auth.store'
import { membersApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatEnum } from '../../utils/formatters'

const schema = z.object({
  fullName: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']).optional().or(z.literal('')),
  mobileNumber: z.string().optional(),
  altPhoneNumber: z.string().optional(),
  residentialAddress: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  yearGroup: z.string().optional().transform((v) => v ? Number(v) : undefined),
  programme: z.enum(['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE']).optional().or(z.literal('')),
  house: z.enum(['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA']).optional().or(z.literal('')),
  employmentType: z.enum(['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER']).optional().or(z.literal('')),
  occupation: z.string().optional(),
  organization: z.string().optional(),
  isAvailableAsMentor: z.boolean().optional(),
  mentorBio: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinContact: z.string().optional(),
  nextOfKinRelationship: z.string().optional(),
})

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'personal' | 'academic' | 'professional' | 'emergency'>('personal')
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      fullName: user?.fullName || '',
      gender: user?.gender || '',
      dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
      maritalStatus: user?.maritalStatus || '',
      mobileNumber: user?.mobileNumber || '',
      altPhoneNumber: user?.altPhoneNumber || '',
      residentialAddress: user?.residentialAddress || '',
      city: user?.city || '',
      country: user?.country || '',
      yearGroup: user?.yearGroup?.toString() || '',
      programme: user?.programme || '',
      house: user?.house || '',
      employmentType: user?.employmentType || '',
      occupation: user?.occupation || '',
      organization: user?.organization || '',
      isAvailableAsMentor: user?.isAvailableAsMentor || false,
      mentorBio: user?.mentorBio || '',
      emergencyContactNumber: user?.emergencyContactNumber || '',
      emergencyRelationship: user?.emergencyRelationship || '',
      nextOfKinName: user?.nextOfKinName || '',
      nextOfKinContact: user?.nextOfKinContact || '',
      nextOfKinRelationship: user?.nextOfKinRelationship || '',
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
      )
      const res = await membersApi.updateProfile(cleaned)
      if (res.data.data) updateUser(res.data.data)
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('photo', file)
    try {
      const res = await membersApi.uploadPhoto(formData)
      if (res.data.data?.photoUrl) updateUser({ photoUrl: res.data.data.photoUrl })
      toast.success('Photo updated!')
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  const tabs = [
    { key: 'personal' as const, label: 'Personal', icon: User },
    { key: 'academic' as const, label: 'Academic', icon: GraduationCap },
    { key: 'professional' as const, label: 'Professional', icon: Briefcase },
    { key: 'emergency' as const, label: 'Emergency', icon: Phone },
  ]

  return (
    <PageTransition>
      <PageHeader title="My Profile" description="Manage your personal information" />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-72 shrink-0">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body items-center text-center">
              <div className="relative">
                <Avatar src={user?.photoUrl} name={user?.fullName || 'User'} size="xl" />
                <button
                  className="absolute bottom-0 right-0 btn btn-circle btn-sm btn-primary"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="w-3 h-3" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <h3 className="font-bold text-lg mt-3">{user?.fullName}</h3>
              <p className="text-sm text-base-content/60">{user?.email}</p>
              <StatusBadge status={user?.membershipStatus || 'PENDING'} />
              <div className="divider" />
              <div className="text-sm space-y-2 w-full text-left">
                {user?.yearGroup && <div className="flex justify-between"><span className="text-base-content/60">Year Group</span><span className="font-medium">{user.yearGroup}</span></div>}
                {user?.programme && <div className="flex justify-between"><span className="text-base-content/60">Programme</span><span className="font-medium">{formatEnum(user.programme)}</span></div>}
                {user?.house && <div className="flex justify-between"><span className="text-base-content/60">House</span><span className="font-medium">{formatEnum(user.house)}</span></div>}
                <div className="flex justify-between"><span className="text-base-content/60">Member Since</span><span className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body">
              <div role="tablist" className="tabs tabs-bordered mb-6">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    className={`tab gap-2 ${tab === t.key ? 'tab-active' : ''}`}
                    onClick={() => setTab(t.key)}
                  >
                    <t.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {tab === 'personal' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Full Name</span></label>
                        <input type="text" className={`input input-bordered ${errors.fullName ? 'input-error' : ''}`} {...register('fullName')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Gender</span></label>
                        <select className="select select-bordered" {...register('gender')}>
                          <option value="">Select</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Date of Birth</span></label>
                        <input type="date" className="input input-bordered" {...register('dateOfBirth')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Marital Status</span></label>
                        <select className="select select-bordered" {...register('maritalStatus')}>
                          <option value="">Select</option>
                          {['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED'].map((s) => (
                            <option key={s} value={s}>{formatEnum(s)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Mobile Number</span></label>
                        <input type="tel" className="input input-bordered" {...register('mobileNumber')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Alt Phone</span></label>
                        <input type="tel" className="input input-bordered" {...register('altPhoneNumber')} />
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Residential Address</span></label>
                      <input type="text" className="input input-bordered" {...register('residentialAddress')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">City</span></label>
                        <input type="text" className="input input-bordered" {...register('city')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Country</span></label>
                        <input type="text" className="input input-bordered" {...register('country')} />
                      </div>
                    </div>
                  </>
                )}

                {tab === 'academic' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Year Group</span></label>
                      <input type="number" className="input input-bordered" {...register('yearGroup')} />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Programme</span></label>
                      <select className="select select-bordered" {...register('programme')}>
                        <option value="">Select</option>
                        {['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE'].map((p) => (
                          <option key={p} value={p}>{formatEnum(p)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">House</span></label>
                      <select className="select select-bordered" {...register('house')}>
                        <option value="">Select</option>
                        {['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA'].map((h) => (
                          <option key={h} value={h}>{formatEnum(h)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {tab === 'professional' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Employment Type</span></label>
                        <select className="select select-bordered" {...register('employmentType')}>
                          <option value="">Select</option>
                          {['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER'].map((e) => (
                            <option key={e} value={e}>{formatEnum(e)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Occupation</span></label>
                        <input type="text" className="input input-bordered" {...register('occupation')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Organization</span></label>
                        <input type="text" className="input input-bordered" {...register('organization')} />
                      </div>
                    </div>
                    <div className="divider">Mentorship</div>
                    <div className="form-control">
                      <label className="cursor-pointer label justify-start gap-3">
                        <input type="checkbox" className="checkbox checkbox-primary" {...register('isAvailableAsMentor')} />
                        <span className="label-text">I'm available as a mentor</span>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Mentor Bio</span></label>
                      <textarea className="textarea textarea-bordered h-24" placeholder="Tell mentees about your expertise..." {...register('mentorBio')} />
                    </div>
                  </>
                )}

                {tab === 'emergency' && (
                  <>
                    <h3 className="font-semibold">Emergency Contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Contact Number</span></label>
                        <input type="tel" className="input input-bordered" {...register('emergencyContactNumber')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Relationship</span></label>
                        <input type="text" className="input input-bordered" {...register('emergencyRelationship')} />
                      </div>
                    </div>
                    <div className="divider">Next of Kin</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Name</span></label>
                        <input type="text" className="input input-bordered" {...register('nextOfKinName')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Contact</span></label>
                        <input type="tel" className="input input-bordered" {...register('nextOfKinContact')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Relationship</span></label>
                        <input type="text" className="input input-bordered" {...register('nextOfKinRelationship')} />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-4">
                  <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading || !isDirty}>
                    {!loading && <Save className="w-4 h-4" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
