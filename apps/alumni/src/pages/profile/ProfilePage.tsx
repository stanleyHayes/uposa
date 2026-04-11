import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Save, User, Briefcase, GraduationCap, Phone, Upload, Mail, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuthStore } from '../../stores/auth.store'
import { membersApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { formatEnum } from '../../utils/formatters'

const schema = z.object({
  fullName: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']).optional().or(z.literal('')),
  mobileNumber: z.string().optional(),
  altPhoneNumber: z.string().optional(),
  residentialAddress: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
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

const inputCls = 'input input-bordered w-full bg-base-200/30 border-base-300 focus:border-primary focus:bg-base-100 transition-colors'
const selectCls = 'select select-bordered w-full bg-base-200/30 border-base-300 focus:border-primary focus:bg-base-100 transition-colors'
const labelCls = 'label-text font-medium text-sm'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'personal' | 'academic' | 'professional' | 'emergency'>('personal')
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      region: (user as any)?.region || '',
      country: user?.country || 'Ghana',
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
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('photo', file)
    try {
      const res = await membersApi.uploadPhoto(formData)
      if (res.data.data?.photoUrl) {
        updateUser({ photoUrl: res.data.data.photoUrl })
        toast.success('Photo updated!')
      }
    } catch {
      toast.error('Failed to upload photo. Check that Cloudinary is configured.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
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
      <PageHeader title="My Profile" description="Manage your alumni profile" />

      {/* Profile header card */}
      <div className="bg-gradient-to-r from-primary via-primary/95 to-accent rounded-2xl p-6 mb-6 text-primary-content relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          {/* Photo upload */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-primary-content/20 shadow-lg">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-content/10 flex items-center justify-center">
                  <User size={32} className="text-primary-content/40" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              {uploading ? (
                <span className="loading loading-spinner loading-sm text-white" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold">{user?.fullName}</h2>
            <p className="text-primary-content/60 text-sm flex items-center gap-1.5 justify-center sm:justify-start mt-1">
              <Mail size={13} /> {user?.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
              <StatusBadge status={user?.membershipStatus || 'PENDING'} />
              {user?.yearGroup && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-content/15 text-primary-content/80">
                  <GraduationCap size={12} /> Class of {user.yearGroup}
                </span>
              )}
              {user?.house && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-content/15 text-primary-content/80">
                  <Shield size={12} /> {formatEnum(user.house)}
                </span>
              )}
            </div>
          </div>

          {/* Upload button (mobile fallback) */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn btn-sm bg-primary-content/15 border-primary-content/20 text-primary-content hover:bg-primary-content/25 gap-1.5 sm:hidden"
          >
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-base-100 rounded-2xl border border-base-300/60 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-base-300/50 px-4">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((t) => {
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                    isActive ? 'border-primary text-primary' : 'border-transparent text-base-content/50 hover:text-base-content/80'
                  }`}
                >
                  <t.icon size={15} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {tab === 'personal' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Full Name *</span></label>
                  <input type="text" className={`${inputCls} ${errors.fullName ? 'input-error' : ''}`} {...register('fullName')} />
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Gender</span></label>
                  <select className={selectCls} {...register('gender')}>
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Date of Birth</span></label>
                  <input type="date" className={inputCls} {...register('dateOfBirth')} />
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Marital Status</span></label>
                  <select className={selectCls} {...register('maritalStatus')}>
                    <option value="">Select</option>
                    {['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED'].map((s) => (
                      <option key={s} value={s}>{formatEnum(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Mobile Number</span></label>
                  <input type="tel" className={inputCls} {...register('mobileNumber')} />
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Alt Phone</span></label>
                  <input type="tel" className={inputCls} {...register('altPhoneNumber')} />
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span className={labelCls}>Residential Address</span></label>
                <input type="text" className={inputCls} {...register('residentialAddress')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Region</span></label>
                  <select className={selectCls} {...register('region')}>
                    <option value="">Select region</option>
                    {['Ahafo','Ashanti','Bono','Bono East','Central','Eastern','Greater Accra','North East','Northern','Oti','Savannah','Upper East','Upper West','Volta','Western','Western North'].map(r => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>City</span></label>
                  <select className={selectCls} {...register('city')}>
                    <option value="">Select city</option>
                    {['Accra','Kumasi','Cape Coast','Takoradi','Tamale','Sunyani','Ho','Koforidua','Bolgatanga','Wa','Techiman','Obuasi','Tema','Winneba','Other'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Country</span></label>
                  <input type="text" className={inputCls} {...register('country')} />
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'academic' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label"><span className={labelCls}>Year Group</span></label>
                <select className={selectCls} {...register('yearGroup')}>
                  <option value="">Select year</option>
                  {Array.from({ length: new Date().getFullYear() - 1980 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className={labelCls}>Programme</span></label>
                <select className={selectCls} {...register('programme')}>
                  <option value="">Select</option>
                  {['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE'].map((p) => (
                    <option key={p} value={p}>{formatEnum(p)}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className={labelCls}>House</span></label>
                <select className={selectCls} {...register('house')}>
                  <option value="">Select</option>
                  {['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA'].map((h) => (
                    <option key={h} value={h}>{formatEnum(h)}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {tab === 'professional' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Employment Type</span></label>
                  <select className={selectCls} {...register('employmentType')}>
                    <option value="">Select</option>
                    {['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER'].map((e) => (
                      <option key={e} value={e}>{formatEnum(e)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Occupation</span></label>
                  <input type="text" className={inputCls} {...register('occupation')} />
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Organization</span></label>
                  <input type="text" className={inputCls} {...register('organization')} />
                </div>
              </div>
              <div className="border-t border-base-300/50 pt-4 mt-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><User size={14} className="text-primary" /> Mentorship</h3>
                <label className="cursor-pointer flex items-center gap-3 p-3 rounded-xl bg-base-200/30 border border-base-300/50 hover:bg-base-200/50 transition-colors mb-3">
                  <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" {...register('isAvailableAsMentor')} />
                  <span className="text-sm font-medium">I'm available as a mentor</span>
                </label>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Mentor Bio</span></label>
                  <textarea className="textarea textarea-bordered h-24 bg-base-200/30 border-base-300" placeholder="Tell mentees about your expertise..." {...register('mentorBio')} />
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'emergency' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Phone size={14} className="text-primary" /> Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Contact Number</span></label>
                  <input type="tel" className={inputCls} {...register('emergencyContactNumber')} />
                </div>
                <div className="form-control">
                  <label className="label"><span className={labelCls}>Relationship</span></label>
                  <input type="text" className={inputCls} {...register('emergencyRelationship')} />
                </div>
              </div>
              <div className="border-t border-base-300/50 pt-4 mt-2">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><User size={14} className="text-primary" /> Next of Kin</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label"><span className={labelCls}>Name</span></label>
                    <input type="text" className={inputCls} {...register('nextOfKinName')} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className={labelCls}>Contact</span></label>
                    <input type="tel" className={inputCls} {...register('nextOfKinContact')} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className={labelCls}>Relationship</span></label>
                    <input type="text" className={inputCls} {...register('nextOfKinRelationship')} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-end pt-6 mt-4 border-t border-base-300/50">
            <button type="submit" className={`btn btn-primary gap-2 ${loading ? 'loading' : ''}`} disabled={loading || !isDirty}>
              {!loading && <Save size={16} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
