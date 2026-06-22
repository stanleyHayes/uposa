import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, PlusCircle, Pencil, Trash2, Users } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import RoleGate from '../../components/auth/RoleGate'
import { useElectionsStore } from '../../stores/elections.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { ElectionCandidate } from '../../types'

const candidateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  photoUrl: z.string().url('Must be a valid URL').or(z.string().length(0)),
  manifesto: z.string().min(10, 'Manifesto is required'),
})
type CandidateForm = z.infer<typeof candidateSchema>

function toCandidateForm(candidate?: ElectionCandidate): CandidateForm {
  if (!candidate)
    return { name: '', photoUrl: '', manifesto: '' }
  return {
    name: candidate.name,
    photoUrl: candidate.photoUrl,
    manifesto: candidate.manifesto,
  }
}

export default function ElectionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { elections, deleteElection, addCandidate, updateCandidate, deleteCandidate } = useElectionsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [deleteElectionTarget, setDeleteElectionTarget] = useState(false)
  const [candidateModalOpen, setCandidateModalOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<ElectionCandidate | null>(null)
  const [deleteCandidateTarget, setDeleteCandidateTarget] = useState<ElectionCandidate | null>(null)
  const [viewingCandidate, setViewingCandidate] = useState<ElectionCandidate | null>(null)

  const candidateForm = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: toCandidateForm(),
  })

  const election = elections.find((e) => e.id === id)

  if (!election) {
    navigate('/elections', { replace: true })
    return null
  }

  const handleDeleteElection = () => {
    if (!currentUser) return
    deleteElection(election.id)
    addActivity({
      action: 'deleted election',
      targetType: election.title,
      targetId: election.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success('Election deleted')
    navigate('/elections')
  }

  const openAddCandidate = () => {
    setEditingCandidate(null)
    candidateForm.reset(toCandidateForm())
    setCandidateModalOpen(true)
  }

  const openEditCandidate = (candidate: ElectionCandidate) => {
    setEditingCandidate(candidate)
    candidateForm.reset(toCandidateForm(candidate))
    setCandidateModalOpen(true)
  }

  const onCandidateSubmit = async (data: CandidateForm) => {
    if (!currentUser) return
    const payload = { ...data, photoUrl: data.photoUrl || '', votes: 0 }
    if (editingCandidate) {
      updateCandidate(election.id, editingCandidate.id, payload)
      addActivity({
        action: 'updated candidate',
        targetType: data.name,
        targetId: editingCandidate.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Candidate updated')
    } else {
      addCandidate(election.id, payload)
      addActivity({
        action: 'added candidate',
        targetType: data.name,
        targetId: election.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Candidate added')
    }
    setCandidateModalOpen(false)
  }

  const handleDeleteCandidate = () => {
    if (!deleteCandidateTarget || !currentUser) return
    deleteCandidate(election.id, deleteCandidateTarget.id)
    addActivity({
      action: 'removed candidate',
      targetType: deleteCandidateTarget.name,
      targetId: deleteCandidateTarget.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success('Candidate removed')
    setDeleteCandidateTarget(null)
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
            <RoleGate permission="elections:edit">
              <Button leftIcon={<PlusCircle size={16} />} onClick={openAddCandidate}>
                Add Candidate
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="mb-4">
        <Badge
          variant={election.status.toLowerCase() as any}
          label={election.status.charAt(0) + election.status.slice(1).toLowerCase()}
        />
      </div>

      {election.candidates.length === 0 ? (
        <div className="admin-card-surface overflow-hidden">
          <EmptyState
            icon={<Users size={32} />}
            title="No candidates yet"
            description="Add the first candidate for this election."
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
                    {candidate.votes} votes
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{candidate.manifesto}</p>
              <div className="flex items-center justify-between">
                <button className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors">
                  View Manifesto
                </button>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <RoleGate permission="elections:edit">
                    <button onClick={() => openEditCandidate(candidate)} className="rounded-lg p-1 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                  </RoleGate>
                  <RoleGate permission="elections:delete">
                    <button onClick={() => setDeleteCandidateTarget(candidate)} className="rounded-lg p-1 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </RoleGate>
                </div>
              </div>
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
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{viewingCandidate.manifesto}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Candidate Create/Edit Modal */}
      <Modal
        open={candidateModalOpen}
        onClose={() => setCandidateModalOpen(false)}
        title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCandidateModalOpen(false)}>Cancel</Button>
            <Button loading={candidateForm.formState.isSubmitting} onClick={candidateForm.handleSubmit(onCandidateSubmit)}>
              {editingCandidate ? 'Save Changes' : 'Add Candidate'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Name" error={candidateForm.formState.errors.name?.message} {...candidateForm.register('name')} />
          <Input label="Photo URL" placeholder="https://..." error={candidateForm.formState.errors.photoUrl?.message} {...candidateForm.register('photoUrl')} />
          <Textarea label="Manifesto" rows={4} error={candidateForm.formState.errors.manifesto?.message} {...candidateForm.register('manifesto')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteElectionTarget}
        onClose={() => setDeleteElectionTarget(false)}
        onConfirm={handleDeleteElection}
        title="Delete Election"
        message={`Are you sure you want to delete "${election.title}"? All candidates will also be removed.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={!!deleteCandidateTarget}
        onClose={() => setDeleteCandidateTarget(null)}
        onConfirm={handleDeleteCandidate}
        title="Remove Candidate"
        message={`Are you sure you want to remove "${deleteCandidateTarget?.name}" from this election?`}
        confirmLabel="Remove"
      />
    </div>
  )
}
