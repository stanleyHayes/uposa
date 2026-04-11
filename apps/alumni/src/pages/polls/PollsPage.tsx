import { useState, useEffect } from 'react'
import { BarChart3, CheckCircle, Clock } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { pollsApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { useSocketEvent } from '../../hooks/useSocket'
import { formatDate } from '../../utils/formatters'
import type { Poll } from '../../types'

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all')
  const [votingId, setVotingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, number[]>>({})
  const toast = useToast()

  useEffect(() => {
    pollsApi.list()
      .then((res) => {
        const data = res.data.data
        setPolls(data || [])
      })
      .catch(() => setPolls([]))
      .finally(() => setLoading(false))
  }, [])

  // Real-time poll vote updates
  useSocketEvent('poll:vote', (data: { pollId: string; options: any[]; totalVotes: number }) => {
    setPolls(prev => prev.map(p =>
      p.id === data.pollId ? { ...p, options: data.options } : p
    ))
  })

  const handleSelect = (pollId: string, optionId: number, allowMultiple: boolean) => {
    setSelected((prev) => {
      const current = prev[pollId] || []
      if (allowMultiple) {
        return { ...prev, [pollId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId] }
      }
      return { ...prev, [pollId]: [optionId] }
    })
  }

  const handleVote = async (pollId: string) => {
    const choices = selected[pollId]
    if (!choices?.length) { toast.warning('Please select an option'); return }
    setVotingId(pollId)
    try {
      await pollsApi.vote(pollId, choices)
      toast.success('Vote submitted!')
      setPolls((prev) => prev.map((p) => p.id === pollId ? { ...p, hasVoted: true, myVote: choices } : p))
    } catch {
      toast.error('Failed to vote')
    } finally {
      setVotingId(null)
    }
  }

  const filtered = polls.filter((p) => {
    if (filter === 'active') return p.status === 'ACTIVE'
    if (filter === 'closed') return p.status === 'CLOSED'
    return true
  })

  return (
    <PageTransition>
      <PageHeader title="Polls" description="Vote on important association matters" />

      <div className="join mb-6">
        {(['all', 'active', 'closed'] as const).map((f) => (
          <button key={f} className={`join-item btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BarChart3} title="No polls found" />
      ) : (
        <div className="space-y-6">
          {filtered.map((poll, i) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0)
            const hasVoted = poll.hasVoted
            const showResults = hasVoted || poll.status === 'CLOSED'

            return (
              <ScrollReveal key={poll.id} delay={i * 0.05}>
                <div className="card bg-base-100 shadow-[0_2px_8px_rgba(0,27,80,0.06)]">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={poll.status} />
                      {poll.endsAt && <span className="text-xs text-base-content/50"><Clock className="w-3 h-3 inline mr-1" />Ends {formatDate(poll.endsAt)}</span>}
                    </div>
                    <h2 className="card-title text-lg">{poll.question}</h2>
                    {poll.description && <p className="text-sm text-base-content/60">{poll.description}</p>}
                    {poll.allowMultiple && <p className="text-xs text-base-content/50 mt-1">Select multiple options</p>}

                    <div className="space-y-2 mt-4">
                      {poll.options.map((option) => {
                        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
                        const isSelected = (selected[poll.id] || poll.myVote || []).includes(option.id)

                        return showResults ? (
                          <div key={option.id} className="relative">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-base-200 relative overflow-hidden">
                              <div className="absolute inset-0 bg-primary/10 transition-all" style={{ width: `${percentage}%` }} />
                              <span className="relative font-medium text-sm flex items-center gap-2">
                                {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                                {option.text}
                              </span>
                              <span className="relative text-sm font-medium">{percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        ) : (
                          <label key={option.id} className="flex items-center gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 cursor-pointer transition-colors">
                            <input
                              type={poll.allowMultiple ? 'checkbox' : 'radio'}
                              name={`poll-${poll.id}`}
                              className={poll.allowMultiple ? 'checkbox checkbox-primary checkbox-sm' : 'radio radio-primary radio-sm'}
                              checked={isSelected}
                              onChange={() => handleSelect(poll.id, option.id, poll.allowMultiple)}
                            />
                            <span className="text-sm">{option.text}</span>
                          </label>
                        )
                      })}
                    </div>

                    {showResults && (
                      <p className="text-xs text-base-content/50 mt-2">{totalVotes} total votes</p>
                    )}

                    {!showResults && poll.status === 'ACTIVE' && (
                      <button
                        className={`btn btn-primary btn-sm mt-4 ${votingId === poll.id ? 'loading' : ''}`}
                        onClick={() => handleVote(poll.id)}
                        disabled={votingId === poll.id}
                      >
                        Submit Vote
                      </button>
                    )}
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
