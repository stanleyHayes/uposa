import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import { contactApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'

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
        <div className="lg:col-span-2">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card bg-base-100 border border-base-300">
              <div className="card-body items-center text-center py-16">
                <CheckCircle className="w-16 h-16 text-success mb-4" />
                <h2 className="text-xl font-bold">Message Sent!</h2>
                <p className="text-base-content/60 max-w-md">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                <button className="btn btn-primary btn-sm mt-4" onClick={() => setSent(false)}>Send Another Message</button>
              </div>
            </motion.div>
          ) : (
            <ScrollReveal>
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Name *</span></label>
                        <input type="text" className={`input input-bordered ${errors.name ? 'input-error' : ''}`} {...register('name')} />
                        {errors.name && <label className="label"><span className="label-text-alt text-error">{errors.name.message}</span></label>}
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Email *</span></label>
                        <input type="email" className={`input input-bordered ${errors.email ? 'input-error' : ''}`} {...register('email')} />
                        {errors.email && <label className="label"><span className="label-text-alt text-error">{errors.email.message}</span></label>}
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Subject *</span></label>
                      <input type="text" className={`input input-bordered ${errors.subject ? 'input-error' : ''}`} {...register('subject')} />
                      {errors.subject && <label className="label"><span className="label-text-alt text-error">{errors.subject.message}</span></label>}
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Message *</span></label>
                      <textarea className={`textarea textarea-bordered h-32 ${errors.message ? 'textarea-error' : ''}`} {...register('message')} />
                      {errors.message && <label className="label"><span className="label-text-alt text-error">{errors.message.message}</span></label>}
                    </div>
                    <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                      {!loading && <Send className="w-4 h-4" />}
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>

        <ScrollReveal delay={0.1}>
          <div className="space-y-4">
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-sm text-base-content/60">info@uposa.org</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Phone</p>
                    <p className="text-sm text-base-content/60">+233 XX XXX XXXX</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Address</p>
                    <p className="text-sm text-base-content/60">Upper West Region, Ghana</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card bg-primary/5 border border-primary/20">
              <div className="card-body">
                <h3 className="font-semibold">Office Hours</h3>
                <p className="text-sm text-base-content/60">Monday - Friday: 9:00 AM - 5:00 PM</p>
                <p className="text-sm text-base-content/60">Saturday: 10:00 AM - 2:00 PM</p>
                <p className="text-sm text-base-content/60">Sunday: Closed</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  )
}
