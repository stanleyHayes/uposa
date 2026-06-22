import { BouncingDots } from "../../components/ui/BouncingDots";
import { useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Sparkles,
  Upload,
  User,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
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

const regions = ['Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North']
const cities = ['Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Tamale', 'Sunyani', 'Ho', 'Koforidua', 'Bolgatanga', 'Wa', 'Techiman', 'Obuasi', 'Tema', 'Winneba', 'Other']
const programmes = ['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE']
const houses = ['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA']
const employmentTypes = ['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER']
const maritalStatuses = ['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']

const inputCls = 'input input-bordered h-12 w-full border-primary/10 bg-base-100 px-4 text-base-content shadow-none transition-colors placeholder:text-base-content/35 focus:border-primary focus:bg-base-100 focus:outline-none'
const selectCls = 'select select-bordered h-12 w-full border-primary/10 bg-base-100 text-base-content shadow-none transition-colors focus:border-primary focus:bg-base-100 focus:outline-none'
const textareaCls = 'textarea textarea-bordered min-h-32 w-full border-primary/10 bg-base-100 text-base-content shadow-none transition-colors placeholder:text-base-content/35 focus:border-primary focus:bg-base-100 focus:outline-none'
const labelCls = 'text-xs font-bold uppercase tracking-[0.14em] text-base-content/50'

type TabKey = 'personal' | 'academic' | 'professional' | 'emergency'

const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon; helper: string }> = [
  { key: 'personal', label: 'Personal', icon: User, helper: 'Identity and contact' },
  { key: 'academic', label: 'Academic', icon: GraduationCap, helper: 'Year group record' },
  { key: 'professional', label: 'Professional', icon: Briefcase, helper: 'Work and mentorship' },
  { key: 'emergency', label: 'Emergency', icon: Phone, helper: 'Trusted contacts' },
]

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="form-control">
      <span className="label pb-2">
        <span className={labelCls}>{label}</span>
      </span>
      {children}
      {error && <span className="mt-2 text-xs font-semibold text-error">{error}</span>}
    </label>
  )
}

function ProfileFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border border-primary-content/10 bg-primary-content/[0.06] p-3 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 shrink-0 place-items-center bg-secondary text-primary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</span>
        <span className="mt-1 block truncate text-sm font-bold text-primary-content">{value}</span>
      </span>
    </div>
  )
}

function StatusRailItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[12px_3px_12px_3px] ${complete ? 'bg-success/12 text-success' : 'bg-base-300/45 text-base-content/34'}`}>
        {complete ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      </span>
      <span className="text-sm font-semibold text-base-content/72">{label}</span>
    </div>
  )
}

function SectionTitle({ icon: Icon, eyebrow, title }: { icon: LucideIcon; eyebrow: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</span>
        <span className="mt-1 block text-lg font-bold leading-tight text-base-content">{title}</span>
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<TabKey>('personal')
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
      region: user?.region || '',
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

  const profileChecks = [
    { label: 'Identity', complete: Boolean(user?.fullName && user?.email) },
    { label: 'Contact', complete: Boolean(user?.mobileNumber && user?.city) },
    { label: 'Academic', complete: Boolean(user?.yearGroup && user?.programme && user?.house) },
    { label: 'Work', complete: Boolean(user?.occupation || user?.organization) },
    { label: 'Emergency', complete: Boolean(user?.emergencyContactNumber || user?.nextOfKinContact) },
  ]
  const completion = Math.round((profileChecks.filter((item) => item.complete).length / profileChecks.length) * 100)
  const location = [user?.city, user?.country].filter(Boolean).join(', ') || 'Location pending'
  const workLabel = user?.occupation
    ? `${user.occupation}${user.organization ? ` at ${user.organization}` : ''}`
    : 'Professional details pending'

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

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]"
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:p-8">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative w-fit">
                  <Avatar src={user?.photoUrl} name={user?.fullName || 'UPOSA Member'} size="xl" className="ring-4 ring-primary-content/12" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center bg-secondary text-primary shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 rounded-[14px_3px_14px_3px]"
                    aria-label="Upload profile photo"
                  >
                    {uploading ? <BouncingDots /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
                </div>

                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    Member profile
                  </div>
                  <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{user?.fullName || 'UPOSA Member'}</h1>
                  <p className="mt-3 flex max-w-2xl items-center gap-2 text-sm leading-relaxed text-primary-content/62 sm:text-base">
                    <Mail className="h-4 w-4 shrink-0 text-secondary" />
                    <span className="min-w-0 truncate">{user?.email || 'Email pending'}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge status={user?.membershipStatus || 'PENDING'} className="border-primary-content/15 bg-primary-content/12 text-primary-content" />
                    {user?.isAvailableAsMentor && (
                      <span className="inline-flex items-center gap-1.5 border border-secondary/30 bg-secondary/15 px-3 py-1.5 text-xs font-bold text-secondary">
                        <HeartHandshake className="h-3.5 w-3.5" />
                        Mentor
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 border border-primary-content/15 bg-primary-content/10 px-3 py-1.5 text-xs font-bold text-primary-content/70 transition-colors hover:bg-primary-content/15 disabled:opacity-60 sm:hidden"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? 'Uploading' : 'Photo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <ProfileFact icon={GraduationCap} label="Year group" value={user?.yearGroup ? `Class of ${user.yearGroup}` : 'Pending'} />
                <ProfileFact icon={Shield} label="House" value={user?.house ? `${formatEnum(user.house)} House` : 'Not set'} />
                <ProfileFact icon={MapPin} label="Location" value={location} />
              </div>
            </div>

            <aside className="flex flex-col justify-between gap-5 border border-primary-content/10 bg-primary-content/[0.06] p-5 rounded-[22px_4px_22px_4px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Profile strength</p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-5xl font-bold leading-none text-primary-content">{completion}%</p>
                    <p className="mt-2 text-sm leading-relaxed text-primary-content/55">Your record is checked against the details that help alumni find, verify, and support you.</p>
                  </div>
                  <BadgeCheck className="h-12 w-12 shrink-0 text-secondary" />
                </div>
                <div className="mt-5 h-2 overflow-hidden bg-primary-content/12">
                  <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${completion}%` }} />
                </div>
              </div>
              <div className="grid gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/42">Current work</p>
                <p className="text-sm font-semibold leading-relaxed text-primary-content/78">{workLabel}</p>
                <p className="text-xs text-primary-content/42">
                  Joined {user?.createdAt ? formatDate(user.createdAt, 'MMM yyyy') : 'date pending'}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="relative z-10 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="border border-primary/10 bg-base-100/90 p-5 shadow-[0_12px_34px_rgba(0,27,80,0.07)] rounded-[22px_4px_22px_4px]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Record check</p>
                  <h2 className="mt-1 text-lg font-bold">Profile readiness</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {profileChecks.map((item) => (
                  <StatusRailItem key={item.label} complete={item.complete} label={item.label} />
                ))}
              </div>
            </div>

            <div className="grid gap-2 rounded-[22px_4px_22px_4px] border border-primary/10 bg-base-100/80 p-3 shadow-[0_12px_34px_rgba(0,27,80,0.05)]">
              {tabs.map((item) => {
                const isActive = tab === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`group flex w-full items-center gap-3 p-3 text-left transition-all rounded-[18px_3px_18px_3px] ${
                      isActive ? 'bg-primary text-primary-content shadow-[0_14px_30px_rgba(0,27,80,0.14)]' : 'text-base-content/70 hover:bg-base-200/70 hover:text-primary'
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px_3px_14px_3px] ${isActive ? 'bg-secondary text-primary' : 'bg-primary/8 text-primary'}`}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className={`mt-0.5 block truncate text-xs ${isActive ? 'text-primary-content/55' : 'text-base-content/45'}`}>{item.helper}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <form onSubmit={handleSubmit(onSubmit)} className="min-w-0">
            <div className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[24px_4px_24px_4px]">
              <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
              <div className="p-5 sm:p-6 lg:p-7">
                {tab === 'personal' && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <SectionTitle icon={User} eyebrow="Identity" title="Personal and contact details" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full name" error={errors.fullName?.message?.toString()}>
                        <input type="text" className={`${inputCls} ${errors.fullName ? 'input-error' : ''}`} {...register('fullName')} />
                      </Field>
                      <Field label="Gender">
                        <select className={selectCls} {...register('gender')}>
                          <option value="">Select</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </Field>
                      <Field label="Date of birth">
                        <input type="date" className={inputCls} {...register('dateOfBirth')} />
                      </Field>
                      <Field label="Marital status">
                        <select className={selectCls} {...register('maritalStatus')}>
                          <option value="">Select</option>
                          {maritalStatuses.map((status) => (
                            <option key={status} value={status}>{formatEnum(status)}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Mobile number">
                        <input type="tel" className={inputCls} {...register('mobileNumber')} />
                      </Field>
                      <Field label="Alternative phone">
                        <input type="tel" className={inputCls} {...register('altPhoneNumber')} />
                      </Field>
                    </div>
                    <Field label="Residential address">
                      <input type="text" className={inputCls} {...register('residentialAddress')} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Region">
                        <select className={selectCls} {...register('region')}>
                          <option value="">Select region</option>
                          {regions.map((region) => (
                            <option key={region}>{region}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="City">
                        <select className={selectCls} {...register('city')}>
                          <option value="">Select city</option>
                          {cities.map((city) => (
                            <option key={city}>{city}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Country">
                        <input type="text" className={inputCls} {...register('country')} />
                      </Field>
                    </div>
                  </motion.div>
                )}

                {tab === 'academic' && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <SectionTitle icon={GraduationCap} eyebrow="UPOSA record" title="School history" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Year group">
                        <select className={selectCls} {...register('yearGroup')}>
                          <option value="">Select year</option>
                          {Array.from({ length: new Date().getFullYear() - 1980 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Programme">
                        <select className={selectCls} {...register('programme')}>
                          <option value="">Select</option>
                          {programmes.map((programme) => (
                            <option key={programme} value={programme}>{formatEnum(programme)}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="House">
                        <select className={selectCls} {...register('house')}>
                          <option value="">Select</option>
                          {houses.map((house) => (
                            <option key={house} value={house}>{formatEnum(house)}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="border border-primary/8 bg-base-200/40 p-4 rounded-[18px_4px_18px_4px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-base-content/42">Directory label</p>
                        <p className="mt-2 text-lg font-bold text-primary">{user?.yearGroup ? `Class of ${user.yearGroup}` : 'Not set'}</p>
                      </div>
                      <div className="border border-primary/8 bg-base-200/40 p-4 rounded-[18px_4px_18px_4px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-base-content/42">Programme</p>
                        <p className="mt-2 text-lg font-bold text-primary">{user?.programme ? formatEnum(user.programme) : 'Not set'}</p>
                      </div>
                      <div className="border border-primary/8 bg-base-200/40 p-4 rounded-[18px_4px_18px_4px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-base-content/42">House network</p>
                        <p className="mt-2 text-lg font-bold text-primary">{user?.house ? formatEnum(user.house) : 'Not set'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === 'professional' && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <SectionTitle icon={Briefcase} eyebrow="Work profile" title="Professional and mentorship details" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Employment type">
                        <select className={selectCls} {...register('employmentType')}>
                          <option value="">Select</option>
                          {employmentTypes.map((type) => (
                            <option key={type} value={type}>{formatEnum(type)}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Occupation">
                        <input type="text" className={inputCls} {...register('occupation')} />
                      </Field>
                      <Field label="Organization">
                        <input type="text" className={inputCls} {...register('organization')} />
                      </Field>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                      <label className="flex h-full cursor-pointer items-start gap-4 border border-primary/10 bg-base-200/45 p-4 transition-colors hover:border-primary/18 hover:bg-base-200/70 rounded-[20px_4px_20px_4px]">
                        <input type="checkbox" className="checkbox checkbox-primary checkbox-sm mt-1" {...register('isAvailableAsMentor')} />
                        <span>
                          <span className="flex items-center gap-2 font-bold text-base-content">
                            <HeartHandshake className="h-4 w-4 text-primary" />
                            Available as a mentor
                          </span>
                          <span className="mt-2 block text-sm leading-relaxed text-base-content/58">Show alumni that you are open to career, school, and life guidance requests.</span>
                        </span>
                      </label>
                      <Field label="Mentor bio">
                        <textarea className={textareaCls} placeholder="Share your focus areas, experience, and the kind of guidance you can offer." {...register('mentorBio')} />
                      </Field>
                    </div>
                    <div className="flex items-center gap-3 border border-secondary/25 bg-secondary/10 p-4 text-sm font-semibold leading-relaxed text-primary rounded-[18px_4px_18px_4px]">
                      <Building2 className="h-5 w-5 shrink-0" />
                      {workLabel}
                    </div>
                  </motion.div>
                )}

                {tab === 'emergency' && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <SectionTitle icon={Phone} eyebrow="Safety net" title="Emergency and next of kin" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Emergency contact">
                        <input type="tel" className={inputCls} {...register('emergencyContactNumber')} />
                      </Field>
                      <Field label="Emergency relationship">
                        <input type="text" className={inputCls} {...register('emergencyRelationship')} />
                      </Field>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-primary/12 to-transparent" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Next of kin name">
                        <input type="text" className={inputCls} {...register('nextOfKinName')} />
                      </Field>
                      <Field label="Next of kin contact">
                        <input type="tel" className={inputCls} {...register('nextOfKinContact')} />
                      </Field>
                      <Field label="Next of kin relationship">
                        <input type="text" className={inputCls} {...register('nextOfKinRelationship')} />
                      </Field>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-primary/8 bg-base-200/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-7">
                <div className="flex items-center gap-2 text-sm font-semibold text-base-content/55">
                  {isDirty ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Unsaved changes
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Profile is in sync
                    </>
                  )}
                </div>
                <button type="submit" className="btn btn-primary min-h-12 gap-2 px-6" disabled={loading || !isDirty}>
                  {loading ? (
                    <span className="h-4 w-20 animate-pulse bg-primary-content/35" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </PageTransition>
  )
}
