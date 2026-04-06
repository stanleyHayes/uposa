import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FileText, Award, Send, CheckCircle, Clock, User, Mail, Phone, Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'

const transcriptSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone number is required'),
  yearGroup: z.string().min(4, 'Year group is required'),
  programme: z.string().min(1, 'Programme is required'),
  copies: z.string().optional().default('1'),
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

export default function RequestsPage() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [tab, setTab] = useState<'transcript' | 'recommendation'>('transcript')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const transcriptForm = useForm<TranscriptForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(transcriptSchema) as any,
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

  const onTranscriptSubmit = async (_data: TranscriptForm) => {
    setSubmitting(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500))
    setSubmitting(false)
    setSubmitted('transcript')
    toast.success('Transcript request submitted!')
  }

  const onRecommendationSubmit = async (_data: RecommendationForm) => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSubmitting(false)
    setSubmitted('recommendation')
    toast.success('Recommendation request submitted!')
  }

  const watchDelivery = transcriptForm.watch('deliveryMethod')

  return (
    <PageTransition>
      <PageHeader title="Requests" description="Request transcripts, recommendations, and testimonials" />

      {/* Tab selector */}
      <div className="flex gap-3 mb-8">
        {[
          { key: 'transcript' as const, label: 'Transcript Request', icon: FileText, desc: 'Academic records' },
          { key: 'recommendation' as const, label: 'Recommendation Letter', icon: Award, desc: 'From school' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSubmitted(null) }}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              tab === t.key
                ? 'border-primary bg-primary/5'
                : 'border-base-300 hover:border-base-content/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              tab === t.key ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/50'
            }`}>
              <t.icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{t.label}</p>
              <p className="text-xs text-base-content/50">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto"
          >
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body items-center text-center py-12">
                <motion.div
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <CheckCircle className="w-10 h-10 text-success" />
                </motion.div>
                <h2 className="text-xl font-bold mb-2">Request Submitted!</h2>
                <p className="text-base-content/60 max-w-sm">
                  {submitted === 'transcript'
                    ? 'Your transcript request has been submitted. You will receive a confirmation email with processing details and estimated timeline.'
                    : 'Your recommendation letter request has been submitted. The school administration will review and process your request.'}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-base-content/50">
                  <Clock className="w-4 h-4" />
                  <span>Estimated processing time: 5-10 business days</span>
                </div>
                <button className="btn btn-primary btn-sm mt-6" onClick={() => setSubmitted(null)}>
                  Submit Another Request
                </button>
              </div>
            </div>
          </motion.div>
        ) : tab === 'transcript' ? (
          <motion.div key="transcript" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ScrollReveal>
              <div className="card bg-base-100 border border-base-300 max-w-2xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">Transcript Request Form</h3>
                      <p className="text-xs text-base-content/50">Request official academic transcripts from the school</p>
                    </div>
                  </div>

                  <form onSubmit={transcriptForm.handleSubmit(onTranscriptSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Full Name *</span></label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input type="text" className={`input input-bordered w-full pl-10 ${transcriptForm.formState.errors.fullName ? 'input-error' : ''}`} {...transcriptForm.register('fullName')} />
                        </div>
                        {transcriptForm.formState.errors.fullName && <p className="text-error text-xs mt-1">{transcriptForm.formState.errors.fullName.message}</p>}
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Email *</span></label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input type="email" className={`input input-bordered w-full pl-10 ${transcriptForm.formState.errors.email ? 'input-error' : ''}`} {...transcriptForm.register('email')} />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Phone *</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input type="tel" className={`input input-bordered w-full pl-10 ${transcriptForm.formState.errors.phone ? 'input-error' : ''}`} {...transcriptForm.register('phone')} />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Year Group *</span></label>
                        <input type="text" className={`input input-bordered ${transcriptForm.formState.errors.yearGroup ? 'input-error' : ''}`} {...transcriptForm.register('yearGroup')} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Programme *</span></label>
                        <select className={`select select-bordered ${transcriptForm.formState.errors.programme ? 'select-error' : ''}`} {...transcriptForm.register('programme')}>
                          <option value="">Select</option>
                          <option value="GENERAL_ARTS">General Arts</option>
                          <option value="BUSINESS">Business</option>
                          <option value="HOME_ECONOMICS">Home Economics</option>
                          <option value="VISUAL_ARTS">Visual Arts</option>
                          <option value="SCIENCE">Science</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Number of Copies</span></label>
                        <select className="select select-bordered" {...transcriptForm.register('copies')}>
                          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Delivery Method *</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'pickup', label: 'Pick Up' },
                          { value: 'mail', label: 'Mail' },
                          { value: 'email', label: 'Email (Scanned)' },
                        ].map((m) => (
                          <label key={m.value} className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            watchDelivery === m.value ? 'border-primary bg-primary/5' : 'border-base-300'
                          }`}>
                            <input type="radio" className="radio radio-primary radio-sm" value={m.value} {...transcriptForm.register('deliveryMethod')} />
                            <span className="text-sm">{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {watchDelivery === 'mail' && (
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Mailing Address *</span></label>
                        <textarea className="textarea textarea-bordered h-20" placeholder="Full postal address..." {...transcriptForm.register('mailingAddress')} />
                      </div>
                    )}

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Purpose *</span></label>
                      <textarea className={`textarea textarea-bordered h-20 ${transcriptForm.formState.errors.purpose ? 'textarea-error' : ''}`} placeholder="e.g. University admission, Job application..." {...transcriptForm.register('purpose')} />
                      {transcriptForm.formState.errors.purpose && <p className="text-error text-xs mt-1">{transcriptForm.formState.errors.purpose.message}</p>}
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Additional Notes</span></label>
                      <textarea className="textarea textarea-bordered h-16" placeholder="Any special instructions..." {...transcriptForm.register('additionalNotes')} />
                    </div>

                    <div className="bg-base-200/50 rounded-xl p-4 border border-base-300">
                      <p className="text-xs text-base-content/60">
                        <strong>Processing fee:</strong> GHS 20 per copy. Payment instructions will be sent to your email after submission.
                        Processing takes 5-10 business days.
                      </p>
                    </div>

                    <button type="submit" className={`btn btn-primary ${submitting ? 'loading' : ''}`} disabled={submitting}>
                      {!submitting && <Send className="w-4 h-4" />}
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </form>
                </div>
              </div>
            </ScrollReveal>
          </motion.div>
        ) : (
          <motion.div key="recommendation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ScrollReveal>
              <div className="card bg-base-100 border border-base-300 max-w-2xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">Recommendation Letter Request</h3>
                      <p className="text-xs text-base-content/50">Request a recommendation or testimonial from the school</p>
                    </div>
                  </div>

                  <form onSubmit={recommendationForm.handleSubmit(onRecommendationSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Full Name *</span></label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input type="text" className="input input-bordered w-full pl-10" {...recommendationForm.register('fullName')} />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Email *</span></label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input type="email" className="input input-bordered w-full pl-10" {...recommendationForm.register('email')} />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Phone *</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input type="tel" className="input input-bordered w-full pl-10" {...recommendationForm.register('phone')} />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Year Group *</span></label>
                        <input type="text" className="input input-bordered" {...recommendationForm.register('yearGroup')} />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Programme *</span></label>
                      <select className="select select-bordered" {...recommendationForm.register('programme')}>
                        <option value="">Select</option>
                        <option value="GENERAL_ARTS">General Arts</option>
                        <option value="BUSINESS">Business</option>
                        <option value="HOME_ECONOMICS">Home Economics</option>
                        <option value="VISUAL_ARTS">Visual Arts</option>
                        <option value="SCIENCE">Science</option>
                      </select>
                    </div>

                    <div className="divider text-xs">RECIPIENT DETAILS</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Recipient / Addressed To *</span></label>
                        <input type="text" className={`input input-bordered ${recommendationForm.formState.errors.recipientName ? 'input-error' : ''}`} placeholder="e.g. Admissions Office" {...recommendationForm.register('recipientName')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Organization *</span></label>
                        <input type="text" className={`input input-bordered ${recommendationForm.formState.errors.recipientOrg ? 'input-error' : ''}`} placeholder="e.g. University of Ghana" {...recommendationForm.register('recipientOrg')} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Recipient Email</span></label>
                        <input type="email" className="input input-bordered" placeholder="Optional - for direct submission" {...recommendationForm.register('recipientEmail')} />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Deadline</span></label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input type="date" className="input input-bordered w-full pl-10" {...recommendationForm.register('deadline')} />
                        </div>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Purpose *</span></label>
                      <select className="select select-bordered" {...recommendationForm.register('purpose')}>
                        <option value="employment">Employment</option>
                        <option value="further_studies">Further Studies / Admission</option>
                        <option value="scholarship">Scholarship Application</option>
                        <option value="professional">Professional Certification</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Details *</span></label>
                      <textarea className={`textarea textarea-bordered h-24 ${recommendationForm.formState.errors.purposeDetails ? 'textarea-error' : ''}`} placeholder="Describe what the letter should highlight - your achievements, role, or any specific points to mention..." {...recommendationForm.register('purposeDetails')} />
                      {recommendationForm.formState.errors.purposeDetails && <p className="text-error text-xs mt-1">{recommendationForm.formState.errors.purposeDetails.message}</p>}
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Additional Notes</span></label>
                      <textarea className="textarea textarea-bordered h-16" placeholder="Any other information..." {...recommendationForm.register('additionalNotes')} />
                    </div>

                    <div className="bg-base-200/50 rounded-xl p-4 border border-base-300">
                      <p className="text-xs text-base-content/60">
                        Recommendation letters are prepared by the school administration based on your academic records.
                        Processing takes 7-14 business days. Urgent requests may incur additional fees.
                      </p>
                    </div>

                    <button type="submit" className={`btn btn-primary ${submitting ? 'loading' : ''}`} disabled={submitting}>
                      {!submitting && <Send className="w-4 h-4" />}
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </form>
                </div>
              </div>
            </ScrollReveal>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
