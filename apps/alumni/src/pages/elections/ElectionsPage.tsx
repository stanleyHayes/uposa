import { useState, useEffect } from 'react'
import { Vote, CheckCircle, Clock } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { electionsApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { useSocketEvent } from '../../hooks/useSocket'
import { formatDate } from '../../utils/formatters'
import type { Election } from '../../types'

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all')
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
      .finally(() => setLoading(false))
  }, [])

  // Real-time election vote updates
  useSocketEvent('election:vote', (data: { electionId: string; candidateId: string; totalVotes: number }) => {
    setElections(prev => prev.map(e => {
      if (e.id !== data.electionId) return e
      const candidates = (e.candidates as any[]).map((c: any) =>
        c.id === data.candidateId ? { ...c, votes: (c.votes || 0) + 1 } : c
      )
      return { ...e, candidates }
    }))
  })

  const handleVote = async (electionId: string) => {
    const candidateId = selected[electionId]
    if (!candidateId) { toast.warning('Please select a candidate'); return }
    setVotingId(electionId)
    try {
      await electionsApi.vote(electionId, candidateId)
      toast.success('Vote cast successfully!')
      setElections((prev) => prev.map((e) => e.id === electionId ? { ...e, hasVoted: true, myVote: candidateId } : e))
    } catch {
      toast.error('Failed to cast vote')
    } finally {
      setVotingId(null)
    }
  }

  const filtered = elections.filter((e) => {
    if (filter === 'all') return true
    return e.status === filter.toUpperCase()
  })

  return (
    <PageTransition>
      <PageHeader title="Elections" description="Vote for your association's leadership" />

      <div className="join mb-6">
        {(['all', 'active', 'upcoming', 'completed'] as const).map((f) => (
          <button key={f} className={`join-item btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Vote} title="No elections found" />
      ) : (
        <div className="space-y-8">
          {filtered.map((election, i) => {
            const hasVoted = election.hasVoted
            const isActive = election.status === 'ACTIVE'
            const showResults = election.status === 'COMPLETED'
            const totalVotes = showResults ? election.candidates.reduce((sum, c) => sum + (c.votes || 0), 0) : 0

            return (
              <ScrollReveal key={election.id} delay={i * 0.05}>
                <div className="card bg-base-100 border border-base-300">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={election.status} />
                      <span className="text-xs text-base-content/50">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(election.startDate)} - {formatDate(election.endDate)}
                      </span>
                    </div>
                    <h2 className="card-title text-lg">{election.title}</h2>
                    <p className="text-sm text-base-content/60">Position: <span className="font-medium">{election.position}</span></p>
                    {election.description && <p className="text-sm text-base-content/60">{election.description}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {election.candidates.map((candidate) => {
                        const isSelected = (selected[election.id] || election.myVote) === candidate.id
                        const percentage = totalVotes > 0 ? ((candidate.votes || 0) / totalVotes) * 100 : 0

                        return (
                          <div
                            key={candidate.id}
                            className={`card border ${isSelected ? 'border-primary bg-primary/5' : 'border-base-300'} ${isActive && !hasVoted ? 'cursor-pointer hover:border-primary' : ''} transition-colors`}
                            onClick={() => isActive && !hasVoted && setSelected((prev) => ({ ...prev, [election.id]: candidate.id }))}
                          >
                            <div className="card-body p-4 items-center text-center">
                              <Avatar src={candidate.photoUrl} name={candidate.name} size="lg" />
                              <h3 className="font-semibold mt-2">{candidate.name}</h3>
                              {candidate.manifesto && <p className="text-xs text-base-content/60 line-clamp-3">{candidate.manifesto}</p>}
                              {isSelected && hasVoted && <CheckCircle className="w-5 h-5 text-primary mt-2" />}
                              {showResults && (
                                <div className="w-full mt-2">
                                  <progress className="progress progress-primary" value={percentage} max="100" />
                                  <p className="text-xs mt-1">{candidate.votes || 0} votes ({percentage.toFixed(0)}%)</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {isActive && !hasVoted && (
                      <button
                        className={`btn btn-primary btn-sm mt-4 self-start ${votingId === election.id ? 'loading' : ''}`}
                        onClick={() => handleVote(election.id)}
                        disabled={!selected[election.id] || votingId === election.id}
                      >
                        Cast Vote
                      </button>
                    )}

                    {hasVoted && <p className="text-sm text-success mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> You have voted in this election</p>}
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      )}
    </PageTransition>
  )
}
