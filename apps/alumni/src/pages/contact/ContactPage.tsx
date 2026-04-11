import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, MessageCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
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

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const toast = useToast()
  const { config, loading: configLoading } = useSiteConfig()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await contactApi.send(data)
      setSent(true)
      reset()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Contact Us" description="Get in touch with the UPOSA team" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card relative overflow-hidden bg-base-100 border border-success/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/3 pointer-events-none" />
                <div className="card-body items-center text-center py-16 relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4"
                  >
                    <CheckCircle className="w-10 h-10 text-success" />
                  </motion.div>
                  <h2 className="text-xl font-bold">Message Sent!</h2>
                  <p className="text-base-content/60 max-w-md">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                  <button className="btn btn-primary btn-sm mt-4" onClick={() => setSent(false)}>Send Another Message</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ScrollReveal>
                  <div className="card relative overflow-hidden bg-base-100 border border-base-300/60 shadow-[0_1px_4px_rgba(0,27,80,0.05)]">
                    {/* Top accent */}
                    <div className="h-1 bg-gradient-to-r from-primary via-accent/80 to-primary/50" />
                    {/* Corner decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/4 to-transparent rounded-bl-[64px] pointer-events-none" />

                    <div className="card-body relative">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                          <MessageCircle size={16} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">Send a Message</h3>
                          <p className="text-xs text-base-content/40">We'll get back to you within 24 hours</p>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text font-medium text-sm">Name *</span></label>
                            <input type="text" placeholder="Your full name" className={`input input-bordered ${errors.name ? 'input-error' : ''}`} {...register('name')} />
                            {errors.name && <label className="label"><span className="label-text-alt text-error">{errors.name.message}</span></label>}
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text font-medium text-sm">Email *</span></label>
                            <input type="email" placeholder="you@example.com" className={`input input-bordered ${errors.email ? 'input-error' : ''}`} {...register('email')} />
                            {errors.email && <label className="label"><span className="label-text-alt text-error">{errors.email.message}</span></label>}
                          </div>
                        </div>
                        <div className="form-control">
                          <label className="label"><span className="label-text font-medium text-sm">Subject *</span></label>
                          <input type="text" placeholder="What's this about?" className={`input input-bordered ${errors.subject ? 'input-error' : ''}`} {...register('subject')} />
                          {errors.subject && <label className="label"><span className="label-text-alt text-error">{errors.subject.message}</span></label>}
                        </div>
                        <div className="form-control">
                          <label className="label"><span className="label-text font-medium text-sm">Message *</span></label>
                          <textarea placeholder="Tell us what's on your mind..." className={`textarea textarea-bordered h-32 ${errors.message ? 'textarea-error' : ''}`} {...register('message')} />
                          {errors.message && <label className="label"><span className="label-text-alt text-error">{errors.message.message}</span></label>}
                        </div>
                        <button type="submit" className={`btn btn-primary gap-2 ${loading ? 'loading' : ''}`} disabled={loading}>
                          {!loading && <Send className="w-4 h-4" />}
                          {loading ? 'Sending...' : 'Send Message'}
                        </button>
                      </form>
                    </div>

                    {/* Bottom accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/12 to-transparent" />
                  </div>
                </ScrollReveal>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {configLoading ? (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body space-y-4 animate-pulse">
                <div className="h-5 bg-base-300 rounded w-36" />
                <div className="h-4 bg-base-300 rounded w-48" />
                <div className="h-4 bg-base-300 rounded w-40" />
                <div className="h-4 bg-base-300 rounded w-56" />
              </div>
            </div>
          ) : (
            <>
              {/* Contact Info Card */}
              <ScrollReveal delay={0.1}>
                <div className="card relative overflow-hidden bg-base-100 border border-base-300/60 shadow-[0_1px_4px_rgba(0,27,80,0.05)]">
                  <div className="h-1 bg-gradient-to-r from-primary via-accent/80 to-primary/50" />
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-secondary/5 to-transparent rounded-bl-[40px] pointer-events-none" />

                  <div className="card-body space-y-5 relative">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-secondary" />
                      <h3 className="font-bold text-sm">Contact Information</h3>
                    </div>

                    {[
                      { icon: Mail, label: 'Email', value: config?.contact?.emails?.general || 'info@uposa.org', href: `mailto:${config?.contact?.emails?.general || 'info@uposa.org'}` },
                      { icon: Phone, label: 'Phone', value: config?.contact?.phones?.join(' / ') || '0244036676 / 0246446333', href: `tel:${(config?.contact?.phones?.[0] || '0244036676').replace(/\s/g, '')}` },
                      { icon: MapPin, label: 'Address', value: config?.contact?.address || 'University Practice Senior High School, UCC, Cape Coast', href: undefined },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        className="flex items-start gap-3 group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/8 to-accent/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <item.icon size={15} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-base-content/40 font-medium uppercase tracking-wide">{item.label}</p>
                          {item.href ? (
                            <a href={item.href} className="text-sm font-medium hover:text-primary transition-colors">{item.value}</a>
                          ) : (
                            <p className="text-sm font-medium">{item.value}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                </div>
              </ScrollReveal>

              {/* Office Hours Card */}
              <ScrollReveal delay={0.2}>
                <div className="card relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-accent/3 border border-primary/10">
                  <div className="card-body relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock size={14} className="text-primary" />
                      </div>
                      <h3 className="font-bold text-sm">Office Hours</h3>
                    </div>
                    {config?.contact?.officeHours ? (
                      <p className="text-sm text-base-content/60 whitespace-pre-line leading-relaxed">{config.contact.officeHours}</p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-sm text-base-content/60">Mon - Fri: 9:00 AM - 5:00 PM</p>
                        <p className="text-sm text-base-content/60">Saturday: 10:00 AM - 2:00 PM</p>
                        <p className="text-sm text-base-content/45">Sunday: Closed</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
