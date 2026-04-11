import { useState, useEffect } from 'react'
import { Handshake, Search, Send, Users, Briefcase, Building2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { mentorshipApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { timeAgo } from '../../utils/formatters'
import type { Member, MentorshipRequest } from '../../types'

/* ─── Mentor Card ──────────────────────────────────────────── */

function MentorCard({ mentor, index, onRequest }: { mentor: Member; index: number; onRequest: () => void }) {
  return (
    <ScrollReveal delay={index * 0.04}>
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="card relative overflow-hidden bg-base-100 border border-base-300/60 shadow-[0_1px_4px_rgba(0,27,80,0.05)] hover:shadow-[0_12px_42px_rgba(0,27,80,0.08)] transition-all duration-300 h-full group"
      >
        {/* Top gradient accent */}
        <div className="h-1 bg-gradient-to-r from-primary via-accent/80 to-primary/50" />

        {/* Decorative corner blob */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-[48px] pointer-events-none" />

        <div className="p-5 flex flex-col flex-1">
          {/* Header: Avatar + Info */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="relative shrink-0">
              <Avatar src={mentor.photoUrl} name={mentor.fullName} size="lg" />
              {/* Online-style ring */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-secondary to-secondary/80 border-2 border-base-100 flex items-center justify-center">
                <Sparkles size={8} className="text-secondary-content" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-tight">{mentor.fullName}</h3>
              {mentor.occupation && (
                <p className="text-sm text-base-content/60 flex items-center gap-1.5 mt-0.5">
                  <Briefcase size={12} className="shrink-0 text-primary/40" />
                  <span className="truncate">{mentor.occupation}</span>
                </p>
              )}
              {mentor.organization && (
                <p className="text-xs text-base-content/45 flex items-center gap-1.5 mt-0.5">
                  <Building2 size={11} className="shrink-0 text-primary/30" />
                  <span className="truncate">{mentor.organization}</span>
                </p>
              )}
            </div>
          </div>

          {/* Expertise badges */}
          {mentor.areaOfExpertise.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {mentor.areaOfExpertise.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-primary/8 to-accent/5 text-primary/80 border border-primary/10"
                >
                  {area}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {mentor.mentorBio && (
            <p className="text-sm text-base-content/60 line-clamp-3 leading-relaxed">{mentor.mentorBio}</p>
          )}

          {/* Action */}
          <div className="mt-auto pt-3 border-t border-base-300/40">
            <button
              className="btn btn-primary btn-sm w-full gap-1.5"
              onClick={onRequest}
            >
              <Send className="w-3.5 h-3.5" /> Request Mentorship
            </button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      </motion.div>
    </ScrollReveal>
  )
}

/* ─── Request Card ─────────────────────────────────────────── */

function RequestCard({ req, type, onRespond }: { req: MentorshipRequest; type: 'outgoing' | 'incoming'; onRespond?: (id: string, status: 'ACCEPTED' | 'DECLINED') => void }) {
  const person = type === 'outgoing' ? req.mentor : req.mentee
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden bg-base-100 border border-base-300/60 shadow-[0_1px_4px_rgba(0,27,80,0.05)] hover:shadow-[0_6px_20px_rgba(0,27,80,0.06)] transition-all duration-300"
    >
      <div className="h-0.5 bg-gradient-to-r from-primary/30 via-accent/20 to-transparent" />
      <div className="p-4 flex items-center gap-4">
        <Avatar src={person?.photoUrl} name={person?.fullName || 'User'} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{person?.fullName}</p>
          <p className="text-xs text-base-content/50">
            {(person as any)?.occupation && <span>{(person as any).occupation} · </span>}
            {timeAgo(req.createdAt)}
          </p>
          {type === 'outgoing' && req.mentorResponse && (
            <p className="text-sm mt-1.5 italic text-base-content/60 bg-base-200/50 rounded-lg px-3 py-1.5">"{req.mentorResponse}"</p>
          )}
          {type === 'incoming' && req.message && (
            <p className="text-sm mt-1.5 italic text-base-content/60 bg-base-200/50 rounded-lg px-3 py-1.5">"{req.message}"</p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <StatusBadge status={req.status} />
          {type === 'incoming' && req.status === 'PENDING' && onRespond && (
            <div className="flex gap-1.5">
              <button className="btn btn-success btn-xs" onClick={() => onRespond(req.id, 'ACCEPTED')}>Accept</button>
              <button className="btn btn-ghost btn-xs" onClick={() => onRespond(req.id, 'DECLINED')}>Decline</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ────────────────────────────────────────────── */

export default function MentorshipPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<'mentors' | 'my-requests' | 'my-mentees'>('mentors')
  const [mentors, setMentors] = useState<Member[]>([])
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([])
  const [myMentees, setMyMentees] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMentor, setSelectedMentor] = useState<Member | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (tab === 'mentors') {
          const res = await mentorshipApi.mentors()
          const data = res.data.data
          setMentors(data || [])
        } else if (tab === 'my-requests') {
          const res = await mentorshipApi.myRequests()
          setMyRequests(res.data.data || [])
        } else {
          const res = await mentorshipApi.myMentees()
          setMyMentees(res.data.data || [])
        }
      } catch {
        if (tab === 'mentors') {
          setMentors([])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  const handleRequest = async () => {
    if (!selectedMentor) return
    setSubmitting(true)
    try {
      await mentorshipApi.request({ mentorId: selectedMentor.id, message })
      toast.success('Mentorship request sent!')
      setSelectedMentor(null)
      setMessage('')
    } catch {
      toast.error('Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  const [respondingTo, setRespondingTo] = useState<{ id: string; status: 'ACCEPTED' | 'DECLINED' } | null>(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [responding, setResponding] = useState(false)

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setRespondingTo({ id, status })
    setResponseMessage('')
  }

  const confirmRespond = async () => {
    if (!respondingTo) return
    setResponding(true)
    try {
      await mentorshipApi.respond(respondingTo.id, { status: respondingTo.status, mentorResponse: responseMessage || undefined })
      toast.success(`Request ${respondingTo.status.toLowerCase()}`)
      setMyMentees((prev) => prev.map((r) => r.id === respondingTo.id ? { ...r, status: respondingTo.status, mentorResponse: responseMessage } : r))
      setRespondingTo(null)
    } catch {
      toast.error('Failed to respond')
    } finally {
      setResponding(false)
    }
  }

  const filteredMentors = mentors.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.areaOfExpertise.some((a) => a.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageTransition>
      <PageHeader title="Mentorship" description="Connect with experienced alumni for guidance and growth" />

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button role="tab" className={`tab ${tab === 'mentors' ? 'tab-active' : ''}`} onClick={() => setTab('mentors')}>Find Mentors</button>
        <button role="tab" className={`tab ${tab === 'my-requests' ? 'tab-active' : ''}`} onClick={() => setTab('my-requests')}>My Requests</button>
        {user?.isAvailableAsMentor && (
          <button role="tab" className={`tab ${tab === 'my-mentees' ? 'tab-active' : ''}`} onClick={() => setTab('my-mentees')}>Mentee Requests</button>
        )}
      </div>

      {tab === 'mentors' && (
        <>
          <div className="relative max-w-xs mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
            <input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Search mentors..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : filteredMentors.length === 0 ? (
            <EmptyState icon={Users} title="No mentors found" description="Check back later or adjust your search" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMentors.map((mentor, i) => (
                <MentorCard key={mentor.id} mentor={mentor} index={i} onRequest={() => setSelectedMentor(mentor)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'my-requests' && (
        loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : myRequests.length === 0 ? (
          <EmptyState icon={Handshake} title="No requests yet" description="Find a mentor and send a request" />
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <RequestCard key={req.id} req={req} type="outgoing" />
            ))}
          </div>
        )
      )}

      {tab === 'my-mentees' && (
        loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : myMentees.length === 0 ? (
          <EmptyState icon={Users} title="No mentee requests" />
        ) : (
          <div className="space-y-3">
            {myMentees.map((req) => (
              <RequestCard key={req.id} req={req} type="incoming" onRespond={handleRespond} />
            ))}
          </div>
        )
      )}

      {/* Send request modal */}
      <Modal open={!!selectedMentor} onClose={() => setSelectedMentor(null)} title={`Request mentorship from ${selectedMentor?.fullName}`}>
        <div className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Message (optional)</span></label>
            <textarea className="textarea textarea-bordered h-24" placeholder="Tell them why you'd like their mentorship..." value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button className={`btn btn-primary w-full ${submitting ? 'loading' : ''}`} onClick={handleRequest} disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </Modal>

      {/* Respond to request modal */}
      <Modal open={!!respondingTo} onClose={() => setRespondingTo(null)} title={respondingTo?.status === 'ACCEPTED' ? 'Accept Mentorship Request' : 'Decline Mentorship Request'}>
        <div className="space-y-4">
          <p className="text-sm text-base-content/60">
            {respondingTo?.status === 'ACCEPTED'
              ? 'Add a welcome message for your mentee (optional).'
              : 'Let the requester know why you\'re declining (optional).'}
          </p>
          <div className="form-control">
            <label className="label"><span className="label-text">Your response (optional)</span></label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder={respondingTo?.status === 'ACCEPTED' ? "Looking forward to mentoring you..." : "Unfortunately I'm unable to take on new mentees at this time..."}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={() => setRespondingTo(null)}>Cancel</button>
            <button
              className={`btn flex-1 ${respondingTo?.status === 'ACCEPTED' ? 'btn-success' : 'btn-error'} ${responding ? 'loading' : ''}`}
              onClick={confirmRespond}
              disabled={responding}
            >
              {responding ? 'Submitting...' : respondingTo?.status === 'ACCEPTED' ? 'Accept' : 'Decline'}
            </button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}
