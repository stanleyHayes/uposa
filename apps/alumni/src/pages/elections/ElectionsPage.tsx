import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RadioTower,
  ScrollText,
  Sparkles,
  UserCheck,
  Users,
  Vote,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import Avatar from '../../components/ui/Avatar'
import { electionsApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { useSocketEvent } from '../../hooks/useSocket'
import { formatDate } from '../../utils/formatters'
import type { Election, ElectionCandidate } from '../../types'

type ElectionFilter = 'all' | 'active' | 'upcoming' | 'completed'

const filters: Array<{ key: ElectionFilter; label: string; helper: string; icon: LucideIcon }> = [
  { key: 'all', label: 'All elections', helper: 'Every ballot', icon: ScrollText },
  { key: 'active', label: 'Active', helper: 'Open now', icon: RadioTower },
  { key: 'upcoming', label: 'Upcoming', helper: 'Scheduled', icon: Clock3 },
  { key: 'completed', label: 'Completed', helper: 'Results ready', icon: CheckCircle2 },
]

const filterStatus: Record<Exclude<ElectionFilter, 'all'>, Election['status']> = {
  active: 'ACTIVE',
  upcoming: 'UPCOMING',
  completed: 'COMPLETED',
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

function InfoTile({
  label,
  value,
  detail,
}: {
  label: string
  value: ReactNode
  detail: string
}) {
  return (
    <div className="border border-primary/8 bg-base-200/45 p-3 rounded-[16px_3px_16px_3px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-base-content">{value}</p>
      <p className="mt-1 text-xs font-semibold text-base-content/42">{detail}</p>
    </div>
  )
}

function ElectionsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse bg-base-300/35 rounded-[20px_4px_20px_4px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="border border-primary/8 bg-base-100/84 p-5 rounded-[24px_4px_24px_4px]">
            <div className="flex items-start justify-between gap-4">
              <div className="h-8 w-28 animate-pulse bg-base-300/35" />
              <div className="h-8 w-36 animate-pulse bg-base-300/35" />
            </div>
            <div className="mt-5 h-7 w-4/5 animate-pulse bg-base-300/55" />
            <div className="mt-3 h-3 w-full animate-pulse bg-base-300/35" />
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-16 animate-pulse bg-base-300/30 rounded-[16px_3px_16px_3px]" />
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[0, 1].map((row) => (
                <div key={row} className="h-44 animate-pulse bg-base-300/25 rounded-[22px_4px_22px_4px]" />
              ))}
            </div>
            <div className="mt-5 h-11 animate-pulse bg-base-300/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyElections({ filter }: { filter: ElectionFilter }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <Vote className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No elections found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {filter === 'active'
          ? 'Active ballots will appear here as soon as voting opens.'
          : filter === 'upcoming'
            ? 'Scheduled elections will appear here before their voting window begins.'
            : filter === 'completed'
              ? 'Completed ballots will appear here after results are published.'
              : 'Association elections will appear here when they are published.'}
      </p>
    </div>
  )
}

