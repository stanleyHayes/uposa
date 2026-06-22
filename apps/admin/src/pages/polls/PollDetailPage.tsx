import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle,
  Clock,
  ListChecks,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import PageStats from '../../components/ui/PageStats'
import { Skeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminPollsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import { cn } from '../../utils/cn'
import type { PollOption } from '../../types'

const barColors = [
  'bg-brand-700',
  'bg-amber-500',
  'bg-brand-500',
  'bg-[#D4AF37]',
  'bg-brand-300',
  'bg-amber-600',
  'bg-brand-600',
  'bg-amber-400',
  'bg-brand-800',
  'bg-cream-500',
]

interface PollVoteRecord {
  id: string
  memberName: string
  selectedOptions: number[]
  createdAt?: string | null
}

interface PollDetail {
  id: string
  question: string
  description?: string | null
  options: PollOption[]
  allowMultiple: boolean
  status: string
  endsAt?: string | null
  totalVotes: number
  createdAt?: string | null
  updatedAt?: string | null
  createdBy?: { fullName?: string | null } | null
  votes: PollVoteRecord[]
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function toString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getBadgeVariant(status: string): 'active' | 'closed' | 'default' {
  if (status.toUpperCase() === 'ACTIVE') return 'active'
  if (status.toUpperCase() === 'CLOSED') return 'closed'
  return 'default'
}

function normalizePoll(raw: unknown): PollDetail | null {
  const record = toRecord(raw)
  if (!record) return null

  const id = toString(record.id, toString(record._id))
  const question = toString(record.question)
  if (!id || !question) return null

  const options = Array.isArray(record.options)
    ? record.options.map((option, index) => {
      const optionRecord = toRecord(option)
      return {
        id: toNumber(optionRecord?.id, index + 1),
        text: toString(optionRecord?.text, `Option ${index + 1}`),
        votes: toNumber(optionRecord?.votes),
      }
    })
    : []

  const countRecord = toRecord(record._count)
  const optionVoteTotal = options.reduce((sum, option) => sum + option.votes, 0)
  const totalVotes = toNumber(record.totalVotes, toNumber(countRecord?.votes, optionVoteTotal))

  const votes = Array.isArray(record.votes)
    ? record.votes.map((vote, index) => {
      const voteRecord = toRecord(vote)
      const member = toRecord(voteRecord?.member)
      const selectedOptions = Array.isArray(voteRecord?.selectedOptions)
        ? voteRecord.selectedOptions.map((option) => toNumber(option)).filter((option) => option > 0)
        : []

      return {
        id: toString(voteRecord?.id, toString(voteRecord?._id, `vote-${index}`)),
        memberName: toString(member?.fullName, 'Member'),
        selectedOptions,
        createdAt: toString(voteRecord?.createdAt, ''),
      }
    })
    : []

  const createdBy = toRecord(record.createdBy)

  return {
    id,
    question,
    description: toString(record.description, ''),
    options,
    allowMultiple: Boolean(record.allowMultiple),
    status: toString(record.status, 'ACTIVE'),
    endsAt: toString(record.endsAt, ''),
    totalVotes,
    createdAt: toString(record.createdAt, ''),
    updatedAt: toString(record.updatedAt, ''),
    createdBy: createdBy ? { fullName: toString(createdBy.fullName, '') } : null,
    votes,
  }
}

function PollDetailSkeleton() {
  return (
    <div className="page-enter space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-brand-950/10 pb-5 dark:border-dark-border">
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-[min(680px,72vw)]" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card-surface p-4">
            <Skeleton className="mb-3 h-10 w-10" />
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="admin-card-surface space-y-5 p-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="mb-2 flex items-center justify-between">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
        <div className="admin-card-surface p-6">
          <Skeleton className="mb-5 h-5 w-32" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function PollDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [poll, setPoll] = useState<PollDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(false)

  const fetchPoll = useCallback(async () => {
    if (!id) {
      setPoll(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await adminPollsApi.getResults(id)
      const nextPoll = normalizePoll((response.data as { data?: unknown }).data)
      setPoll(nextPoll)
    } catch {
      setPoll(null)
      toast.error('Poll not found')
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    fetchPoll()
  }, [fetchPoll])

  const optionVoteTotal = useMemo(
    () => poll?.options.reduce((sum, option) => sum + option.votes, 0) ?? 0,
    [poll],
  )

  const maxVotes = useMemo(
    () => Math.max(...(poll?.options.map((option) => option.votes) ?? []), 1),
    [poll],
  )

  const leadingOption = useMemo(() => {
    if (!poll || poll.options.length === 0 || optionVoteTotal === 0) return null
    return poll.options.reduce((leader, option) => (option.votes > leader.votes ? option : leader), poll.options[0])
  }, [optionVoteTotal, poll])

  const handleDelete = async () => {
    if (!poll || !currentUser) return

    try {
      await adminPollsApi.delete(poll.id)
      addActivity({
        action: 'deleted poll',
        targetType: poll.question,
        targetId: poll.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Poll deleted')
      navigate('/polls', { replace: true })
    } catch {
      toast.error('Failed to delete poll')
    }
  }

  if (loading) {
    return <PollDetailSkeleton />
  }

  if (!poll) {
    return (
      <div className="page-enter">
        <button
          onClick={() => navigate('/polls')}
          className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-brand-950/55 transition-colors hover:text-brand-700 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft size={16} />
          Back to Polls
        </button>
        <EmptyState
          icon={<BarChart3 size={40} />}
          title="Poll not found"
          description="This poll may have been deleted, moved, or is no longer available."
          action={<Button leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/polls')}>Back to Polls</Button>}
        />
      </div>
    )
  }

  const isClosed = poll.status.toUpperCase() === 'CLOSED'

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/polls')}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-brand-950/55 transition-colors hover:text-brand-700 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft size={16} />
        Back to Polls
      </button>

      <PageHeader
        title={poll.question}
        description={`${poll.allowMultiple ? 'Multiple choice' : 'Single choice'} · ${poll.endsAt ? `Ends ${formatDate(poll.endsAt)}` : 'No end date'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RoleGate permission="polls:edit">
              <Button variant="secondary" leftIcon={<Pencil size={15} />} onClick={() => navigate(`/polls/${poll.id}/edit`)}>
                Edit Poll
              </Button>
            </RoleGate>
            <RoleGate permission="polls:delete">
              <Button variant="danger" leftIcon={<Trash2 size={15} />} onClick={() => setDeleteTarget(true)}>
                Delete
              </Button>
            </RoleGate>
          </div>
        }
      />

      <PageStats
        stats={[
          { label: 'Selections', value: optionVoteTotal, icon: BarChart3, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Voters', value: poll.totalVotes, icon: Users, color: 'text-brand-600', bg: 'bg-cream-100', border: 'border-cream-300' },
          { label: 'Options', value: poll.options.length, icon: ListChecks, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Status', value: formatStatus(poll.status), icon: isClosed ? CheckCircle : Clock, color: isClosed ? 'text-gray-600' : 'text-green-600', bg: isClosed ? 'bg-gray-50' : 'bg-green-50', border: isClosed ? 'border-gray-200' : 'border-green-100' },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="admin-card-surface p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-brand-950/10 pb-5 dark:border-dark-border">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={getBadgeVariant(poll.status)} label={formatStatus(poll.status)} />
                <span className="border border-brand-950/10 bg-brand-950/[0.03] px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-brand-950/45 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-400">
                  {poll.allowMultiple ? 'Multiple choice' : 'Single choice'}
                </span>
              </div>
              {poll.description && (
                <p className="max-w-3xl text-sm leading-6 text-brand-950/60 dark:text-gray-400">{poll.description}</p>
              )}
            </div>
            {leadingOption && (
              <div className="min-w-44 border border-cream-500/30 bg-cream-500/15 p-4 text-right dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Leading</p>
                <p className="mt-1 line-clamp-1 font-black text-brand-950 dark:text-gray-100">{leadingOption.text}</p>
              </div>
            )}
          </div>

          {poll.options.length === 0 ? (
            <EmptyState
              icon={<ListChecks size={34} />}
              title="No options yet"
              description="Add options to this poll so results can be displayed."
            />
          ) : (
            <div className="space-y-5">
              {poll.options.map((option, index) => {
                const pct = optionVoteTotal > 0 ? Math.round((option.votes / optionVoteTotal) * 100) : 0
                const isWinner = isClosed && option.votes === maxVotes && option.votes > 0

                return (
                  <div key={option.id} className="border border-brand-950/10 bg-white/70 p-4 dark:border-dark-border dark:bg-dark-hover/40">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className={cn(
                          'font-bold leading-snug',
                          isWinner ? 'text-green-700 dark:text-green-400' : 'text-brand-950 dark:text-gray-100',
                        )}>
                          {option.text}
                        </p>
                        {isWinner && (
                          <span className="mt-1 inline-flex border border-green-500/15 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700 dark:text-green-400">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black tabular-nums text-brand-950 dark:text-gray-100">{pct}%</p>
                        <p className="text-xs font-semibold text-brand-950/45 dark:text-gray-500">{option.votes.toLocaleString()} votes</p>
                      </div>
                    </div>
                    <div className="h-3 overflow-hidden bg-brand-950/10 dark:bg-dark-card">
                      <div
                        className={cn('h-full transition-all duration-700 ease-out', barColors[index % barColors.length])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="admin-card-surface p-6">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-brand-950/55 dark:text-gray-400">
              Poll details
            </h2>
            <dl className="space-y-3">
              {[
                ['Created', poll.createdAt ? formatDate(poll.createdAt) : 'Unknown'],
                ['Updated', poll.updatedAt ? formatDate(poll.updatedAt) : 'Unknown'],
                ['Ends', poll.endsAt ? formatDate(poll.endsAt) : 'No end date'],
                ['Created by', poll.createdBy?.fullName || 'Secretariat'],
              ].map(([label, value]) => (
                <div key={label} className="border border-brand-950/10 bg-brand-950/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-brand-950/40 dark:text-gray-500">{label}</dt>
                  <dd className="mt-1 text-sm font-bold text-brand-950 dark:text-gray-100">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="admin-card-surface p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-brand-950/55 dark:text-gray-400">
                Recent voters
              </h2>
              <CalendarDays size={17} className="text-brand-950/35 dark:text-gray-500" />
            </div>

            {poll.votes.length === 0 ? (
              <p className="border border-brand-950/10 bg-brand-950/[0.03] p-4 text-sm leading-6 text-brand-950/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                No votes have been recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {poll.votes.slice(0, 6).map((vote) => (
                  <div key={vote.id} className="border border-brand-950/10 bg-brand-950/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-bold text-brand-950 dark:text-gray-100">{vote.memberName}</p>
                    <p className="mt-1 text-xs text-brand-950/45 dark:text-gray-500">
                      {vote.createdAt ? formatDate(vote.createdAt) : 'Recently'}
                      {' · '}
                      {vote.selectedOptions.length} selection{vote.selectedOptions.length === 1 ? '' : 's'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteTarget}
        onClose={() => setDeleteTarget(false)}
        onConfirm={handleDelete}
        title="Delete Poll"
        message="Are you sure you want to delete this poll? All votes will be lost."
        confirmLabel="Delete"
      />
    </div>
  )
}
