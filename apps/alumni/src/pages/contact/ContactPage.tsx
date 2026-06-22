import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import { contactApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { useSiteConfig } from '../../hooks/useSiteConfig'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

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

function FieldShell({
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
      <span className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-base-content/44">{label}</span>
      {children}
      {error && <span className="mt-2 text-xs font-bold text-error">{error}</span>}
    </label>
  )
}

function ContactInfoSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-start gap-3 border border-primary/8 bg-base-100/80 p-3 rounded-[18px_4px_18px_4px]">
          <div className="h-11 w-11 shrink-0 animate-pulse bg-base-300/45 rounded-[15px_3px_15px_3px]" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-3 w-16 animate-pulse bg-base-300/35" />
            <div className="h-4 w-4/5 animate-pulse bg-base-300/55" />
          </div>
        </div>
      ))}
      <div className="h-28 animate-pulse bg-base-300/30 rounded-[20px_4px_20px_4px]" />
    </div>
  )
}

function ContactMethod({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string
  href?: string
}) {
  const content = (
    <div className="group flex h-full items-start gap-3 border border-primary/10 bg-base-100/86 p-3 transition-all hover:border-primary/18 hover:bg-base-100 rounded-[18px_4px_18px_4px]">
      <span className="grid h-11 w-11 shrink-0 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content rounded-[15px_3px_15px_3px]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">{label}</span>
        <span className="mt-1 block break-words text-sm font-bold leading-relaxed text-base-content">{value}</span>
      </span>
    </div>
  )

  return href ? (
    <a href={href} className="block h-full">
      {content}
    </a>
  ) : content
}

