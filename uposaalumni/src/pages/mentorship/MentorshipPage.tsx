import { useState, useEffect } from 'react'
import { Handshake, Search, Send, Users } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { mentorshipApi } from '../../api/services'
import { MOCK_MEMBERS } from '../../data/mock'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { timeAgo } from '../../utils/formatters'
import type { Member, MentorshipRequest } from '../../types'

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
          setMentors(data?.length ? data : MOCK_MEMBERS.filter((m) => m.isAvailableAsMentor))
        } else if (tab === 'my-requests') {
          const res = await mentorshipApi.myRequests()
          setMyRequests(res.data.data || [])
        } else {
          const res = await mentorshipApi.myMentees()
          setMyMentees(res.data.data || [])
        }
      } catch {
        if (tab === 'mentors') {
          setMentors(MOCK_MEMBERS.filter((m) => m.isAvailableAsMentor))
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

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await mentorshipApi.respond(id, { status })
      toast.success(`Request ${status.toLowerCase()}`)
      setMyMentees((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    } catch {
      toast.error('Failed to respond')
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map((mentor, i) => (
                <ScrollReveal key={mentor.id} delay={i * 0.05}>
                  <div className="card bg-base-100 border border-base-300 h-full">
                    <div className="card-body">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar src={mentor.photoUrl} name={mentor.fullName} size="lg" />
                        <div>
                          <h3 className="font-semibold">{mentor.fullName}</h3>
                          {mentor.occupation && <p className="text-sm text-base-content/60">{mentor.occupation}</p>}
                          {mentor.organization && <p className="text-xs text-base-content/50">{mentor.organization}</p>}
                        </div>
                      </div>
                      {mentor.areaOfExpertise.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {mentor.areaOfExpertise.map((area) => (
                            <span key={area} className="badge badge-outline badge-xs">{area}</span>
                          ))}
                        </div>
                      )}
                      {mentor.mentorBio && <p className="text-sm text-base-content/70 line-clamp-3">{mentor.mentorBio}</p>}
                      <div className="card-actions mt-auto pt-3">
                        <button className="btn btn-primary btn-sm w-full" onClick={() => setSelectedMentor(mentor)}>
                          <Send className="w-3 h-3" /> Request Mentorship
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
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
              <div key={req.id} className="card bg-base-100 border border-base-300">
                <div className="card-body p-4 flex-row items-center gap-4">
                  <Avatar src={req.mentor?.photoUrl} name={req.mentor?.fullName || 'Mentor'} size="md" />
                  <div className="flex-1">
                    <p className="font-medium">{req.mentor?.fullName}</p>
                    <p className="text-xs text-base-content/60">{req.mentor?.occupation} · {timeAgo(req.createdAt)}</p>
                    {req.mentorResponse && <p className="text-sm mt-1 italic">"{req.mentorResponse}"</p>}
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </div>
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
              <div key={req.id} className="card bg-base-100 border border-base-300">
                <div className="card-body p-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={req.mentee?.photoUrl} name={req.mentee?.fullName || 'Mentee'} size="md" />
                    <div className="flex-1">
                      <p className="font-medium">{req.mentee?.fullName}</p>
                      <p className="text-xs text-base-content/60">{timeAgo(req.createdAt)}</p>
                      {req.message && <p className="text-sm mt-1">"{req.message}"</p>}
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3 justify-end">
                      <button className="btn btn-success btn-sm" onClick={() => handleRespond(req.id, 'ACCEPTED')}>Accept</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRespond(req.id, 'DECLINED')}>Decline</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

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
    </PageTransition>
  )
}
