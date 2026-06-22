import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Handshake,
  Inbox,
  MessageSquare,
  Send,
  Sparkles,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import { mentorshipApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { timeAgo } from '../../utils/formatters'
import type { MentorshipRequest } from '../../types'

type RequestTab = 'received' | 'sent'
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

function RequestsSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="border border-primary/8 bg-base-100/84 p-4 rounded-[22px_4px_22px_4px]">
          <div className="flex gap-4">
            <div className="h-12 w-12 animate-pulse bg-base-300/45 rounded-[16px_3px_16px_3px]" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-52 max-w-full animate-pulse bg-base-300/55" />
              <div className="h-3 w-72 max-w-full animate-pulse bg-base-300/35" />
              <div className="h-14 w-full animate-pulse bg-base-300/30 rounded-[14px_3px_14px_3px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyRequests({ tab }: { tab: RequestTab }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        {tab === 'received' ? <Inbox className="h-7 w-7" /> : <Send className="h-7 w-7" />}
      </span>
      <h2 className="mt-5 text-xl font-bold">No {tab} requests</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {tab === 'received'
          ? 'Requests from alumni who want your guidance will appear here.'
          : 'Mentorship requests you send will appear here.'}
      </p>
      {tab === 'sent' && (
        <Link to="/mentorship" className="btn btn-primary mt-6 min-h-11">
          Find mentors
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function RequestRow({
  request,
  tab,
  responding,
  responseMessage,
  onStartResponding,
  onCancelResponding,
  onResponseChange,
  onSubmitResponse,
}: {
  request: MentorshipRequest
  tab: RequestTab
  responding: boolean
  responseMessage: string
  onStartResponding: () => void
  onCancelResponding: () => void
  onResponseChange: (value: string) => void
  onSubmitResponse: (status: 'ACCEPTED' | 'DECLINED') => void
}) {
  const person = (tab === 'received' ? request.mentee : request.mentor) as RequestPerson | undefined

  return (
    <article className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_10px_28px_rgba(0,27,80,0.04)] rounded-[22px_4px_22px_4px]">
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
      <div className="p-4">
        <div className="grid gap-4 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-start">
          <Avatar src={person?.photoUrl} name={person?.fullName || 'User'} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">{person?.fullName || 'Unknown member'}</h3>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-base-content/52">
              {person?.occupation ? `${person.occupation}${person.organization ? ` at ${person.organization}` : ''} · ` : ''}
              {timeAgo(request.createdAt)}
            </p>
          </div>
          {tab === 'received' && request.status === 'PENDING' && !responding && (
            <button type="button" className="btn btn-primary btn-sm min-h-10" onClick={onStartResponding}>
              <MessageSquare className="h-4 w-4" />
              Respond
            </button>
          )}
        </div>

        {request.message && (
          <div className="mt-4 border border-primary/8 bg-base-200/45 p-3 rounded-[16px_3px_16px_3px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">Request message</p>
            <p className="mt-1 text-sm leading-relaxed text-base-content/64">{request.message}</p>
          </div>
        )}
        {request.mentorResponse && (
          <div className="mt-3 border border-primary/10 bg-primary/5 p-3 rounded-[16px_3px_16px_3px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Mentor response</p>
            <p className="mt-1 text-sm leading-relaxed text-base-content/64">{request.mentorResponse}</p>
          </div>
        )}

        {responding && (
          <div className="mt-4 space-y-3 border-t border-primary/8 pt-4">
            <textarea
              className="textarea textarea-bordered min-h-24 w-full border-primary/10 bg-base-100 focus:border-primary"
              placeholder="Optional message to the mentee..."
              value={responseMessage}
              onChange={(event) => onResponseChange(event.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-success btn-sm min-h-10" onClick={() => onSubmitResponse('ACCEPTED')}>
                <CheckCircle2 className="h-4 w-4" />
                Accept
              </button>
              <button type="button" className="btn btn-outline btn-error btn-sm min-h-10" onClick={() => onSubmitResponse('DECLINED')}>
                <XCircle className="h-4 w-4" />
                Decline
              </button>
              <button type="button" className="btn btn-sm min-h-10 border-primary/10 bg-base-200 text-primary hover:bg-base-300" onClick={onCancelResponding}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default function MyRequestsPage() {
  const toast = useToast()
  const [tab, setTab] = useState<RequestTab>('received')
  const [received, setReceived] = useState<MentorshipRequest[]>([])
  const [sent, setSent] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [menteeRes, sentRes] = await Promise.allSettled([
      mentorshipApi.myMentees(),
      mentorshipApi.myRequests(),
    ])
    setReceived(menteeRes.status === 'fulfilled' ? menteeRes.value.data.data || [] : [])
    setSent(sentRes.status === 'fulfilled' ? sentRes.value.data.data || [] : [])
    if (menteeRes.status === 'rejected' && sentRes.status === 'rejected') {
      toast.error('Failed to load mentorship requests')
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setSubmittingResponse(true)
    try {
      await mentorshipApi.respond(id, { status, mentorResponse: responseMessage.trim() || undefined })
      toast.success(`Request ${status.toLowerCase()}`)
      setRespondingTo(null)
      setResponseMessage('')
      await fetchData()
    } catch {
      toast.error('Failed to respond')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const requests = tab === 'received' ? received : sent
  const pendingReceived = received.filter((request) => request.status === 'PENDING').length
  const pendingSent = sent.filter((request) => request.status === 'PENDING').length
  const acceptedTotal = useMemo(() => [...received, ...sent].filter((request) => request.status === 'ACCEPTED').length, [received, sent])

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <Link to="/mentorship" className="btn min-h-10 border-primary/10 bg-base-100 text-primary hover:bg-base-200 rounded-[14px_3px_14px_3px]">
          <ArrowLeft className="h-4 w-4" />
          Back to mentorship
        </Link>

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Request tracker
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Keep every mentorship conversation easy to follow.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Review sent requests, respond to mentees, and keep accepted connections visible.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={Inbox} label="Received" value={received.length} detail={`${pendingReceived} pending`} />
              <StatTile icon={Send} label="Sent" value={sent.length} detail={`${pendingSent} pending`} tone="bg-secondary/18 text-primary" />
              <StatTile icon={CheckCircle2} label="Accepted" value={acceptedTotal} detail="Active matches" tone="bg-success/12 text-success" />
              <StatTile icon={Clock} label="Current view" value={requests.length} detail={tab === 'received' ? 'Received requests' : 'Sent requests'} />
            </div>
          </div>
        </section>

        <section className="relative z-10 grid gap-3 sm:grid-cols-2">
          <TabButton active={tab === 'received'} icon={Inbox} label="Received" count={received.length} helper="Requests from mentees" onClick={() => setTab('received')} />
          <TabButton active={tab === 'sent'} icon={MessageSquare} label="Sent" count={sent.length} helper="Your requests to mentors" onClick={() => setTab('sent')} />
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
                {tab === 'received' ? 'Mentee desk' : 'Sent requests'}
              </p>
              <h2 className="mt-1 text-2xl font-bold">{tab === 'received' ? 'Requests from mentees' : 'Requests you sent'}</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              {tab === 'received'
                ? 'Respond to pending requests with a short note when needed.'
                : 'Track whether mentors have accepted, declined, or replied.'}
            </p>
          </div>

          {loading ? (
            <RequestsSkeleton />
          ) : requests.length === 0 ? (
            <EmptyRequests tab={tab} />
          ) : (
            <div className="grid gap-3">
              {requests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  tab={tab}
                  responding={respondingTo === request.id}
                  responseMessage={respondingTo === request.id ? responseMessage : ''}
                  onStartResponding={() => {
                    setRespondingTo(request.id)
                    setResponseMessage('')
                  }}
                  onCancelResponding={() => {
                    setRespondingTo(null)
                    setResponseMessage('')
                  }}
                  onResponseChange={setResponseMessage}
                  onSubmitResponse={(status) => {
                    if (!submittingResponse) handleRespond(request.id, status)
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="relative z-10 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.38fr)]">
          <div className="overflow-hidden border border-primary/10 bg-base-100/86 p-5 shadow-[0_12px_34px_rgba(0,27,80,0.05)] rounded-[24px_4px_24px_4px]">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center bg-secondary/15 text-primary rounded-[16px_3px_16px_3px]">
                <Handshake className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Mentorship rhythm</p>
                <h2 className="mt-2 text-xl font-bold">Short, clear replies keep the network useful.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-base-content/55">
                  Accept when you can commit time. Decline kindly when you cannot. Either way, the requester gets clarity.
                </p>
              </div>
            </div>
          </div>
          <Link to="/mentorship" className="btn btn-secondary min-h-full w-full justify-between px-5 text-primary rounded-[24px_4px_24px_4px]">
            <span className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Need a mentor?</span>
              <span className="mt-2 block text-lg font-bold">Find mentors</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </Link>
        </section>
      </div>
    </PageTransition>
  )
}
