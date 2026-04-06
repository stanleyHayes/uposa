import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, UserPlus, User, GraduationCap, ShieldCheck, ArrowLeft, ArrowRight,
  Mail, Lock, Phone, MapPin, Briefcase, HeartPulse,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import AuthSidePanel, { NetworkIllustration } from '../../components/auth/AuthGraphics'

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
  // Section A: Personal Info + Auth
  fullName: z.string().min(2, 'Full name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  // Section B: Contact
  mobileNumber: z.string().min(5, 'Mobile number is required'),
  altPhoneNumber: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  residentialAddress: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  // Section C: Academic
  yearGroup: z.string().optional().transform((v) => v ? Number(v) : undefined),
  programme: z.enum(['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE']).optional(),
  house: z.enum(['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA']).optional(),
  // Section D: Professional
  employmentType: z.enum(['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER']).optional(),
  occupation: z.string().optional(),
  organization: z.string().optional(),
  areaOfExpertise: z.array(z.string()).optional(),
  // Section E: Emergency & NOK
  emergencyContactNumber: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinContact: z.string().optional(),
  nextOfKinRelationship: z.string().optional(),
  // Section F: Engagement
  isWhatsAppMember: z.boolean().optional(),
  willingToVolunteer: z.enum(['YES', 'NO', 'MAYBE']).optional(),
  preferredContributions: z.array(z.string()).optional(),
  // Section G: Consent
  consentGiven: z.literal(true, { message: 'You must consent to proceed' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const TOTAL_STEPS = 6

const stepInfo = [
  { icon: User, label: 'Personal', title: 'Personal Information', desc: 'Section A: Your basic details and account credentials' },
  { icon: Phone, label: 'Contact', title: 'Contact Details', desc: 'Section B: How we can reach you' },
  { icon: GraduationCap, label: 'Academic', title: 'Academic Information', desc: 'Section C: Your time at UPOSA' },
  { icon: Briefcase, label: 'Professional', title: 'Professional Information', desc: 'Section D: Your career details' },
  { icon: HeartPulse, label: 'Emergency', title: 'Emergency & Engagement', desc: 'Sections E & F: Emergency contacts and association involvement' },
  { icon: ShieldCheck, label: 'Consent', title: 'Consent & Declaration', desc: 'Section G: Review and confirm your registration' },
]

const stepFields: Record<number, string[]> = {
  1: ['fullName', 'email', 'password', 'confirmPassword', 'mobileNumber'],
  2: [],
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

  return (
    <div className="flex min-h-screen w-full">
      <AuthSidePanel
        title="Join the Network"
        subtitle="Become part of a thriving alumni community. Register to access exclusive features and connect with fellow graduates."
        illustration={<NetworkIllustration />}
        features={[
          'Connect with 1000+ alumni',
          'Access mentorship programs',
          'Post & find job opportunities',
          'Participate in association events',
        ]}
      />

      <div className="flex-1 flex items-start justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-lg py-4"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center">
              <span className="text-sm font-black">U</span>
            </div>
            <span className="font-bold">UPOSA Alumni</span>
          </div>

          {/* Step indicator - compact */}
          <div className="flex items-center gap-1 mb-6">
            {stepInfo.map((s, i) => {
              const stepNum = i + 1
              const isActive = step === stepNum
              const isDone = step > stepNum
              return (
                <div key={i} className="flex items-center gap-1 flex-1">
                  <motion.div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors duration-300 ${
                      isDone ? 'bg-success text-success-content' :
                      isActive ? 'bg-primary text-primary-content' :
                      'bg-base-200 text-base-content/40'
                    }`}
                    animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    title={s.label}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      stepNum
                    )}
                  </motion.div>
                  {i < TOTAL_STEPS - 1 && (
                    <div className={`flex-1 h-0.5 rounded transition-colors duration-300 ${isDone ? 'bg-success' : 'bg-base-300'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${step}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-5"
            >
              <h2 className="text-xl font-bold">{stepInfo[step - 1].title}</h2>
              <p className="text-base-content/60 text-xs mt-1">{stepInfo[step - 1].desc}</p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait" custom={step}>
              {/* STEP 1: Personal Info + Account */}
              {step === 1 && (
                <motion.div key="step1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-3">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Full Name *</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                      <input type="text" className={`input input-bordered input-sm w-full pl-10 ${errors.fullName ? 'input-error' : ''}`} placeholder="Kwame Mensah" {...register('fullName')} />
                    </div>
                    {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Gender</span></label>
                      <select className="select select-bordered select-sm" {...register('gender')}>
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Date of Birth</span></label>
                      <input type="date" className="input input-bordered input-sm" {...register('dateOfBirth')} />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Marital Status</span></label>
                    <select className="select select-bordered select-sm" {...register('maritalStatus')}>
                      <option value="">Select</option>
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED">Married</option>
                      <option value="SEPARATED">Separated</option>
                      <option value="DIVORCED">Divorced</option>
                      <option value="WIDOWED">Widowed</option>
                    </select>
                  </div>
                  <div className="divider text-xs my-2">Account Credentials</div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Email *</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                      <input type="email" className={`input input-bordered input-sm w-full pl-10 ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" {...register('email')} />
                    </div>
                    {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Password *</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input type={showPassword ? 'text' : 'password'} className={`input input-bordered input-sm w-full pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} {...register('password')} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
                    </div>
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Confirm *</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input type="password" className={`input input-bordered input-sm w-full pl-10 ${errors.confirmPassword ? 'input-error' : ''}`} {...register('confirmPassword')} />
                      </div>
                      {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Contact Details */}
              {step === 2 && (
                <motion.div key="step2" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Mobile Number *</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input type="tel" className={`input input-bordered input-sm w-full pl-10 ${errors.mobileNumber ? 'input-error' : ''}`} placeholder="+233 XX XXX XXXX" {...register('mobileNumber')} />
                      </div>
                      {errors.mobileNumber && <p className="text-error text-xs mt-1">{errors.mobileNumber.message}</p>}
                    </div>
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Alt. Phone</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input type="tel" className="input input-bordered input-sm w-full pl-10" placeholder="Optional" {...register('altPhoneNumber')} />
                      </div>
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Residential Address</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                      <input type="text" className="input input-bordered input-sm w-full pl-10" placeholder="Street address" {...register('residentialAddress')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">City / Town</span></label>
                      <input type="text" className="input input-bordered input-sm" placeholder="e.g. Wa, Accra" {...register('city')} />
                    </div>
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Country</span></label>
                      <input type="text" className="input input-bordered input-sm" placeholder="e.g. Ghana" {...register('country')} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Academic Info */}
              {step === 3 && (
                <motion.div key="step3" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-3">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Year Group (Year of Completion)</span></label>
                    <input type="number" className="input input-bordered input-sm" placeholder="e.g. 2010 (starting from 1982)" min={1982} {...register('yearGroup')} />
                    <label className="label py-0.5"><span className="label-text-alt text-base-content/50">Starting from 1982 upwards</span></label>
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Programme of Study</span></label>
                    <select className="select select-bordered select-sm" {...register('programme')}>
                      <option value="">Select programme</option>
                      <option value="GENERAL_ARTS">General Arts</option>
                      <option value="BUSINESS">Business</option>
                      <option value="HOME_ECONOMICS">Home Economics</option>
                      <option value="VISUAL_ARTS">Visual Arts</option>
                      <option value="SCIENCE">Science</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">House</span></label>
                    <select className="select select-bordered select-sm" {...register('house')}>
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

              {/* STEP 4: Professional Info */}
              {step === 4 && (
                <motion.div key="step4" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-3">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Employment Type</span></label>
                    <select className="select select-bordered select-sm" {...register('employmentType')}>
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
                      <label className="label py-1"><span className="label-text font-medium">Occupation / Profession</span></label>
                      <input type="text" className="input input-bordered input-sm" placeholder="e.g. Teacher, Engineer" {...register('occupation')} />
                    </div>
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Organization</span></label>
                      <input type="text" className="input input-bordered input-sm" placeholder="Place of work" {...register('organization')} />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Area of Expertise / Skills</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto p-2 border border-base-300 rounded-lg bg-base-200/30">
                      {EXPERTISE_OPTIONS.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-base-200 transition-colors">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-xs"
                            checked={watchExpertise.includes(opt)}
                            onChange={() => toggleArrayField('areaOfExpertise', opt)}
                          />
                          <span className="text-xs">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {watchExpertise.length > 0 && (
                      <p className="text-xs text-primary mt-1">{watchExpertise.length} selected</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Emergency, NOK & Engagement */}
              {step === 5 && (
                <motion.div key="step5" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-3">
                  <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Contact Number</span></label>
                      <input type="tel" className="input input-bordered input-sm" {...register('emergencyContactNumber')} />
                    </div>
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Relationship</span></label>
                      <input type="text" className="input input-bordered input-sm" placeholder="e.g. Spouse, Parent" {...register('emergencyRelationship')} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider pt-2">Next of Kin</p>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Full Name</span></label>
                    <input type="text" className="input input-bordered input-sm" {...register('nextOfKinName')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Contact Number</span></label>
                      <input type="tel" className="input input-bordered input-sm" {...register('nextOfKinContact')} />
                    </div>
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Relationship</span></label>
                      <input type="text" className="input input-bordered input-sm" placeholder="e.g. Brother, Sister" {...register('nextOfKinRelationship')} />
                    </div>
                  </div>
                  <div className="divider text-xs my-2">Association Engagement</div>
                  <div className="form-control">
                    <label className="cursor-pointer label justify-start gap-3 py-1">
                      <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" {...register('isWhatsAppMember')} />
                      <span className="label-text">I am a member of my Year Group WhatsApp platform</span>
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Would you like to volunteer or serve on a committee?</span></label>
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
                    <label className="label py-1"><span className="label-text font-medium">Preferred Area(s) of Contribution</span></label>
                    <div className="flex flex-wrap gap-2">
                      {CONTRIBUTION_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                            watchContributions.includes(opt)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-base-300 hover:border-base-content/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={watchContributions.includes(opt)}
                            onChange={() => toggleArrayField('preferredContributions', opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: Consent */}
              {step === 6 && (
                <motion.div key="step6" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-5">
                  <div className="card bg-gradient-to-br from-base-200/80 to-base-200 border border-base-300">
                    <div className="card-body p-5">
                      <h4 className="font-semibold text-sm mb-3">Consent & Declaration</h4>
                      <p className="text-sm text-base-content/70 leading-relaxed">
                        I confirm that the information provided is accurate and consent to being contacted by the
                        Old Students Association for official purposes.
                      </p>
                      <ul className="space-y-2 mt-3">
                        {[
                          'The information I have provided is true and accurate',
                          'I consent to UPOSA contacting me for official purposes',
                          'I agree to abide by the UPOSA constitution and bylaws',
                        ].map((item, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-base-content/70"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                          >
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="cursor-pointer label justify-start gap-3 p-4 rounded-xl border border-base-300 hover:bg-base-200/50 transition-colors">
                      <input type="checkbox" className={`checkbox checkbox-primary ${errors.consentGiven ? 'checkbox-error' : ''}`} {...register('consentGiven')} />
                      <span className="label-text font-medium">I Agree *</span>
                    </label>
                    {errors.consentGiven && <p className="text-error text-xs mt-1">{errors.consentGiven.message}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <motion.button type="button" className="btn btn-ghost flex-1 h-10 text-sm" onClick={() => setStep(step - 1)} whileTap={{ scale: 0.98 }}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </motion.button>
              )}
              {step < TOTAL_STEPS ? (
                <motion.button type="button" className="btn btn-primary flex-1 h-10 text-sm" onClick={nextStep} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  Continue <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button type="submit" className={`btn btn-primary flex-1 h-10 text-sm ${loading ? 'loading' : ''}`} disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  {!loading && <UserPlus className="w-4 h-4" />}
                  {loading ? 'Creating account...' : 'Create Account'}
                </motion.button>
              )}
            </div>

            {/* Step counter */}
            <p className="text-center text-xs text-base-content/40 mt-3">Step {step} of {TOTAL_STEPS}</p>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-center">
            <p className="text-sm text-base-content/60">
              Already have an account?{' '}
              <Link to="/login" className="link link-primary font-medium">Sign in</Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
