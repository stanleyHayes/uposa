import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RoleGate from '../../components/auth/RoleGate'
import { usePollsStore } from '../../stores/polls.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import { cn } from '../../utils/cn'

const barColors = [
  'bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500',
  'bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-orange-500',
  'bg-teal-500', 'bg-pink-500',
]

export default function PollDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { polls, deletePoll } = usePollsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [deleteTarget, setDeleteTarget] = useState(false)

  const poll = polls.find((p) => p.id === id)

  if (!poll) {
    navigate('/polls', { replace: true })
    return null
  }

  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1)

  const handleDelete = () => {
    if (!currentUser) return
    deletePoll(poll.id)
    addActivity({
      action: 'deleted poll',
      targetType: poll.question,
      targetId: poll.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success('Poll deleted')
    navigate('/polls')
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/polls')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Polls
      </button>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant={poll.status.toLowerCase() as any}
                label={poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {poll.allowMultiple ? 'Multiple choice' : 'Single choice'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{poll.question}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{poll.description}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Ends: {poll.endsAt ? formatDate(poll.endsAt) : 'No end date'}
              {' · '}Created: {formatDate(poll.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <RoleGate permission="polls:edit">
              <Button variant="secondary" size="sm" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/polls/${poll.id}/edit`)}>
                Edit
              </Button>
            </RoleGate>
            <RoleGate permission="polls:delete">
              <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteTarget(true)}>
                Delete
              </Button>
            </RoleGate>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Results
          </h2>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {poll.totalVotes.toLocaleString()} total votes
          </span>
        </div>

        <div className="space-y-4">
          {poll.options.map((option, idx) => {
            const pct = poll.totalVotes > 0
              ? Math.round((option.votes / poll.totalVotes) * 100)
              : 0
            const isWinner = option.votes === maxVotes && poll.status === 'CLOSED'
            return (
              <div key={option.id} className="card-enter">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn(
                    'text-sm font-medium',
                    isWinner
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-800 dark:text-gray-200'
                  )}>
                    {option.text}
                    {isWinner && (
                      <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold">
                        Winner
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium tabular-nums">
                    {option.votes.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="relative w-full h-6 bg-gray-100 dark:bg-dark-hover rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      barColors[idx % barColors.length]
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
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
