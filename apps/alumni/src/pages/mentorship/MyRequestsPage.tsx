import { useState, useEffect, useCallback } from 'react'
import { Inbox, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { mentorshipApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import type { MentorshipRequest } from '../../types'

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  ACCEPTED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Accepted' },
  DECLINED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Declined' },
  COMPLETED: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Completed' },
}

export default function MyRequestsPage() {
  const toast = useToast()
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [received, setReceived] = useState<MentorshipRequest[]>([])
  const [sent, setSent] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [menteeRes, sentRes] = await Promise.all([
        mentorshipApi.myMentees(),
        mentorshipApi.myRequests(),
      ])
      setReceived((menteeRes.data as any).data || [])
      setSent((sentRes.data as any).data || [])
    } catch {
      toast.error('Failed to load mentorship requests')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await mentorshipApi.respond(id, { status, mentorResponse: responseMessage || undefined })
      toast.success(`Request ${status.toLowerCase()}`)
      setResponding(null)
      setResponseMessage('')
      fetchData()
    } catch {
      toast.error('Failed to respond')
    }
  }

  const requests = tab === 'received' ? received : sent

  if (loading) return <PageTransition><PageHeader title="My Requests" description="Mentorship requests" /><LoadingSpinner /></PageTransition>

  return (
    <PageTransition>
      <PageHeader title="Mentorship Requests" description={`${received.length} received, ${sent.length} sent`} />

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'received' as const, label: 'Received', count: received.length, desc: 'Requests from mentees' },
          { key: 'sent' as const, label: 'Sent', count: sent.length, desc: 'Your requests to mentors' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              tab === t.key ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-base-content/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              tab === t.key ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/50'
            }`}>
              {t.key === 'received' ? <Inbox className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{t.label} <span className="text-base-content/40">({t.count})</span></p>
              <p className="text-xs text-base-content/50">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Request list */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {requests.length === 0 ? (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body items-center text-center py-16">
                <Inbox className="w-12 h-12 text-base-content/20 mb-4" />
                <h3 className="font-bold text-lg mb-1">No {tab} requests</h3>
                <p className="text-sm text-base-content/50">
                  {tab === 'received' ? 'You haven\'t received any mentorship requests yet.' : 'You haven\'t sent any mentorship requests yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING
                const StatusIcon = status.icon
                const person = tab === 'received' ? req.mentee : req.mentor
                const initials = person?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'

                return (
                  <ScrollReveal key={req.id}>
                    <div className="card bg-base-100 shadow-sm border border-base-300/50 overflow-hidden">
                      <div className="card-body p-5">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          {person?.photoUrl ? (
                            <img src={person.photoUrl} alt={person.fullName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary font-bold">{initials}</span>
                            </div>
                          )}

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-bold truncate">{person?.fullName || 'Unknown'}</h3>
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {status.label}
                              </div>
                            </div>
                            {(person as any)?.occupation && (
                              <p className="text-sm text-base-content/50">{(person as any).occupation}{(person as any).organization ? ` at ${(person as any).organization}` : ''}</p>
                            )}
                            {req.message && (
                              <div className="mt-3 p-3 rounded-lg bg-base-200/50 border border-base-300/50">
                                <p className="text-xs text-base-content/40 mb-1 font-medium">Message:</p>
                                <p className="text-sm text-base-content/70">{req.message}</p>
                              </div>
                            )}
                            {req.mentorResponse && (
                              <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-xs text-primary/60 mb-1 font-medium">Response:</p>
                                <p className="text-sm text-base-content/70">{req.mentorResponse}</p>
                              </div>
                            )}
                            <p className="text-xs text-base-content/30 mt-2">{new Date(req.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                            {/* Respond actions for received + pending */}
                            {tab === 'received' && req.status === 'PENDING' && (
                              <div className="mt-4">
                                {responding === req.id ? (
                                  <div className="space-y-3">
                                    <textarea
                                      className="textarea textarea-bordered w-full h-20 text-sm"
                                      placeholder="Optional message to the mentee..."
                                      value={responseMessage}
                                      onChange={e => setResponseMessage(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => handleRespond(req.id, 'ACCEPTED')} className="btn btn-success btn-sm gap-1">
                                        <CheckCircle className="w-4 h-4" /> Accept
                                      </button>
                                      <button onClick={() => handleRespond(req.id, 'DECLINED')} className="btn btn-error btn-sm btn-outline gap-1">
                                        <XCircle className="w-4 h-4" /> Decline
                                      </button>
                                      <button onClick={() => { setResponding(null); setResponseMessage('') }} className="btn btn-ghost btn-sm">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setResponding(req.id)} className="btn btn-primary btn-sm gap-1">
                                    <MessageSquare className="w-4 h-4" /> Respond
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  )
}
