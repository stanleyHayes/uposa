import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, UserPlus, User, GraduationCap, ShieldCheck, ArrowLeft, ArrowRight,
  Mail, Lock, Phone, MapPin, Briefcase, HeartPulse, CheckCircle2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { GraduationCapIllustration } from '../../components/auth/AuthGraphics'
import SEO from '../../components/common/SEO'

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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const toast = useToast()

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue, getValues } = useForm<FormData>({
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

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
  }

  const StepIcon = stepInfo[step - 1].icon

  // Common input class
  const inputCls = (hasError?: boolean) =>
    `input input-bordered w-full h-11 bg-base-200/50 border-base-300 focus:border-primary focus:bg-base-100 transition-colors ${hasError ? 'input-error' : ''}`
  const selectCls = 'select select-bordered w-full h-11 bg-base-200/50 border-base-300 focus:border-primary focus:bg-base-100 transition-colors'

  return (
    <>
    <SEO title="Register" description="Create your UPOSA alumni account to join the University Practice Old Students' Association network." />
    <div className="min-h-screen flex bg-base-200">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-primary bg-[#FFF8DC] relative">
        <div>
          <GraduationCapIllustration />
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Join the<br />Legit Elites.
          </h2>
          <p className="text-primary/60 text-lg leading-relaxed max-w-sm">
            Register as an alumnus to connect with fellow graduates, contribute to projects, and stay in touch with your alma mater.
          </p>
        </div>
        {/* Step indicators — connected vertical stepper */}
        <div className="relative">
          {stepInfo.map((s, i) => {
            const num = i + 1
            const done = step > num
            const active = step === num
            const isLast = i === stepInfo.length - 1
            const SIcon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex gap-3"
              >
                {/* Node + connector line */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    done
                      ? 'bg-secondary text-primary'
                      : active
                        ? 'bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-base-200'
                        : 'bg-primary/5'
                  }`}>
                    {done ? (
                      <CheckCircle2 size={16} className="text-primary" />
                    ) : (
                      <SIcon size={14} className={active ? 'text-primary' : 'text-primary/30'} />
                    )}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 min-h-[20px] my-1 rounded-full transition-colors duration-300" style={{ backgroundColor: done ? 'var(--color-secondary)' : 'rgba(0,27,80,0.1)' }} />
                  )}
                </div>
                {/* Label */}
                <div className={`pt-1 pb-3 transition-opacity duration-300 ${!active && !done ? 'opacity-40' : ''}`}>
                  <p className={`text-sm font-semibold leading-tight ${active ? 'text-primary' : 'text-primary/50'}`}>
                    {s.label}
                  </p>
                  {active && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-primary/40 mt-0.5"
                    >
                      {s.desc}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Wavy edge divider */}
        <svg className="absolute top-0 right-0 h-full w-12 translate-x-[1px]" viewBox="0 0 48 800" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C24 0, 48 50, 24 100 C0 150, 48 200, 24 250 C0 300, 48 350, 24 400 C0 450, 48 500, 24 550 C0 600, 48 650, 24 700 C0 750, 24 800, 48 800 L48 0 Z" className="fill-base-100" />
        </svg>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col bg-base-100">
        {/* Top bar (mobile) */}
        <div className="flex items-center justify-between px-6 py-4 lg:py-6">
          <Link to="/login" className="flex items-center gap-2.5 text-base-content/60 hover:text-base-content transition-colors">
            <img src="/logo.png" alt="UPOSA" className="w-9 h-9 rounded-lg" />
            <div className="hidden sm:block lg:block">
              <span className="font-bold text-sm block leading-tight text-base-content">UPOSA</span>
              <span className="text-[10px] text-base-content/40">The Legit Elites</span>
            </div>
          </Link>
          <Link to="/login" className="text-sm text-base-content/50 hover:text-base-content transition-colors">
            Have an account? <span className="font-semibold text-primary">Sign in</span>
          </Link>
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-8">
          <div className="max-w-lg mx-auto">
            {/* Step header */}
            <div className="mb-6">
              <motion.div
                key={step}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3"
              >
                <StepIcon size={22} className="text-primary" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h1 className="text-2xl font-bold text-base-content">{stepInfo[step - 1].title}</h1>
                  <p className="text-base-content/50 text-sm mt-1">{stepInfo[step - 1].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress bar (mobile) */}
            <div className="flex gap-1.5 mb-6 lg:hidden">
              {stepInfo.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-base-300">
                  <motion.div
                    className={`h-full rounded-full ${i < step ? 'bg-secondary' : i === step - 1 ? 'bg-secondary' : ''}`}
                    initial={{ width: '0%' }}
                    animate={{ width: i <= step - 1 ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              ))}
            </div>

            {/* Step label */}
            <p className="text-xs font-medium text-base-content/40 uppercase tracking-wider mb-4">
              Step {step} of {TOTAL_STEPS}
            </p>

            {/* Form */}
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
                    <div className="grid grid-cols-2 gap-3">
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
                        <input type="date" className={inputCls()} {...register('dateOfBirth')} />
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
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Region</span></label>
                        <select className={selectCls} {...register('region')}>
                          <option value="">Select</option>
                          <option>Ahafo</option><option>Ashanti</option><option>Bono</option><option>Bono East</option>
                          <option>Central</option><option>Eastern</option><option>Greater Accra</option>
                          <option>North East</option><option>Northern</option><option>Oti</option>
                          <option>Savannah</option><option>Upper East</option><option>Upper West</option>
                          <option>Volta</option><option>Western</option><option>Western North</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">City</span></label>
                        <select className={selectCls} {...register('city')}>
                          <option value="">Select</option>
                          <option>Accra</option><option>Kumasi</option><option>Cape Coast</option><option>Takoradi</option>
                          <option>Tamale</option><option>Sunyani</option><option>Ho</option><option>Koforidua</option>
                          <option>Bolgatanga</option><option>Wa</option><option>Techiman</option><option>Obuasi</option>
                          <option>Tema</option><option>Tarkwa</option><option>Winneba</option><option>Other</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label pb-1"><span className="label-text font-medium text-sm">Country</span></label>
                        <input type="text" className={inputCls()} defaultValue="Ghana" {...register('country')} />
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
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-2 gap-3">
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
              <div className="flex gap-3 mt-8 pt-5 border-t border-base-300/50">
                {step > 1 && (
                  <motion.button type="button" className="btn btn-ghost flex-1 h-12" onClick={() => setStep(step - 1)} whileTap={{ scale: 0.98 }}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </motion.button>
                )}
                {step < TOTAL_STEPS ? (
                  <motion.button type="button" className="btn btn-primary flex-1 h-12 text-base" onClick={nextStep} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button type="submit" className={`btn btn-primary flex-1 h-12 text-base ${loading ? 'loading' : ''}`} disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    {!loading && <UserPlus className="w-4 h-4" />}
                    {loading ? 'Creating account...' : 'Create Account'}
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