function SuccessPanel({ onReset }: { onReset: () => void }) {
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
      <h2 className="mt-6 text-2xl font-bold">Message sent</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-base-content/58">
        Thank you for reaching out. The UPOSA team will review your message and get back to you as soon as possible.
      </p>
      <button type="button" className="btn btn-primary mt-7 min-h-11 gap-2" onClick={onReset}>
        Send another message
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export default function ContactPage() {
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false)
  const [sent, setSent] = useState(false)
  const toast = useToast()
  const { config, loading: configLoading } = useSiteConfig()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const generalEmail = config?.contact?.emails?.general || 'info@uposa.org'
  const phoneList = config?.contact?.phones || ['0244036676', '0246446333']
  const phoneText = phoneList.join(' / ')
  const phoneHref = `tel:${phoneList[0]?.replace(/\s/g, '') || '0244036676'}`
  const address = config?.contact?.address || 'University Practice Senior High School, UCC, Cape Coast'
  const officeHours = config?.contact?.officeHours

  const onSubmit = async (data: FormData) => {
    setIsSubmittingMessage(true)
    try {
      await contactApi.send(data)
      setSent(true)
      reset()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setIsSubmittingMessage(false)
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
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Contact desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Reach the right UPOSA desk without the runaround.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Send requests, share updates, or ask for help with membership, dues, events, transcripts, and alumni services.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={MessageCircle} label="Messages" value="24h" detail="Typical response" />
              <StatTile icon={Mail} label="Email" value={generalEmail} detail="General desk" />
              <StatTile icon={Phone} label="Phone" value={phoneList[0] || '0244036676'} detail="Primary line" tone="bg-secondary/18 text-primary" />
              <StatTile icon={ShieldCheck} label="Routing" value="Secure" detail="Sent to UPOSA" tone="bg-success/12 text-success" />
            </div>
          </div>
        </section>

        <section className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <ScrollReveal>
            <div className="h-full">
              <AnimatePresence mode="wait">
                {sent ? (
                  <SuccessPanel onReset={() => setSent(false)} />
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]"
                  >
                    <div className="h-1 bg-secondary" />
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
                          <Send className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Send a message</p>
                          <h2 className="mt-1 text-2xl font-bold">Tell us what you need.</h2>
                          <p className="mt-2 text-sm leading-relaxed text-base-content/56">
                            Keep it clear and practical. The association desk will route it to the right person.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-1 flex-col">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FieldShell label="Name" error={errors.name?.message}>
                            <input
                              type="text"
                              placeholder="Your full name"
                              className={`input input-bordered min-h-12 border-primary/10 bg-base-200/45 focus:border-primary focus:bg-base-100 ${errors.name ? 'input-error' : ''}`}
                              {...register('name')}
                            />
                          </FieldShell>
                          <FieldShell label="Email" error={errors.email?.message}>
                            <input
                              type="email"
                              placeholder="you@example.com"
                              className={`input input-bordered min-h-12 border-primary/10 bg-base-200/45 focus:border-primary focus:bg-base-100 ${errors.email ? 'input-error' : ''}`}
                              {...register('email')}
                            />
                          </FieldShell>
                        </div>

                        <div className="mt-4">
                          <FieldShell label="Subject" error={errors.subject?.message}>
                            <input
                              type="text"
                              placeholder="What should we route this as?"
                              className={`input input-bordered min-h-12 border-primary/10 bg-base-200/45 focus:border-primary focus:bg-base-100 ${errors.subject ? 'input-error' : ''}`}
                              {...register('subject')}
                            />
                          </FieldShell>
                        </div>

                        <div className="mt-4 flex-1">
                          <FieldShell label="Message" error={errors.message?.message}>
                            <textarea
                              placeholder="Tell us what is on your mind..."
                              className={`textarea textarea-bordered min-h-44 border-primary/10 bg-base-200/45 leading-relaxed focus:border-primary focus:bg-base-100 ${errors.message ? 'textarea-error' : ''}`}
                              {...register('message')}
                            />
                          </FieldShell>
                        </div>

                        <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs font-semibold leading-relaxed text-base-content/42">
                            Required fields are checked before submission.
                          </p>
                          <button type="submit" className="btn btn-primary min-h-11 gap-2 sm:min-w-44" disabled={isSubmittingMessage}>
                            {isSubmittingMessage ? (
                              <span className="h-4 w-24 animate-pulse bg-primary-content/35" />
                            ) : (
                              <>
                                Send message
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>

          <div className="grid gap-5">
            <ScrollReveal delay={0.05}>
              <aside className="overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
                <div className="h-1 bg-primary" />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center bg-secondary/15 text-primary rounded-[15px_3px_15px_3px]">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Direct lines</p>
                      <h2 className="mt-1 text-xl font-bold">Contact information</h2>
                    </div>
                  </div>

                  <div className="mt-5">
                    {configLoading ? (
                      <ContactInfoSkeleton />
                    ) : (
                      <div className="grid gap-3">
                        <ContactMethod icon={Mail} label="Email" value={generalEmail} href={`mailto:${generalEmail}`} />
                        <ContactMethod icon={Phone} label="Phone" value={phoneText} href={phoneHref} />
                        <ContactMethod icon={MapPin} label="Address" value={address} />
                      </div>
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
                    <Clock3 className="h-5 w-5" />
                  </span>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-content/42">Office rhythm</p>
                  <h2 className="mt-2 text-2xl font-bold">When to expect us</h2>
                  {configLoading ? (
                    <div className="mt-5 space-y-3">
                      <div className="h-4 w-4/5 animate-pulse bg-primary-content/20" />
                      <div className="h-4 w-3/5 animate-pulse bg-primary-content/15" />
                      <div className="h-4 w-2/5 animate-pulse bg-primary-content/15" />
                    </div>
                  ) : officeHours ? (
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-primary-content/62">{officeHours}</p>
                  ) : (
                    <div className="mt-4 space-y-2 text-sm font-semibold leading-relaxed text-primary-content/62">
                      <p>Mon - Fri: 9:00 AM - 5:00 PM</p>
                      <p>Saturday: 10:00 AM - 2:00 PM</p>
                      <p className="text-primary-content/42">Sunday: Closed</p>
                    </div>
                  )}
                </div>
              </aside>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
