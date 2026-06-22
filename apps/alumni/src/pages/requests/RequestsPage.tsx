import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Send,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { transcriptsApi, contactApi } from '../../api/services'

const transcriptSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone number is required'),
  yearGroup: z.string().min(4, 'Year group is required'),
  programme: z.string().min(1, 'Programme is required'),
  copies: z.string().optional(),
  deliveryMethod: z.enum(['pickup', 'mail', 'email']),
  mailingAddress: z.string().optional(),
  purpose: z.string().min(5, 'Purpose is required'),
  additionalNotes: z.string().optional(),
})

const recommendationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone number is required'),
  yearGroup: z.string().min(4, 'Year group is required'),
  programme: z.string().min(1, 'Programme is required'),
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientOrg: z.string().min(2, 'Organization is required'),
  recipientEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  purpose: z.enum(['employment', 'further_studies', 'scholarship', 'professional', 'other']),
  purposeDetails: z.string().min(10, 'Please provide more details'),
  deadline: z.string().optional(),
  additionalNotes: z.string().optional(),
})

type TranscriptForm = z.infer<typeof transcriptSchema>
type RecommendationForm = z.infer<typeof recommendationSchema>
type RequestTab = 'transcript' | 'recommendation'

const programmes = [
  { value: 'GENERAL_ARTS', label: 'General Arts' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'HOME_ECONOMICS', label: 'Home Economics' },
  { value: 'VISUAL_ARTS', label: 'Visual Arts' },
  { value: 'SCIENCE', label: 'Science' },
]

const inputCls = 'input input-bordered min-h-12 w-full border-primary/10 bg-base-200/45 focus:border-primary focus:bg-base-100'
const inputIconCls = `${inputCls} pl-10`
const selectCls = 'select select-bordered min-h-12 w-full border-primary/10 bg-base-200/45 focus:border-primary focus:bg-base-100'
const textareaCls = 'textarea textarea-bordered w-full border-primary/10 bg-base-200/45 leading-relaxed focus:border-primary focus:bg-base-100'
const labelCls = 'text-xs font-bold uppercase tracking-[0.14em] text-base-content/44'

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'bg-primary-content/[0.06] text-secondary',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  detail: string
  tone?: string
}) {
  return (
    <div className="flex h-full flex-col border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <span className={`grid h-10 w-10 place-items-center rounded-[14px_3px_14px_3px] ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary">{value}</p>
      <p className="mt-auto pt-2 text-xs font-semibold text-primary-content/45">{detail}</p>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="form-control">
      <span className="mb-2">
        <span className={labelCls}>{label}</span>
      </span>
      {children}
      {error && <span className="mt-2 text-xs font-bold text-error">{error}</span>}
    </label>
  )
}

function IconInput({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
      {children}
    </div>
  )
}

function PanelHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold leading-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-base-content/56">{description}</p>
      </div>
    </div>
  )
}

function RequestTypeButton({
  active,
  icon: Icon,
  label,
  helper,
  detail,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  helper: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`flex min-h-24 items-start gap-3 border p-4 text-left transition-all rounded-[22px_4px_22px_4px] ${
        active ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
      }`}
      onClick={onClick}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[16px_3px_16px_3px] ${active ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs font-semibold text-secondary">{helper}</span>
        <span className="mt-2 block text-xs leading-relaxed text-base-content/50">{detail}</span>
      </span>
    </button>
  )
}

function InfoCard({
  icon: Icon,
  label,
  title,
  description,
}: {
  icon: LucideIcon
  label: string
  title: string
  description: string
}) {
  return (
    <div className="border border-primary/10 bg-base-100/86 p-4 rounded-[20px_4px_20px_4px]">
      <span className="grid h-11 w-11 place-items-center bg-primary/8 text-primary rounded-[15px_3px_15px_3px]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">{label}</p>
      <h3 className="mt-1 text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-base-content/54">{description}</p>
    </div>
  )
}