function CandidateCard({
  candidate,
  selectable,
  chosen,
  submittedChoice,
  showResults,
  votes,
  percentage,
  onSelect,
}: {
  candidate: ElectionCandidate
  selectable: boolean
  chosen: boolean
  submittedChoice: boolean
  showResults: boolean
  votes: number
  percentage: number
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selectable ? chosen : undefined}
      disabled={!selectable}
      className={`group flex h-full w-full flex-col border p-4 text-left transition-all rounded-[22px_4px_22px_4px] ${
        chosen
          ? 'border-primary bg-primary/7 shadow-[0_12px_28px_rgba(0,27,80,0.08)]'
          : 'border-primary/10 bg-base-100 hover:border-primary/20'
      } ${selectable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <Avatar src={candidate.photoUrl} name={candidate.name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold leading-tight text-base-content">{candidate.name}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-base-content/35">Candidate</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[13px_3px_13px_3px] ${
          chosen ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'
        }`}>
          {showResults ? (
            <span className="text-xs font-bold">{percentage.toFixed(0)}%</span>
          ) : chosen ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Vote className="h-4 w-4" />
          )}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-relaxed text-base-content/56">
        {candidate.manifesto || 'Manifesto notes will appear here when this candidate shares campaign details.'}
      </p>

      <div className="mt-auto pt-4">
        {showResults ? (
          <div>
            <div className="h-2 overflow-hidden bg-base-200/70">
              <div className="h-full bg-secondary transition-all" style={{ width: `${percentage}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-base-content/45">
              <span>{votes} vote{votes === 1 ? '' : 's'}</span>
              {submittedChoice && <span className="text-primary">Your vote</span>}
            </div>
          </div>
        ) : chosen ? (
          <span className="inline-flex min-h-9 items-center gap-2 bg-primary/8 px-3 py-2 text-xs font-bold text-primary rounded-[14px_3px_14px_3px]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {submittedChoice ? 'Your recorded vote' : 'Selected candidate'}
          </span>
        ) : (
          <span className="text-xs font-semibold text-base-content/40">
            {selectable ? 'Tap to select this candidate' : 'Candidate profile'}
          </span>
        )}
      </div>
    </button>
  )
}

function ElectionCard({
  election,
  selectedCandidate,
  voting,
  onSelect,
  onVote,
}: {
  election: Election
  selectedCandidate?: string
  voting: boolean
  onSelect: (electionId: string, candidateId: string) => void
  onVote: (electionId: string) => void
}) {
  const hasVoted = Boolean(election.hasVoted)
  const isActive = election.status === 'ACTIVE'
  const isUpcoming = election.status === 'UPCOMING'
  const isCancelled = election.status === 'CANCELLED'
  const showResults = election.status === 'COMPLETED'
  const canVote = isActive && !hasVoted
  const totalVotes = election.candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0)
  const chosenCandidateId = selectedCandidate || election.myVote
  const leadingCandidate = showResults && election.candidates.length > 0
    ? [...election.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0]
    : undefined

  return (
    <article className="flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className={`h-1 ${isActive ? 'bg-secondary' : showResults ? 'bg-success' : isCancelled ? 'bg-error' : 'bg-primary'}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={election.status} />
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-base-content/45">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(election.startDate)} - {formatDate(election.endDate)}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">{election.position}</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-base-content">{election.title}</h2>
          {election.description && (
            <p className="mt-3 text-sm leading-relaxed text-base-content/58">{election.description}</p>
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <InfoTile label="Slate" value={`${election.candidates.length} candidate${election.candidates.length === 1 ? '' : 's'}`} detail="On this ballot" />
          <InfoTile label="Window" value={isActive ? 'Open' : isUpcoming ? 'Scheduled' : showResults ? 'Closed' : 'Unavailable'} detail={isActive ? 'Voting live' : `Starts ${formatDate(election.startDate)}`} />
          <InfoTile
            label={showResults ? 'Lead' : 'Status'}
            value={leadingCandidate?.name || (hasVoted ? 'Recorded' : canVote ? 'Awaiting vote' : election.status)}
            detail={showResults ? `${totalVotes} total votes` : hasVoted ? 'Your vote is saved' : 'Member ballot'}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {election.candidates.map((candidate) => {
            const votes = candidate.votes || 0
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
            const chosen = chosenCandidateId === candidate.id

            return (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                selectable={canVote}
                chosen={chosen}
                submittedChoice={hasVoted && election.myVote === candidate.id}
                showResults={showResults}
                votes={votes}
                percentage={percentage}
                onSelect={() => onSelect(election.id, candidate.id)}
              />
            )
          })}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-5">
          {canVote ? (
            <button
              type="button"
              className="btn btn-primary min-h-11 w-full gap-2"
              onClick={() => onVote(election.id)}
              disabled={!selectedCandidate || voting}
            >
              {voting ? (
                <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
              ) : (
                <>
                  Cast vote
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : hasVoted ? (
            <div className="flex min-h-11 items-center gap-2 border border-success/15 bg-success/10 px-4 py-3 text-sm font-bold text-success rounded-[16px_3px_16px_3px]">
              <CheckCircle2 className="h-4 w-4" />
              You have voted in this election
            </div>
          ) : isUpcoming ? (
            <div className="flex min-h-11 items-center gap-2 border border-primary/10 bg-base-200/45 px-4 py-3 text-sm font-bold text-base-content/55 rounded-[16px_3px_16px_3px]">
              <Clock3 className="h-4 w-4 text-primary" />
              Voting opens {formatDate(election.startDate)}
            </div>
          ) : isCancelled ? (
            <div className="flex min-h-11 items-center gap-2 border border-error/15 bg-error/10 px-4 py-3 text-sm font-bold text-error rounded-[16px_3px_16px_3px]">
              <XCircle className="h-4 w-4" />
              This election is not accepting votes
            </div>
          ) : (
            <div className="flex min-h-11 items-center justify-between gap-3 border border-primary/10 bg-base-200/45 px-4 py-3 text-sm font-bold text-base-content/58 rounded-[16px_3px_16px_3px]">
              <span>Results published</span>
              <span className="text-primary">{totalVotes} vote{totalVotes === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [filter, setFilter] = useState<ElectionFilter>('all')
  const [votingId, setVotingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const toast = useToast()

  useEffect(() => {
    electionsApi.list()
      .then((res) => {
        const data = res.data.data
        setElections(data || [])
      })
      .catch(() => setElections([]))
      .finally(() => setIsFetching(false))
  }, [])

  useSocketEvent('election:vote', (data: { electionId: string; candidateId: string; totalVotes: number }) => {
    setElections((prev) => prev.map((election) => {
      if (election.id !== data.electionId) return election
      const candidates = election.candidates.map((candidate) =>
        candidate.id === data.candidateId ? { ...candidate, votes: (candidate.votes || 0) + 1 } : candidate
      )
      return { ...election, candidates }
    }))
  })

  const handleVote = async (electionId: string) => {
    const candidateId = selected[electionId]
    if (!candidateId) {
      toast.warning('Please select a candidate')
      return
    }

    setVotingId(electionId)
    try {
      await electionsApi.vote(electionId, candidateId)
      toast.success('Vote cast successfully!')
      setElections((prev) => prev.map((election) => (
        election.id === electionId ? { ...election, hasVoted: true, myVote: candidateId } : election
      )))
    } catch {
      toast.error('Failed to cast vote')
    } finally {
      setVotingId(null)
    }
  }

  const handleSelect = (electionId: string, candidateId: string) => {
    setSelected((prev) => ({ ...prev, [electionId]: candidateId }))
  }

  const filteredElections = useMemo(() => {
    return elections.filter((election) => {
      if (filter === 'all') return true
      return election.status === filterStatus[filter]
    })
  }, [elections, filter])

  const activeCount = elections.filter((election) => election.status === 'ACTIVE').length
  const upcomingCount = elections.filter((election) => election.status === 'UPCOMING').length
  const completedCount = elections.filter((election) => election.status === 'COMPLETED').length
  const votedCount = elections.filter((election) => election.hasVoted).length
  const candidateCount = elections.reduce((sum, election) => sum + election.candidates.length, 0)

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
                Election desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Choose association leaders with a cleaner ballot.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Review positions, study candidate notes, cast active votes, and read completed results in one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={RadioTower} label="Active" value={activeCount} detail="Open ballots" />
              <StatTile icon={Clock3} label="Upcoming" value={upcomingCount} detail="Scheduled votes" />
              <StatTile icon={UserCheck} label="You voted" value={votedCount} detail="Recorded ballots" tone="bg-success/12 text-success" />
              <StatTile icon={Users} label="Candidates" value={candidateCount} detail={`${completedCount} completed`} tone="bg-secondary/18 text-primary" />
            </div>
          </div>
        </section>

        <section className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filters.map((item) => {
            const Icon = item.icon
            const count = item.key === 'all'
              ? elections.length
              : item.key === 'active'
                ? activeCount
                : item.key === 'upcoming'
                  ? upcomingCount
                  : completedCount
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
                  <span className="mt-1 block text-xs leading-relaxed text-base-content/50">{item.helper}</span>
                </span>
              </button>
            )
          })}
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Ballot queue</p>
              <h2 className="mt-1 text-2xl font-bold">Leadership elections</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              Select a candidate when voting is open. Completed elections show vote shares and your recorded choice.
            </p>
          </div>

          {isFetching ? (
            <ElectionsSkeleton />
          ) : filteredElections.length === 0 ? (
            <EmptyElections filter={filter} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredElections.map((election, index) => (
                <ScrollReveal key={election.id} delay={index * 0.05}>
                  <ElectionCard
                    election={election}
                    selectedCandidate={selected[election.id]}
                    voting={votingId === election.id}
                    onSelect={handleSelect}
                    onVote={handleVote}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
