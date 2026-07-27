import { BouncingDots } from "../../components/ui/BouncingDots";
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  HeartPulse,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Briefcase,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import SEO from '../../components/common/SEO'
import DatePicker from '../../components/ui/DatePicker'
import SearchableSelect from '../../components/ui/SearchableSelect'
import { cityOptions, countryOptions, stateOptions } from '../../lib/locations'

const EXPERTISE_OPTIONS = [
  'Education & Teaching', 'Healthcare & Medical Services', 'Engineering & Technical Fields',
  'Information Technology (IT)', 'Business & Entrepreneurship', 'Finance, Banking & Accounting',
  'Law & Legal Services', 'Public Service & Government', 'Security, Military & Law Enforcement',
  'Media, Communications & Creative Arts', 'Agriculture & Environmental Services',
  'Construction & Skilled Trades', 'Sales, Marketing & Customer Relations',
  'Human Resources & Administration', 'Research & Academia',
  'Non-Profit & Community Development', 'Religious & Ministry Work',
  'Student (Further Studies)', 'Retired', 'Not Currently Employed', 'Other',
]

const CONTRIBUTION_OPTIONS = [
  'Education & Mentorship', 'Fundraising & Projects', 'Welfare',
  'Events & Reunions', 'Media & Communications', 'Other',
]

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  mobileNumber: z.string().min(5, 'Mobile number is required'),
  altPhoneNumber: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  residentialAddress: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  yearGroup: z.string().optional().transform((v) => v ? Number(v) : undefined),
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
  consentGiven: z.literal(true, { message: 'You must consent to proceed' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const TOTAL_STEPS = 6

const stepInfo = [
  { icon: User, label: 'Personal', title: 'Personal Information', desc: 'Your basic details and account credentials' },
  { icon: Phone, label: 'Contact', title: 'Contact Details', desc: 'How we can reach you' },
  { icon: GraduationCap, label: 'Academic', title: 'Academic Background', desc: 'Your time at University Practice' },
  { icon: Briefcase, label: 'Professional', title: 'Professional Info', desc: 'Your career and expertise' },
  { icon: HeartPulse, label: 'Emergency', title: 'Emergency & Engagement', desc: 'Emergency contacts and involvement' },
  { icon: ShieldCheck, label: 'Consent', title: 'Consent & Declaration', desc: 'Review and confirm your registration' },
]

const stepFields: Record<number, string[]> = {
  1: ['fullName', 'email', 'password', 'confirmPassword'],
  2: ['mobileNumber'],
  3: [],
  4: [],
  5: [],
  6: [],
}

const registerStats = [
  { label: 'Profile steps', value: '06' },
  { label: 'Member record', value: '360' },
  { label: 'School link', value: 'UP' },
]

const registerNotes = [
  { icon: BadgeCheck, label: 'Verified alumni profile' },
  { icon: BookOpen, label: 'Academic and year-group record' },
  { icon: Clock3, label: 'Takes a few focused minutes' },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const toast = useToast()

  const { register, handleSubmit, control, formState: { errors }, trigger, watch, setValue, getValues } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      areaOfExpertise: [],
      preferredContributions: [],
      isWhatsAppMember: false,
      country: 'Ghana',
    },
  })

  const nextStep = async () => {
    const fields = stepFields[step] || []
    if (fields.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valid = await trigger(fields as any)
      if (!valid) return
    }
    setStep(step + 1)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && key !== 'confirmPassword') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, String(value))
          }
        }
      })
      await authApi.register(formData)
      toast.success('Registration successful! Please check your email to verify your account.')
      navigate('/login')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const toggleArrayField = (field: 'areaOfExpertise' | 'preferredContributions', value: string) => {
    const current = getValues(field) || []
    if (current.includes(value)) {
      setValue(field, current.filter((v: string) => v !== value))
    } else {
      setValue(field, [...current, value])
    }
  }

  const watchExpertise = watch('areaOfExpertise') || []
  const watchContributions = watch('preferredContributions') || []
  const watchCountry = watch('country') || ''
  const watchRegion = watch('region') || ''

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
  }

  const StepIcon = stepInfo[step - 1].icon

  const inputCls = (hasError?: boolean) =>
    `input input-bordered h-12 w-full border-base-300 bg-base-200/45 text-base-content transition-colors focus:border-primary focus:bg-base-100 ${hasError ? 'input-error' : ''}`
  const selectCls = 'select select-bordered h-12 w-full border-base-300 bg-base-200/45 text-base-content transition-colors focus:border-primary focus:bg-base-100'

  return (
    <>
      <SEO title="Register" description="Create your UPOSA alumni account to join the University Practice Old Students' Association network." />
      <div className="min-h-screen bg-base-100 text-base-content">
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,0.9fr)]">
          <section className="relative flex min-h-[48vh] overflow-hidden bg-primary px-5 py-8 text-primary-content sm:px-8 lg:min-h-screen lg:px-12 lg:py-10">
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 top-12 h-72 w-72 object-contain opacity-[0.035] sm:h-96 sm:w-96 lg:-left-24 lg:top-20"
            />
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 object-contain opacity-[0.045] sm:h-[30rem] sm:w-[30rem] lg:-right-20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent"
            />

            <div className="relative z-10 flex w-full flex-col justify-between gap-10">
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center bg-base-100 p-1.5 shadow-lg shadow-black/10">
                    <img src="/logo.png" alt="UPOSA" className="h-full w-full object-contain" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold leading-tight">UPOSA Alumni</span>
                    <span className="block text-xs text-primary-content/55">The Legit Elites</span>
                  </span>
                </Link>
                <span className="hidden border border-primary-content/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-secondary sm:inline-flex">
                  Registration desk
                </span>
              </div>

              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mb-5 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70"
                >
                  <Sparkles className="h-4 w-4 text-secondary" />
                  Join the network
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="max-w-2xl text-4xl font-bold leading-[0.95] sm:text-5xl lg:text-6xl"
                >
                  Create your alumni record with care.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mt-5 max-w-xl text-base leading-relaxed text-primary-content/62 sm:text-lg"
                >
                  Add the details that help UPOSA verify your profile, connect your year group, and keep you close to the school.
                </motion.p>
              </div>

              <div className="space-y-5">
                <div className="grid gap-px overflow-hidden border border-primary-content/10 bg-primary-content/10 sm:grid-cols-3">
                  {registerStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + index * 0.06 }}
                      className="bg-primary/65 px-5 py-4"
                    >
                      <p className="text-2xl font-bold text-secondary">{stat.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-content/45">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid gap-3">
                  {registerNotes.map((note, index) => (
                    <motion.div
                      key={note.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 + index * 0.06 }}
                      className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/[0.06] p-4"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center bg-secondary text-primary">
                        <note.icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold text-primary-content/70">{note.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="relative flex min-h-screen overflow-hidden bg-base-100 px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 top-20 h-80 w-80 object-contain opacity-[0.035]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 mx-auto flex w-full max-w-[680px] flex-col"
            >
              <div className="mb-7 flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-3 lg:hidden">
                  <span className="grid h-11 w-11 place-items-center bg-primary p-1.5">
                    <img src="/logo.png" alt="UPOSA" className="h-full w-full bg-base-100 object-contain" />
                  </span>
                  <div>
                    <span className="block font-bold leading-tight">UPOSA Alumni</span>
                    <span className="text-xs text-base-content/45">Registration desk</span>
                  </div>
                </Link>
                <Link to="/login" className="ml-auto text-sm font-semibold text-base-content/50 transition-colors hover:text-primary">
                  Have an account? <span className="text-primary">Sign in</span>
                </Link>
              </div>

              <div className="mb-5 grid gap-2 sm:grid-cols-6">
                {stepInfo.map((s, i) => {
                  const num = i + 1
                  const done = step > num
                  const active = step === num
                  const SIcon = s.icon
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        if (done || active) setStep(num)
                      }}
                      className={`flex min-h-16 items-center gap-3 border px-3 py-3 text-left transition-colors sm:flex-col sm:items-start ${
                        active
                          ? 'border-primary/20 bg-primary text-primary-content shadow-[0_12px_32px_rgba(0,27,80,0.14)]'
                          : done
                            ? 'border-secondary/35 bg-secondary/15 text-primary'
                            : 'border-primary/8 bg-base-100/75 text-base-content/45'
                      }`}
                      aria-current={active ? 'step' : undefined}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center ${
                        active ? 'bg-secondary text-primary' : done ? 'bg-secondary text-primary' : 'bg-base-200 text-base-content/40'
                      }`}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <SIcon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-[0.14em]">0{num}</span>
                        <span className="block truncate text-sm font-bold leading-tight">{s.label}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="overflow-hidden border border-primary/10 bg-base-100/95 shadow-[0_22px_80px_rgba(0,27,80,0.12)] backdrop-blur rounded-[20px_4px_20px_4px]">
                <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
                <div className="p-6 sm:p-8">
                  <div className="mb-7 flex items-start justify-between gap-6">
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-secondary">
                        Step {step} of {TOTAL_STEPS}
                      </p>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <h1 className="text-2xl font-bold leading-tight text-base-content sm:text-3xl">{stepInfo[step - 1].title}</h1>
                          <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">{stepInfo[step - 1].desc}</p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <motion.span
                      key={step}
                      initial={{ scale: 0.86, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="hidden h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary sm:grid"
                    >
                      <StepIcon className="h-6 w-6" />
                    </motion.span>
                  </div>

                  <div className="mb-7 h-1.5 overflow-hidden bg-base-300/70">
                    <motion.div
                      className="h-full bg-secondary"
                      initial={false}
                      animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait" custom={step}>
                {/* STEP 1: Personal + Account */}
                {step === 1 && (
                  <motion.div key="step1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Full Name *</span></label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                        <input type="text" className={`${inputCls(!!errors.fullName)} pl-11`} placeholder="Kwame Mensah" {...register('fullName')} />
                      </div>
                      {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Gender</span></label>
                        <select className={selectCls} {...register('gender')}>
                          <option value="">Select</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Date of Birth</span></label>
                        <Controller
                          name="dateOfBirth"
                          control={control}
                          render={({ field }) => (
                            <DatePicker label="Date of Birth" value={field.value ?? ''} onChange={field.onChange} className={inputCls()} />
                          )}
                        />
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Marital Status</span></label>
                      <select className={selectCls} {...register('maritalStatus')}>
                        <option value="">Select</option>
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="SEPARATED">Separated</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </select>
                    </div>
                    <div className="border-t border-base-300/50 my-4" />
                    <p className="text-xs font-medium text-base-content/40 uppercase tracking-wider">Account Credentials</p>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Email *</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                        <input type="email" className={`${inputCls(!!errors.email)} pl-11`} placeholder="you@example.com" {...register('email')} />
                      </div>
                      {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Password *</span></label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                          <input type={showPassword ? 'text' : 'password'} className={`${inputCls(!!errors.password)} pl-11 pr-11`} {...register('password')} />
                          <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content transition-colors" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Confirm *</span></label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                          <input type="password" className={`${inputCls(!!errors.confirmPassword)} pl-11`} {...register('confirmPassword')} />
                        </div>
                        {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Contact */}
                {step === 2 && (
                  <motion.div key="step2" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Mobile Number *</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                          <input type="tel" className={`${inputCls(!!errors.mobileNumber)} pl-11`} placeholder="+233 XX XXX XXXX" {...register('mobileNumber')} />
                        </div>
                        {errors.mobileNumber && <p className="text-error text-xs mt-1">{errors.mobileNumber.message}</p>}
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Alt. Phone</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                          <input type="tel" className={`${inputCls()} pl-11`} placeholder="Optional" {...register('altPhoneNumber')} />
                        </div>
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Residential Address</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                        <input type="text" className={`${inputCls()} pl-11`} placeholder="Street address" {...register('residentialAddress')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Country</span></label>
                        <Controller
                          name="country"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelect
                              value={field.value ?? ''}
                              options={countryOptions}
                              placeholder="Select"
                              className={selectCls}
                              onChange={(v) => {
                                field.onChange(v)
                                setValue('region', '')
                                setValue('city', '')
                              }}
                            />
                          )}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Region</span></label>
                        <Controller
                          name="region"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelect
                              value={field.value ?? ''}
                              options={watchCountry ? stateOptions(watchCountry) : []}
                              placeholder="Select"
                              disabled={!watchCountry}
                              className={selectCls}
                              onChange={(v) => {
                                field.onChange(v)
                                setValue('city', '')
                              }}
                            />
                          )}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">City</span></label>
                        <Controller
                          name="city"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelect
                              value={field.value ?? ''}
                              options={watchCountry && watchRegion ? cityOptions(watchCountry, watchRegion) : []}
                              placeholder="Select"
                              disabled={!watchRegion}
                              className={selectCls}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Academic */}
                {step === 3 && (
                  <motion.div key="step3" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Year Group (Year of Completion)</span></label>
                      <select className={selectCls} {...register('yearGroup')}>
                        <option value="">Select year group</option>
                        {Array.from({ length: 2026 - 1981 + 1 }, (_, i) => 2026 - i).map((year) => (
                          <option key={year} value={String(year)}>{year}</option>
                        ))}
                      </select>
                      <p className="text-xs text-base-content/40 mt-1">From 1981 to present</p>
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Programme of Study</span></label>
                      <select className={selectCls} {...register('programme')}>
                        <option value="">Select programme</option>
                        <option value="GENERAL_ARTS">General Arts</option>
                        <option value="BUSINESS">Business</option>
                        <option value="HOME_ECONOMICS">Home Economics</option>
                        <option value="VISUAL_ARTS">Visual Arts</option>
                        <option value="SCIENCE">Science</option>
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">House</span></label>
                      <select className={selectCls} {...register('house')}>
                        <option value="">Select house</option>
                        <option value="ACKAH">Ackah</option>
                        <option value="DENSU">Densu</option>
                        <option value="TANO">Tano</option>
                        <option value="NKRUMAH">Nkrumah</option>
                        <option value="PRA">Pra</option>
                        <option value="VOLTA">Volta</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Professional */}
                {step === 4 && (
                  <motion.div key="step4" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Employment Type</span></label>
                      <select className={selectCls} {...register('employmentType')}>
                        <option value="">Select</option>
                        <option value="RETIRED">Retired</option>
                        <option value="STUDENT">Student</option>
                        <option value="UNEMPLOYED">Unemployed</option>
                        <option value="SELF_EMPLOYED">Self Employed</option>
                        <option value="GOVERNMENT_WORKER">Government Worker</option>
                        <option value="PRIVATE_WORKER">Private Worker</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Occupation</span></label>
                        <input type="text" className={inputCls()} placeholder="e.g. Teacher, Engineer" {...register('occupation')} />
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Organization</span></label>
                        <input type="text" className={inputCls()} placeholder="Place of work" {...register('organization')} />
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Area of Expertise</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-3 border border-base-300 rounded-xl bg-base-200/30">
                        {EXPERTISE_OPTIONS.map((opt) => (
                          <label key={opt} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-base-200 transition-colors">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm"
                              checked={watchExpertise.includes(opt)}
                              onChange={() => toggleArrayField('areaOfExpertise', opt)}
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                      {watchExpertise.length > 0 && (
                        <p className="text-xs text-primary mt-1.5 font-medium">{watchExpertise.length} selected</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Emergency & Engagement */}
                {step === 5 && (
                  <motion.div key="step5" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                    <p className="text-xs font-medium text-base-content/40 uppercase tracking-wider">Emergency Contact</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Contact Number</span></label>
                        <input type="tel" className={inputCls()} {...register('emergencyContactNumber')} />
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Relationship</span></label>
                        <input type="text" className={inputCls()} placeholder="e.g. Spouse, Parent" {...register('emergencyRelationship')} />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-base-content/40 uppercase tracking-wider pt-2">Next of Kin</p>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Full Name</span></label>
                      <input type="text" className={inputCls()} {...register('nextOfKinName')} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Contact Number</span></label>
                        <input type="tel" className={inputCls()} {...register('nextOfKinContact')} />
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Relationship</span></label>
                        <input type="text" className={inputCls()} placeholder="e.g. Brother, Sister" {...register('nextOfKinRelationship')} />
                      </div>
                    </div>
                    <div className="border-t border-base-300/50 my-4" />
                    <p className="text-xs font-medium text-base-content/40 uppercase tracking-wider">Association Engagement</p>
                    <div className="form-control">
                      <label className="cursor-pointer flex items-center gap-3 p-3 rounded-xl border border-base-300 hover:bg-base-200/50 transition-colors">
                        <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" {...register('isWhatsAppMember')} />
                        <span className="text-sm">I am a member of my Year Group WhatsApp platform</span>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Willing to volunteer or serve on a committee?</span></label>
                      <div className="flex gap-4">
                        {(['YES', 'NO', 'MAYBE'] as const).map((v) => (
                          <label key={v} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" className="radio radio-primary radio-sm" value={v} {...register('willingToVolunteer')} />
                            <span className="text-sm">{v === 'MAYBE' ? 'Maybe' : v === 'YES' ? 'Yes' : 'No'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text font-medium text-sm">Preferred Contribution Areas</span></label>
                      <div className="flex flex-wrap gap-2">
                        {CONTRIBUTION_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleArrayField('preferredContributions', opt)}
                            className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
                              watchContributions.includes(opt)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-base-300 text-base-content/60 hover:border-base-content/30'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6: Consent */}
                {step === 6 && (
                  <motion.div key="step6" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-5">
                    <div className="rounded-2xl bg-base-200/60 border border-base-300 p-5">
                      <h4 className="font-semibold text-sm mb-3">Consent & Declaration</h4>
                      <p className="text-sm text-base-content/60 leading-relaxed">
                        I confirm that the information provided is accurate and consent to being contacted by the
                        Old Students Association for official purposes.
                      </p>
                      <ul className="space-y-2.5 mt-4">
                        {[
                          'The information I have provided is true and accurate',
                          'I consent to UPOSA contacting me for official purposes',
                          'I agree to abide by the UPOSA constitution and bylaws',
                        ].map((item, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-base-content/60"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                          >
                            <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                    <div className="form-control">
                      <label className="cursor-pointer flex items-center gap-3 p-4 rounded-xl border border-base-300 hover:bg-base-200/50 transition-colors">
                        <input type="checkbox" className={`checkbox checkbox-primary ${errors.consentGiven ? 'checkbox-error' : ''}`} {...register('consentGiven')} />
                        <span className="label-text font-medium">I agree to all of the above *</span>
                      </label>
                      {errors.consentGiven && <p className="text-error text-xs mt-1">{errors.consentGiven.message}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

                    {/* Navigation */}
                    <div className="mt-8 flex flex-col gap-3 border-t border-base-300/50 pt-5 sm:flex-row">
                      {step > 1 && (
                        <motion.button
                          type="button"
                          className="btn h-12 flex-1 justify-between border-primary/10 bg-base-200/45 px-5 text-base text-base-content hover:border-primary/20 hover:bg-base-200"
                          onClick={() => setStep(step - 1)}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </motion.button>
                      )}
                      {step < TOTAL_STEPS ? (
                        <motion.button
                          type="button"
                          className="btn btn-auth-cream h-12 flex-1 justify-between px-5 text-base"
                          onClick={nextStep}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Continue <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      ) : (
                        <motion.button
                          type="submit"
                          className="btn btn-auth-cream h-12 flex-1 justify-between px-5 text-base"
                          disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.01 }}
                          whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                          {loading ? (
                            <span className="flex w-full items-center justify-between gap-4">
                              <span>Creating account</span>
                              <BouncingDots />
                            </span>
                          ) : (
                            <>
                              Create account
                              <UserPlus className="h-4 w-4" />
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  )
}
