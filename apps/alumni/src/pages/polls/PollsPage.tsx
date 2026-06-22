import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ListChecks,
  RadioTower,
  Sparkles,
  Users,
  Vote,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import StatusBadge from '../../components/ui/StatusBadge'
import { pollsApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { useSocketEvent } from '../../hooks/useSocket'
import { formatDate } from '../../utils/formatters'
import type { Poll } from '../../types'

type PollFilter = 'all' | 'active' | 'closed'

const filters: Array<{ key: PollFilter; label: string; icon: LucideIcon }> = [
  { key: 'all', label: 'All polls', icon: BarChart3 },
  { key: 'active', label: 'Active', icon: RadioTower },
  { key: 'closed', label: 'Closed', icon: CheckCircle2 },
]

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

function PollsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse bg-base-300/40 rounded-[18px_4px_18px_4px]" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="border border-primary/8 bg-base-100/84 p-5 rounded-[24px_4px_24px_4px]">
            <div className="flex items-start justify-between gap-4">
              <div className="h-10 w-24 animate-pulse bg-base-300/35" />
              <div className="h-8 w-20 animate-pulse bg-base-300/35" />
            </div>
            <div className="mt-5 h-6 w-4/5 animate-pulse bg-base-300/55" />
            <div className="mt-3 h-3 w-full animate-pulse bg-base-300/35" />
            <div className="mt-6 space-y-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-12 animate-pulse bg-base-300/30 rounded-[16px_3px_16px_3px]" />
              ))}
            </div>
            <div className="mt-5 h-11 animate-pulse bg-base-300/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyPolls({ filter }: { filter: PollFilter }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <BarChart3 className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No polls found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {filter === 'active'
          ? 'Active polls will appear here when the association opens a vote.'
          : filter === 'closed'
            ? 'Closed polls will appear here after voting windows end.'
            : 'Association polls will appear here when they are published.'}
      </p>
    </div>
  )
}

