import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Handshake,
  Inbox,
  Search,
  Send,
  Sparkles,
  UserRound,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import { mentorshipApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { timeAgo } from '../../utils/formatters'
import type { Member, MentorshipRequest } from '../../types'

type MentorshipTab = 'mentors' | 'my-requests' | 'my-mentees'
type RequestPerson = NonNullable<MentorshipRequest['mentor'] | MentorshipRequest['mentee']> & {
  occupation?: string
  organization?: string
}

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

function TabButton({
  active,
  icon: Icon,
  label,
  count,
  helper,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  count: number
  helper: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`flex min-h-20 items-center gap-3 border p-3 text-left transition-all rounded-[20px_4px_20px_4px] ${
        active ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
      }`}
      onClick={onClick}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[15px_3px_15px_3px] ${active ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-bold">{label}</span>
          <span className="text-xs font-bold text-base-content/38">{count}</span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-base-content/50">{helper}</span>
      </span>
    </button>
  )
}

function MentorCard({ mentor, onRequest }: { mentor: Member; onRequest: () => void }) {
  const expertise = mentor.areaOfExpertise || []

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_22px_55px_rgba(0,27,80,0.11)] rounded-[24px_4px_24px_4px]">
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar src={mentor.photoUrl} name={mentor.fullName} size="lg" />
            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center border-2 border-base-100 bg-secondary text-primary rounded-[8px_2px_8px_2px]">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-lg font-bold leading-tight text-base-content">{mentor.fullName}</h2>
            {mentor.occupation && (
              <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-base-content/55">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary/45" />
                <span className="truncate">{mentor.occupation}</span>
              </p>
            )}
            {mentor.organization && (
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-base-content/38">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/35" />
                <span className="truncate">{mentor.organization}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex min-h-16 flex-wrap content-start gap-1.5">
          {expertise.length > 0 ? (
            expertise.slice(0, 5).map((area) => (
              <span key={area} className="border border-primary/10 bg-primary/7 px-2.5 py-1 text-xs font-bold text-primary rounded-[10px_2px_10px_2px]">
                {area}
              </span>
            ))
          ) : (
            <span className="text-sm leading-relaxed text-base-content/45">Expertise areas not listed yet.</span>
          )}
        </div>

        <p className="mt-4 line-clamp-4 min-h-20 text-sm leading-relaxed text-base-content/58">
          {mentor.mentorBio || 'Available for alumni guidance, career direction, and practical next-step conversations.'}
        </p>

        <div className="mt-auto pt-5">
          <button type="button" className="btn btn-primary min-h-11 w-full gap-2" onClick={onRequest}>
            Request mentorship
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function RequestCard({
  req,
  type,
  onRespond,
}: {
  req: MentorshipRequest
  type: 'outgoing' | 'incoming'
  onRespond?: (id: string, status: 'ACCEPTED' | 'DECLINED') => void
}) {
  const person = (type === 'outgoing' ? req.mentor : req.mentee) as RequestPerson | undefined
  const message = type === 'outgoing' ? req.mentorResponse : req.message
  const messageLabel = type === 'outgoing' ? 'Mentor response' : 'Request message'

  return (
    <article className="grid gap-4 border border-primary/10 bg-base-100/88 p-4 shadow-[0_10px_28px_rgba(0,27,80,0.04)] sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-start rounded-[22px_4px_22px_4px]">
      <Avatar src={person?.photoUrl} name={person?.fullName || 'User'} size="md" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">{person?.fullName || 'Unknown member'}</h3>
          <StatusBadge status={req.status} />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-base-content/52">
          {person?.occupation ? `${person.occupation}${person.organization ? ` at ${person.organization}` : ''} · ` : ''}
          {timeAgo(req.createdAt)}
        </p>
        {message && (
          <div className="mt-3 border border-primary/8 bg-base-200/45 p-3 rounded-[16px_3px_16px_3px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">{messageLabel}</p>
            <p className="mt-1 text-sm leading-relaxed text-base-content/64">{message}</p>
          </div>
        )}
      </div>
      {type === 'incoming' && req.status === 'PENDING' && onRespond && (
        <div className="grid min-w-36 gap-2 sm:justify-end">
          <button type="button" className="btn btn-success btn-sm min-h-10" onClick={() => onRespond(req.id, 'ACCEPTED')}>
            <CheckCircle2 className="h-4 w-4" />
            Accept
          </button>
          <button type="button" className="btn btn-outline btn-error btn-sm min-h-10" onClick={() => onRespond(req.id, 'DECLINED')}>
            <XCircle className="h-4 w-4" />
            Decline
          </button>
        </div>
      )}
    </article>
  )
}

function MentorshipSkeleton({ mode }: { mode: 'grid' | 'list' }) {
  if (mode === 'list') {
    return (
      <div className="grid gap-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="grid gap-4 border border-primary/8 bg-base-100/84 p-4 sm:grid-cols-[52px_minmax(0,1fr)_120px] sm:items-start rounded-[22px_4px_22px_4px]">
            <div className="h-12 w-12 animate-pulse bg-base-300/45 rounded-[16px_3px_16px_3px]" />
            <div className="space-y-2 py-1">
              <div className="h-4 w-48 max-w-full animate-pulse bg-base-300/55" />
              <div className="h-3 w-64 max-w-full animate-pulse bg-base-300/35" />
              <div className="h-12 w-full animate-pulse bg-base-300/30 rounded-[14px_3px_14px_3px]" />
            </div>
            <div className="h-10 w-24 animate-pulse bg-base-300/35" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="border border-primary/8 bg-base-100/84 p-5 rounded-[24px_4px_24px_4px]">
          <div className="flex gap-4">
            <div className="h-14 w-14 animate-pulse bg-base-300/45 rounded-[18px_4px_18px_4px]" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-4/5 animate-pulse bg-base-300/55" />
              <div className="h-3 w-3/5 animate-pulse bg-base-300/35" />
            </div>
          </div>
          <div className="mt-5 h-14 animate-pulse bg-base-300/30" />
          <div className="mt-4 h-20 animate-pulse bg-base-300/25" />
          <div className="mt-5 h-11 animate-pulse bg-base-300/40" />
        </div>
      ))}
    </div>
  )
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export default function MentorshipPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [tab, setTab] = useState<MentorshipTab>('mentors')
  const [mentors, setMentors] = useState<Member[]>([])
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([])
  const [myMentees, setMyMentees] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMentor, setSelectedMentor] = useState<Member | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [respondingTo, setRespondingTo] = useState<{ id: string; status: 'ACCEPTED' | 'DECLINED' } | null>(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [responding, setResponding] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const requests = [
      mentorshipApi.mentors(),
      mentorshipApi.myRequests(),
      user?.isAvailableAsMentor ? mentorshipApi.myMentees() : Promise.resolve({ data: { data: [] } }),
    ] as const

    const [mentorsRes, requestsRes, menteesRes] = await Promise.allSettled(requests)
    setMentors(mentorsRes.status === 'fulfilled' ? mentorsRes.value.data.data || [] : [])
    setMyRequests(requestsRes.status === 'fulfilled' ? requestsRes.value.data.data || [] : [])
    setMyMentees(menteesRes.status === 'fulfilled' ? menteesRes.value.data.data || [] : [])
    setLoading(false)
  }, [user?.isAvailableAsMentor])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredMentors = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return mentors
    return mentors.filter((mentor) =>
      mentor.fullName.toLowerCase().includes(query)
      || mentor.occupation?.toLowerCase().includes(query)
      || mentor.organization?.toLowerCase().includes(query)
      || mentor.areaOfExpertise.some((area) => area.toLowerCase().includes(query))
    )
  }, [mentors, search])

  const pendingSent = myRequests.filter((request) => request.status === 'PENDING').length
  const pendingIncoming = myMentees.filter((request) => request.status === 'PENDING').length
  const acceptedRequests = [...myRequests, ...myMentees].filter((request) => request.status === 'ACCEPTED').length

  const handleRequest = async () => {
    if (!selectedMentor) return
    setSubmitting(true)
    try {
      await mentorshipApi.request({ mentorId: selectedMentor.id, message: message.trim() || undefined })
      toast.success('Mentorship request sent!')
      setSelectedMentor(null)
      setMessage('')
      const res = await mentorshipApi.myRequests()
      setMyRequests(res.data.data || [])
    } catch {
      toast.error('Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRespond = (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setRespondingTo({ id, status })
    setResponseMessage('')
  }

  const confirmRespond = async () => {
    if (!respondingTo) return
    setResponding(true)
    try {
      await mentorshipApi.respond(respondingTo.id, { status: respondingTo.status, mentorResponse: responseMessage.trim() || undefined })
      toast.success(`Request ${respondingTo.status.toLowerCase()}`)
      setMyMentees((prev) => prev.map((request) => (
        request.id === respondingTo.id ? { ...request, status: respondingTo.status, mentorResponse: responseMessage } : request
      )))
      setRespondingTo(null)
    } catch {
      toast.error('Failed to respond')
    } finally {
      setResponding(false)
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
                Mentorship desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Find guidance without leaving the alumni network.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Discover available mentors, track your requests, and respond to mentees from one practical desk.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn btn-secondary min-h-12 px-5 text-primary" onClick={() => setTab('mentors')}>
                  <Handshake className="h-4 w-4" />
                  Find a mentor
                  <ArrowRight className="h-4 w-4" />
                </button>
                {!user?.isAvailableAsMentor && (
                  <Link to="/profile" className="btn min-h-12 border-primary-content/15 bg-primary-content/10 px-5 text-primary-content hover:bg-primary-content/15">
                    <UserRound className="h-4 w-4" />
                    Become a mentor
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={Users} label="Mentors" value={mentors.length} detail="Available alumni" />
              <StatTile icon={Send} label="Sent" value={myRequests.length} detail={`${pendingSent} pending`} tone="bg-secondary/18 text-primary" />
              <StatTile icon={Inbox} label="Received" value={myMentees.length} detail={`${pendingIncoming} pending`} />
              <StatTile icon={CheckCircle2} label="Accepted" value={acceptedRequests} detail="Active matches" tone="bg-success/12 text-success" />
            </div>
          </div>
        </section>

        <section className="relative z-10 grid gap-3 lg:grid-cols-3">
          <TabButton active={tab === 'mentors'} icon={Handshake} label="Find mentors" count={mentors.length} helper="Search available alumni guides" onClick={() => setTab('mentors')} />
          <TabButton active={tab === 'my-requests'} icon={Send} label="My requests" count={myRequests.length} helper="Track requests you have sent" onClick={() => setTab('my-requests')} />
          {user?.isAvailableAsMentor ? (
            <TabButton active={tab === 'my-mentees'} icon={Inbox} label="Mentee requests" count={myMentees.length} helper="Respond to alumni seeking guidance" onClick={() => setTab('my-mentees')} />
          ) : (
            <Link to="/profile" className="flex min-h-20 items-center gap-3 border border-primary/10 bg-base-100 p-3 text-left transition-all hover:border-primary/20 rounded-[20px_4px_20px_4px]">
              <span className="grid h-11 w-11 shrink-0 place-items-center bg-secondary/15 text-primary rounded-[15px_3px_15px_3px]">
                <UserRound className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">Mentor availability</span>
                <span className="mt-1 block text-xs leading-relaxed text-base-content/50">Switch this on from your profile.</span>
              </span>
            </Link>
          )}
        </section>

        {tab === 'mentors' && (
          <section className="relative z-10 border border-primary/10 bg-base-100/88 p-4 shadow-[0_12px_34px_rgba(0,27,80,0.05)] rounded-[24px_4px_24px_4px]">
            <label className="relative block max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
              <input
                type="text"
                className="input input-bordered h-12 w-full border-primary/10 bg-base-100 pl-11 text-sm focus:border-primary"
                placeholder="Search by name, work, organization, or expertise..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </section>
        )}

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
                {tab === 'mentors' ? 'Mentor directory' : tab === 'my-requests' ? 'Request tracker' : 'Mentee desk'}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {tab === 'mentors' ? 'Available mentors' : tab === 'my-requests' ? 'Requests you sent' : 'Requests from mentees'}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              {tab === 'mentors'
                ? 'Choose someone whose experience matches the kind of guidance you need.'
                : tab === 'my-requests'
                  ? 'Accepted, declined, and pending mentorship conversations stay visible here.'
                  : 'Reply quickly so mentees know whether you can take them on.'}
            </p>
          </div>

          {loading ? (
            <MentorshipSkeleton mode={tab === 'mentors' ? 'grid' : 'list'} />
          ) : tab === 'mentors' ? (
            filteredMentors.length === 0 ? (
              <EmptyPanel
                icon={Users}
                title="No mentors found"
                description={search ? 'Try a different search term or clear the field.' : 'Mentor profiles will appear here when alumni opt in from their profile.'}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredMentors.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} onRequest={() => setSelectedMentor(mentor)} />
                ))}
              </div>
            )
          ) : tab === 'my-requests' ? (
            myRequests.length === 0 ? (
              <EmptyPanel
                icon={Handshake}
                title="No requests yet"
                description="Find a mentor and send a short request when you are ready."
                action={<button type="button" className="btn btn-primary min-h-11" onClick={() => setTab('mentors')}>Find mentors</button>}
              />
            ) : (
              <div className="grid gap-3">
                {myRequests.map((request) => (
                  <RequestCard key={request.id} req={request} type="outgoing" />
                ))}
              </div>
            )
          ) : myMentees.length === 0 ? (
            <EmptyPanel icon={Inbox} title="No mentee requests" description="Requests from alumni who want your guidance will appear here." />
          ) : (
            <div className="grid gap-3">
              {myMentees.map((request) => (
                <RequestCard key={request.id} req={request} type="incoming" onRespond={handleRespond} />
              ))}
            </div>
          )}
        </section>

        <Modal open={!!selectedMentor} onClose={() => setSelectedMentor(null)} title={`Request ${selectedMentor?.fullName || 'Mentor'}`}>
          <div className="space-y-5">
            {selectedMentor && (
              <div className="flex items-center gap-3 border border-primary/10 bg-base-200/45 p-4 rounded-[18px_4px_18px_4px]">
                <Avatar src={selectedMentor.photoUrl} name={selectedMentor.fullName} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-bold">{selectedMentor.fullName}</p>
                  <p className="truncate text-sm text-base-content/52">{selectedMentor.occupation || selectedMentor.organization || 'Available mentor'}</p>
                </div>
              </div>
            )}
            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Message</span></span>
              <textarea
                className="textarea textarea-bordered min-h-28 border-primary/10 bg-base-100 focus:border-primary"
                placeholder="Tell them what kind of guidance you are looking for..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <button type="button" className="btn btn-primary min-h-12 w-full gap-2 text-base" onClick={handleRequest} disabled={submitting}>
              {submitting ? (
                <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
              ) : (
                <>
                  Send request
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </Modal>

        <Modal open={!!respondingTo} onClose={() => setRespondingTo(null)} title={respondingTo?.status === 'ACCEPTED' ? 'Accept Request' : 'Decline Request'}>
          <div className="space-y-5">
            <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-200/45 p-4">
              <p className="text-sm font-bold text-base-content">
                {respondingTo?.status === 'ACCEPTED' ? 'Add a welcome message if useful.' : 'A short decline note is optional.'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-base-content/52">Your response will be attached to this mentorship request.</p>
            </div>
            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Your response</span></span>
              <textarea
                className="textarea textarea-bordered min-h-28 border-primary/10 bg-base-100 focus:border-primary"
                placeholder={respondingTo?.status === 'ACCEPTED' ? 'Looking forward to mentoring you...' : 'Unfortunately I am unable to take on new mentees right now...'}
                value={responseMessage}
                onChange={(event) => setResponseMessage(event.target.value)}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <button type="button" className="btn min-h-12 border-primary/10 bg-base-200 text-primary hover:bg-base-300" onClick={() => setRespondingTo(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn min-h-12 min-w-36 gap-2 ${respondingTo?.status === 'ACCEPTED' ? 'btn-success' : 'btn-error'}`}
                onClick={confirmRespond}
                disabled={responding}
              >
                {responding ? (
                  <span className="h-4 w-24 animate-pulse bg-primary-content/35" />
                ) : respondingTo?.status === 'ACCEPTED' ? (
                  <>
                    Accept
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Decline
                    <XCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  )
}