function SuccessPanel({ submitted, onReset }: { submitted: RequestTab; onReset: () => void }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="relative flex min-h-[34rem] flex-col items-center justify-center overflow-hidden border border-success/15 bg-base-100/90 px-6 py-12 text-center shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]"
    >
      <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 object-contain opacity-[0.035]" />
      <span className="grid h-20 w-20 place-items-center bg-success/10 text-success rounded-[22px_5px_22px_5px]">
        <CheckCircle2 className="h-10 w-10" />
      </span>
      <h2 className="mt-6 text-2xl font-bold">Request submitted</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-base-content/58">
        {submitted === 'transcript'
          ? 'Your transcript request has been sent. Watch your email for payment instructions, confirmation, and processing details.'
          : 'Your recommendation request has been sent. The school administration will review the details and process the letter.'}
      </p>
      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-base-content/45">
        <Clock3 className="h-4 w-4" />
        {submitted === 'transcript' ? 'Estimated processing: 5-10 business days' : 'Estimated processing: 7-14 business days'}
      </div>
      <button type="button" className="btn btn-primary mt-7 min-h-11 gap-2" onClick={onReset}>
        Submit another request
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export default function RequestsPage() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [tab, setTab] = useState<RequestTab>('transcript')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<RequestTab | null>(null)

  const transcriptForm = useForm<TranscriptForm>({
    resolver: zodResolver(transcriptSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.mobileNumber || '',
      yearGroup: user?.yearGroup?.toString() || '',
      programme: user?.programme || '',
      copies: '1',
      deliveryMethod: 'pickup',
    },
  })

  const recommendationForm = useForm<RecommendationForm>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.mobileNumber || '',
      yearGroup: user?.yearGroup?.toString() || '',
      programme: user?.programme || '',
      purpose: 'employment',
    },
  })

  const onTranscriptSubmit = async (data: TranscriptForm) => {
    setSubmitting(true)
    try {
      const notes = [
        `Programme: ${data.programme}`,
        `Copies: ${data.copies ?? '1'}`,
        `Delivery: ${data.deliveryMethod}`,
        data.deliveryMethod === 'mail' && data.mailingAddress
          ? `Mailing address: ${data.mailingAddress}`
          : null,
        `Purpose: ${data.purpose}`,
        data.additionalNotes ? `Notes: ${data.additionalNotes}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      await transcriptsApi.submit({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        yearGroup: data.yearGroup,
        notes,
      })
      setSubmitted('transcript')
      toast.success('Transcript request submitted!')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(msg || 'Failed to submit transcript request.')
    } finally {
      setSubmitting(false)
    }
  }

  const onRecommendationSubmit = async (data: RecommendationForm) => {
    setSubmitting(true)
    try {
      const subject = `Recommendation request for ${data.recipientOrg}`
      const message = [
        `Recommendation request from ${data.fullName} (${data.yearGroup}, ${data.programme})`,
        `Phone: ${data.phone}`,
        '',
        `Recipient: ${data.recipientName}, ${data.recipientOrg}`,
        data.recipientEmail ? `Recipient email: ${data.recipientEmail}` : null,
        `Purpose: ${data.purpose}`,
        `Details: ${data.purposeDetails}`,
        data.deadline ? `Deadline: ${data.deadline}` : null,
        data.additionalNotes ? `Additional notes: ${data.additionalNotes}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      await contactApi.send({
        name: data.fullName,
        email: data.email,
        subject,
        message,
      })
      setSubmitted('recommendation')
      toast.success('Recommendation request submitted!')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(msg || 'Failed to submit recommendation request.')
    } finally {
      setSubmitting(false)
    }
  }

  const watchDelivery = transcriptForm.watch('deliveryMethod')
  const isTranscript = tab === 'transcript'

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
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Service requests
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Start official school support from one desk.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Request transcripts, recommendations, and service support with the details the administration needs to process them cleanly.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={FileText} label="Transcript" value="5-10" detail="Business days" />
              <StatTile icon={Award} label="Letters" value="7-14" detail="Business days" />
              <StatTile icon={ReceiptText} label="Fee" value="GHS 20" detail="Per transcript copy" tone="bg-secondary/18 text-primary" />
              <StatTile icon={FileCheck2} label="Routing" value="Admin" detail="Sent to school desk" tone="bg-success/12 text-success" />
            </div>
          </div>
        </section>

        <section className="relative z-10 grid gap-3 md:grid-cols-2">
          <RequestTypeButton
            active={tab === 'transcript'}
            icon={FileText}
            label="Transcript request"
            helper="Academic records"
            detail="Official records, copies, and delivery preference."
            onClick={() => { setTab('transcript'); setSubmitted(null) }}
          />
          <RequestTypeButton
            active={tab === 'recommendation'}
            icon={Award}
            label="Recommendation letter"
            helper="School testimonial"
            detail="Reference letters for work, admissions, scholarships, or professional use."
            onClick={() => { setTab('recommendation'); setSubmitted(null) }}
          />
        </section>

        <AnimatePresence mode="wait">
          {submitted ? (
            <SuccessPanel submitted={submitted} onReset={() => setSubmitted(null)} />
          ) : (
            <motion.section
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)]"
            >
              <ScrollReveal>
                <div className="flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
                  <div className="h-1 bg-secondary" />
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <PanelHeader
                      icon={isTranscript ? FileText : Award}
                      eyebrow={isTranscript ? 'Transcript form' : 'Recommendation form'}
                      title={isTranscript ? 'Request academic records' : 'Request a school letter'}
                      description={isTranscript
                        ? 'Add your identity, programme, delivery choice, and purpose so the school can prepare the right record.'
                        : 'Share recipient details, purpose, and deadlines so the administration can prepare the letter properly.'}
                    />

                    {isTranscript ? (
                      <form onSubmit={transcriptForm.handleSubmit(onTranscriptSubmit)} className="mt-6 flex flex-1 flex-col">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Full name" error={transcriptForm.formState.errors.fullName?.message}>
                            <IconInput icon={User}>
                              <input type="text" className={`${inputIconCls} ${transcriptForm.formState.errors.fullName ? 'input-error' : ''}`} {...transcriptForm.register('fullName')} />
                            </IconInput>
                          </Field>
                          <Field label="Email" error={transcriptForm.formState.errors.email?.message}>
                            <IconInput icon={Mail}>
                              <input type="email" className={`${inputIconCls} ${transcriptForm.formState.errors.email ? 'input-error' : ''}`} {...transcriptForm.register('email')} />
                            </IconInput>
                          </Field>
                          <Field label="Phone" error={transcriptForm.formState.errors.phone?.message}>
                            <IconInput icon={Phone}>
                              <input type="tel" className={`${inputIconCls} ${transcriptForm.formState.errors.phone ? 'input-error' : ''}`} {...transcriptForm.register('phone')} />
                            </IconInput>
                          </Field>
                          <Field label="Year group" error={transcriptForm.formState.errors.yearGroup?.message}>
                            <input type="text" className={`${inputCls} ${transcriptForm.formState.errors.yearGroup ? 'input-error' : ''}`} {...transcriptForm.register('yearGroup')} />
                          </Field>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <Field label="Programme" error={transcriptForm.formState.errors.programme?.message}>
                            <select className={`${selectCls} ${transcriptForm.formState.errors.programme ? 'select-error' : ''}`} {...transcriptForm.register('programme')}>
                              <option value="">Select programme</option>
                              {programmes.map((programme) => (
                                <option key={programme.value} value={programme.value}>{programme.label}</option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Copies">
                            <select className={selectCls} {...transcriptForm.register('copies')}>
                              {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
                            </select>
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Delivery method">
                            <div className="grid gap-2 sm:grid-cols-3">
                              {[
                                { value: 'pickup', label: 'Pick up', icon: FileCheck2 },
                                { value: 'mail', label: 'Mail', icon: MapPin },
                                { value: 'email', label: 'Email scan', icon: Mail },
                              ].map((method) => {
                                const Icon = method.icon
                                const active = watchDelivery === method.value
                                return (
                                  <label
                                    key={method.value}
                                    className={`flex min-h-16 cursor-pointer items-center gap-3 border p-3 transition-all rounded-[18px_4px_18px_4px] ${
                                      active ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/18'
                                    }`}
                                  >
                                    <input type="radio" className="radio radio-primary radio-sm" value={method.value} {...transcriptForm.register('deliveryMethod')} />
                                    <Icon className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-bold">{method.label}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </Field>
                        </div>

                        {watchDelivery === 'mail' && (
                          <div className="mt-4">
                            <Field label="Mailing address">
                              <textarea className={`${textareaCls} min-h-24`} placeholder="Full postal address..." {...transcriptForm.register('mailingAddress')} />
                            </Field>
                          </div>
                        )}

                        <div className="mt-4">
                          <Field label="Purpose" error={transcriptForm.formState.errors.purpose?.message}>
                            <textarea className={`${textareaCls} min-h-28 ${transcriptForm.formState.errors.purpose ? 'textarea-error' : ''}`} placeholder="e.g. University admission, job application..." {...transcriptForm.register('purpose')} />
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Additional notes">
                            <textarea className={`${textareaCls} min-h-24`} placeholder="Any special instructions..." {...transcriptForm.register('additionalNotes')} />
                          </Field>
                        </div>

                        <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                          <p className="max-w-md text-xs font-semibold leading-relaxed text-base-content/42">
                            Processing fee is GHS 20 per copy. Payment instructions will be sent after submission.
                          </p>
                          <button type="submit" className="btn btn-primary min-h-11 gap-2 sm:min-w-48" disabled={submitting}>
                            {submitting ? (
                              <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
                            ) : (
                              <>
                                Submit request
                                <Send className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={recommendationForm.handleSubmit(onRecommendationSubmit)} className="mt-6 flex flex-1 flex-col">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Full name" error={recommendationForm.formState.errors.fullName?.message}>
                            <IconInput icon={User}>
                              <input type="text" className={`${inputIconCls} ${recommendationForm.formState.errors.fullName ? 'input-error' : ''}`} {...recommendationForm.register('fullName')} />
                            </IconInput>
                          </Field>
                          <Field label="Email" error={recommendationForm.formState.errors.email?.message}>
                            <IconInput icon={Mail}>
                              <input type="email" className={`${inputIconCls} ${recommendationForm.formState.errors.email ? 'input-error' : ''}`} {...recommendationForm.register('email')} />
                            </IconInput>
                          </Field>
                          <Field label="Phone" error={recommendationForm.formState.errors.phone?.message}>
                            <IconInput icon={Phone}>
                              <input type="tel" className={`${inputIconCls} ${recommendationForm.formState.errors.phone ? 'input-error' : ''}`} {...recommendationForm.register('phone')} />
                            </IconInput>
                          </Field>
                          <Field label="Year group" error={recommendationForm.formState.errors.yearGroup?.message}>
                            <input type="text" className={`${inputCls} ${recommendationForm.formState.errors.yearGroup ? 'input-error' : ''}`} {...recommendationForm.register('yearGroup')} />
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Programme" error={recommendationForm.formState.errors.programme?.message}>
                            <select className={`${selectCls} ${recommendationForm.formState.errors.programme ? 'select-error' : ''}`} {...recommendationForm.register('programme')}>
                              <option value="">Select programme</option>
                              {programmes.map((programme) => (
                                <option key={programme.value} value={programme.value}>{programme.label}</option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        <div className="my-5 flex items-center gap-3">
                          <span className="h-px flex-1 bg-primary/10" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Recipient details</span>
                          <span className="h-px flex-1 bg-primary/10" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Recipient / addressed to" error={recommendationForm.formState.errors.recipientName?.message}>
                            <input type="text" className={`${inputCls} ${recommendationForm.formState.errors.recipientName ? 'input-error' : ''}`} placeholder="e.g. Admissions Office" {...recommendationForm.register('recipientName')} />
                          </Field>
                          <Field label="Organization" error={recommendationForm.formState.errors.recipientOrg?.message}>
                            <input type="text" className={`${inputCls} ${recommendationForm.formState.errors.recipientOrg ? 'input-error' : ''}`} placeholder="e.g. University of Ghana" {...recommendationForm.register('recipientOrg')} />
                          </Field>
                          <Field label="Recipient email" error={recommendationForm.formState.errors.recipientEmail?.message}>
                            <input type="email" className={`${inputCls} ${recommendationForm.formState.errors.recipientEmail ? 'input-error' : ''}`} placeholder="Optional direct submission" {...recommendationForm.register('recipientEmail')} />
                          </Field>
                          <Field label="Deadline">
                            <IconInput icon={Calendar}>
                              <input type="date" className={inputIconCls} {...recommendationForm.register('deadline')} />
                            </IconInput>
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Purpose" error={recommendationForm.formState.errors.purpose?.message}>
                            <select className={`${selectCls} ${recommendationForm.formState.errors.purpose ? 'select-error' : ''}`} {...recommendationForm.register('purpose')}>
                              <option value="employment">Employment</option>
                              <option value="further_studies">Further Studies / Admission</option>
                              <option value="scholarship">Scholarship Application</option>
                              <option value="professional">Professional Certification</option>
                              <option value="other">Other</option>
                            </select>
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Details" error={recommendationForm.formState.errors.purposeDetails?.message}>
                            <textarea className={`${textareaCls} min-h-32 ${recommendationForm.formState.errors.purposeDetails ? 'textarea-error' : ''}`} placeholder="Describe what the letter should highlight..." {...recommendationForm.register('purposeDetails')} />
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Additional notes">
                            <textarea className={`${textareaCls} min-h-24`} placeholder="Any other information..." {...recommendationForm.register('additionalNotes')} />
                          </Field>
                        </div>

                        <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                          <p className="max-w-md text-xs font-semibold leading-relaxed text-base-content/42">
                            Letters are prepared from school records. Urgent requests may incur additional fees.
                          </p>
                          <button type="submit" className="btn btn-primary min-h-11 gap-2 sm:min-w-48" disabled={submitting}>
                            {submitting ? (
                              <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
                            ) : (
                              <>
                                Submit request
                                <Send className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              <div className="grid gap-5">
                <ScrollReveal delay={0.05}>
                  <aside className="relative overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
                    <div className="h-1 bg-primary" />
                    <div className="p-5">
                      <PanelHeader
                        icon={isTranscript ? ReceiptText : Award}
                        eyebrow="Processing guide"
                        title={isTranscript ? 'Transcript route' : 'Letter route'}
                        description={isTranscript
                          ? 'Transcript requests go to the school administration desk for review, fee confirmation, and delivery.'
                          : 'Recommendation requests are sent as a service message for administrative review and preparation.'}
                      />
                      <div className="mt-5 grid gap-3">
                        {isTranscript ? (
                          <>
                            <InfoCard icon={ReceiptText} label="Fee" title="GHS 20 per copy" description="Payment instructions are sent after your request has been received." />
                            <InfoCard icon={Clock3} label="Timeline" title="5-10 business days" description="Processing starts after the school confirms request details and payment." />
                            <InfoCard icon={FileCheck2} label="Delivery" title="Pickup, mail, or scan" description="Choose the delivery method that fits the destination of the transcript." />
                          </>
                        ) : (
                          <>
                            <InfoCard icon={Award} label="Review" title="School-admin prepared" description="Letters are based on your school records and the purpose you provide." />
                            <InfoCard icon={Clock3} label="Timeline" title="7-14 business days" description="Urgent requests may require extra follow-up and possible fees." />
                            <InfoCard icon={Mail} label="Recipient" title="Direct email optional" description="Add a recipient email when the institution accepts direct submission." />
                          </>
                        )}
                      </div>
                    </div>
                  </aside>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <aside className="relative overflow-hidden border border-primary/10 bg-primary text-primary-content shadow-[0_18px_48px_rgba(0,27,80,0.14)] rounded-[24px_4px_24px_4px]">
                    <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 object-contain opacity-[0.055]" />
                    <div className="relative p-5">
                      <span className="grid h-12 w-12 place-items-center bg-primary-content/10 text-secondary rounded-[16px_3px_16px_3px]">
                        <FileCheck2 className="h-5 w-5" />
                      </span>
                      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-content/42">Before submission</p>
                      <h2 className="mt-2 text-2xl font-bold">Check the details once.</h2>
                      <p className="mt-4 text-sm leading-relaxed text-primary-content/62">
                        Names, year group, programme, recipient information, and deadlines should be accurate before sending. Clean details make the request easier to process.
                      </p>
                    </div>
                  </aside>
                </ScrollReveal>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