function ResultOption({
  text,
  selected,
  votes,
  percentage,
}: {
  text: string
  selected: boolean
  votes: number
  percentage: number
}) {
  return (
    <div className="overflow-hidden border border-primary/10 bg-base-100 rounded-[18px_4px_18px_4px]">
      <div className="relative min-h-14 p-3">
        <div className="absolute inset-y-0 left-0 bg-primary/8 transition-all" style={{ width: `${percentage}%` }} />
        <div className="relative flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-base-content">
            {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
            <span className="truncate">{text}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-bold text-primary">{percentage.toFixed(0)}%</span>
            <span className="text-[11px] font-semibold text-base-content/42">{votes} vote{votes === 1 ? '' : 's'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function ChoiceOption({
  type,
  name,
  text,
  checked,
  onChange,
}: {
  type: 'checkbox' | 'radio'
  name: string
  text: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className={`flex min-h-14 cursor-pointer items-center gap-3 border p-3 transition-all rounded-[18px_4px_18px_4px] ${
      checked ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
    }`}>
      <input
        type={type}
        name={name}
        className={type === 'checkbox' ? 'checkbox checkbox-primary checkbox-sm' : 'radio radio-primary radio-sm'}
        checked={checked}
        onChange={onChange}
      />
      <span className="text-sm font-bold text-base-content">{text}</span>
    </label>
  )
}

function PollCard({
  poll,
  selected,
  voting,
  onSelect,
  onVote,
}: {
  poll: Poll
  selected: number[]
  voting: boolean
  onSelect: (pollId: string, optionId: number, allowMultiple: boolean) => void
  onVote: (pollId: string) => void
}) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0)
  const hasVoted = Boolean(poll.hasVoted)
  const showResults = hasVoted || poll.status === 'CLOSED'
  const selectedIds = selected.length > 0 ? selected : poll.myVote || []

  return (
    <article className="flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className={`h-1 ${poll.status === 'ACTIVE' ? 'bg-secondary' : 'bg-primary'}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={poll.status} />
          {poll.endsAt && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-base-content/45">
              <Clock className="h-3.5 w-3.5" />
              Ends {formatDate(poll.endsAt)}
            </span>
          )}
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            {poll.allowMultiple && (
              <span className="inline-flex items-center gap-1.5 bg-secondary/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                <ListChecks className="h-3.5 w-3.5" />
                Multiple choice
              </span>
            )}
          </div>
          <h2 className="mt-3 text-xl font-bold leading-tight text-base-content">{poll.question}</h2>
          {poll.description && (
            <p className="mt-3 text-sm leading-relaxed text-base-content/58">{poll.description}</p>
          )}
        </div>

        <div className="mt-5 grid gap-2">
          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
            const isSelected = selectedIds.includes(option.id)

            return showResults ? (
              <ResultOption
                key={option.id}
                text={option.text}
                selected={isSelected}
                votes={option.votes}
                percentage={percentage}
              />
            ) : (
              <ChoiceOption
                key={option.id}
                type={poll.allowMultiple ? 'checkbox' : 'radio'}
                name={`poll-${poll.id}`}
                text={option.text}
                checked={isSelected}
                onChange={() => onSelect(poll.id, option.id, poll.allowMultiple)}
              />
            )
          })}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-5">
          {showResults ? (
            <div className="flex min-h-11 items-center justify-between gap-3 border border-primary/10 bg-base-200/45 px-4 py-3 text-sm font-bold text-base-content/58 rounded-[16px_3px_16px_3px]">
              <span>{totalVotes} total vote{totalVotes === 1 ? '' : 's'}</span>
              {hasVoted && <span className="text-primary">You voted</span>}
            </div>
          ) : poll.status === 'ACTIVE' ? (
            <button
              type="button"
              className="btn btn-primary min-h-11 w-full gap-2"
              onClick={() => onVote(poll.id)}
              disabled={voting}
            >
              {voting ? (
                <span className="h-4 w-24 animate-pulse bg-primary-content/35" />
              ) : (
                <>
                  Submit vote
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PollFilter>('all')
  const [votingId, setVotingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, number[]>>({})
  const toast = useToast()

  useEffect(() => {
    pollsApi.list()
      .then((res) => setPolls(res.data.data || []))
      .catch(() => setPolls([]))
      .finally(() => setLoading(false))
  }, [])

  useSocketEvent('poll:vote', (data: { pollId: string; options: Poll['options']; totalVotes: number }) => {
    setPolls((prev) => prev.map((poll) =>
      poll.id === data.pollId ? { ...poll, options: data.options } : poll
    ))
  })

  const handleSelect = (pollId: string, optionId: number, allowMultiple: boolean) => {
    setSelected((prev) => {
      const current = prev[pollId] || []
      if (allowMultiple) {
        return {
          ...prev,
          [pollId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        }
      }
      return { ...prev, [pollId]: [optionId] }
    })
  }

  const handleVote = async (pollId: string) => {
    const choices = selected[pollId]
    if (!choices?.length) {
      toast.warning('Please select an option')
      return
    }

    setVotingId(pollId)
    try {
      await pollsApi.vote(pollId, choices)
      toast.success('Vote submitted!')
      setPolls((prev) => prev.map((poll) => (
        poll.id === pollId ? { ...poll, hasVoted: true, myVote: choices } : poll
      )))
    } catch {
      toast.error('Failed to vote')
    } finally {
      setVotingId(null)
    }
  }

  const filteredPolls = useMemo(() => {
    return polls.filter((poll) => {
      if (filter === 'active') return poll.status === 'ACTIVE'
      if (filter === 'closed') return poll.status === 'CLOSED'
      return true
    })
  }, [polls, filter])

  const activeCount = polls.filter((poll) => poll.status === 'ACTIVE').length
  const closedCount = polls.filter((poll) => poll.status === 'CLOSED').length
  const votedCount = polls.filter((poll) => poll.hasVoted).length
  const totalVotes = polls.reduce((sum, poll) => sum + poll.options.reduce((count, option) => count + option.votes, 0), 0)

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
                Polling desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Vote on association decisions with a clear record.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Review active polls, cast your vote, and see results once you have voted or when a poll closes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={RadioTower} label="Active" value={activeCount} detail="Open for voting" />
              <StatTile icon={CheckCircle2} label="Closed" value={closedCount} detail="Results visible" tone="bg-success/12 text-success" />
              <StatTile icon={Vote} label="You voted" value={votedCount} detail="Recorded choices" tone="bg-secondary/18 text-primary" />
              <StatTile icon={Users} label="Total votes" value={totalVotes} detail="Across loaded polls" />
            </div>
          </div>
        </section>

        <section className="relative z-10 grid gap-3 sm:grid-cols-3">
          {filters.map((item) => {
            const Icon = item.icon
            const count = item.key === 'all' ? polls.length : item.key === 'active' ? activeCount : closedCount
            const active = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                className={`flex min-h-20 items-center gap-3 border p-3 text-left transition-all rounded-[20px_4px_20px_4px] ${
                  active ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
                }`}
                onClick={() => setFilter(item.key)}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[15px_3px_15px_3px] ${active ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold">{item.label}</span>
                    <span className="text-xs font-bold text-base-content/38">{count}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-base-content/50">
                    {item.key === 'all' ? 'Every decision poll' : item.key === 'active' ? 'Still accepting votes' : 'Voting window ended'}
                  </span>
                </span>
              </button>
            )
          })}
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Decision queue</p>
              <h2 className="mt-1 text-2xl font-bold">Association polls</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              Active polls accept votes. Closed or completed polls show the current result breakdown.
            </p>
          </div>

          {loading ? (
            <PollsSkeleton />
          ) : filteredPolls.length === 0 ? (
            <EmptyPolls filter={filter} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  selected={selected[poll.id] || []}
                  voting={votingId === poll.id}
                  onSelect={handleSelect}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
