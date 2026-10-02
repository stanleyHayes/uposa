import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Users } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge, { type BadgeVariant } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import RoleGate from '../../components/auth/RoleGate'
import { adminElectionsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDate } from '../../utils/formatters'
import type { Election, ElectionCandidate } from '../../types'

export default function ElectionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteElectionTarget, setDeleteElectionTarget] = useState(false)
  const [viewingCandidate, setViewingCandidate] = useState<ElectionCandidate | null>(null)

  // The admin results endpoint returns the election with per-candidate votes.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminElectionsApi.getResults(id)
      .then((res) => { if (!cancelled) setElection(res.data.data as Election) })
      .catch(() => {
        if (cancelled) return
        toast.error('Election not found')
        navigate('/elections', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, navigate, toast])

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!election) return null

  const handleDeleteElection = async () => {
    if (!currentUser) return
    setDeleting(true)
    try {
      await adminElectionsApi.delete(election.id)
      addActivity({
        action: 'deleted election',
        targetType: election.title,
        targetId: election.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Election deleted')
      navigate('/elections')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete election'))
      setDeleting(false)
    }
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/elections')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Elections
        </button>
      </div>

      <PageHeader
        title={election.title}
        description={`${election.candidates.length} candidates · ${election.position} · ${formatDate(election.startDate)} – ${formatDate(election.endDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <RoleGate permission="elections:edit">
              <Button variant="secondary" leftIcon={<Pencil size={15} />} onClick={() => navigate(`/elections/${election.id}/edit`)}>
                Edit Election
              </Button>
            </RoleGate>
            <RoleGate permission="elections:delete">
              <Button variant="danger" leftIcon={<Trash2 size={15} />} onClick={() => setDeleteElectionTarget(true)}>
                Delete
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <Badge
          variant={election.status.toLowerCase() as BadgeVariant}
          label={election.status.charAt(0) + election.status.slice(1).toLowerCase()}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">{(election.totalVotes ?? 0).toLocaleString()} votes cast</span>
      </div>

      {election.description && (
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{election.description}</p>
      )}

      {election.candidates.length === 0 ? (
        <div className="admin-card-surface overflow-hidden">
          <EmptyState
            icon={<Users size={32} />}
            title="No candidates"
            description="This election has no candidates."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {election.candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="card-enter card-lift admin-card-surface p-5 cursor-pointer"
              onClick={() => setViewingCandidate(candidate)}
            >
              <div className="flex items-start gap-3 mb-3">
                {candidate.photoUrl ? (
                  <img src={candidate.photoUrl} alt={candidate.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                    <span className="text-brand-700 dark:text-brand-300 font-bold text-lg">{candidate.name.charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{candidate.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {candidate.votes} votes{candidate.percentage ? ` · ${candidate.percentage}%` : ''}
                  </p>
                </div>
              </div>
              {candidate.bio && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{candidate.bio}</p>}
              <button className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors">
                View Manifesto
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      <Modal
        open={!!viewingCandidate}
        onClose={() => setViewingCandidate(null)}
        title={viewingCandidate?.name ?? 'Candidate Details'}
        size="lg"
      >
        {viewingCandidate && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              {viewingCandidate.photoUrl ? (
                <img src={viewingCandidate.photoUrl} alt={viewingCandidate.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                  <span className="text-brand-700 dark:text-brand-300 font-bold text-3xl">{viewingCandidate.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{viewingCandidate.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewingCandidate.votes} votes</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">Manifesto</h4>
              <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{viewingCandidate.bio || 'No manifesto provided.'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteElectionTarget}
        onClose={() => setDeleteElectionTarget(false)}
        onConfirm={handleDeleteElection}
        loading={deleting}
        title="Delete Election"
        message={`Are you sure you want to delete "${election.title}"? All candidates will also be removed.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
