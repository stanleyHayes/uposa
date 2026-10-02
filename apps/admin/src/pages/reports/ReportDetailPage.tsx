import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, EyeOff, ExternalLink, Flag, Trash2, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Textarea from '../../components/ui/Textarea'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import { adminReportsApi } from '../../api/services'
import { useReportsStore } from '../../stores/reports.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDateTime } from '../../utils/formatters'
import { usePermission } from '../../hooks/usePermission'
import type { ContentReport, ResolveReportInput } from '../../types'
import { ACTION_LABELS, REASON_BADGE, STATUS_BADGE, TARGET_LABELS, targetLink } from './reportLabels'

type ConfirmableAction = 'DELETE_CONTENT' | 'SUSPEND_AUTHOR'

export default function ReportDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const { can } = usePermission()
  const { addActivity } = useActivityStore()
  const { toast } = useToast()
  const fetchOpenCount = useReportsStore((s) => s.fetchOpenCount)

  const [report, setReport] = useState<ContentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState<ResolveReportInput['action'] | 'DISMISS' | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmableAction | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminReportsApi.getById(id)
      .then((res) => { if (!cancelled) setReport(res.data.data as ContentReport) })
      .catch((err) => {
        if (cancelled) return
        toast.error(apiErrorMessage(err, 'Report not found'))
        navigate('/reports', { replace: true })
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

  if (!report) return null

  const isOpen = report.status === 'OPEN'
  const isMember = report.targetType === 'MEMBER'
  const canResolve = can('reports:edit')
  // SUSPEND_AUTHOR also changes a member's account status, so it needs members:edit too.
  const canSuspend = canResolve && can('members:edit')
  // The API reports the reported member as the "author" of a member report; admin-posted jobs have none.
  const suspendTargetId = report.target.authorId ?? null
  const link = report.target.exists ? targetLink(report.targetType, report.targetId) : null
  const reason = REASON_BADGE[report.reason] ?? REASON_BADGE.OTHER
  const status = STATUS_BADGE[report.status] ?? STATUS_BADGE.OPEN
  const busy = submitting !== null

  const resolve = async (input: ResolveReportInput) => {
    if (!currentUser) return
    setSubmitting(input.status === 'DISMISSED' ? 'DISMISS' : input.action)
    try {
      const res = await adminReportsApi.resolve(report.id, { ...input, resolutionNote: note.trim() || undefined })
      addActivity({
        action: input.status === 'DISMISSED' ? 'dismissed report on' : `resolved report (${ACTION_LABELS[input.action ?? 'NONE'].toLowerCase()}) on`,
        targetType: TARGET_LABELS[report.targetType],
        targetId: report.targetId,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success(res.data.message || (input.status === 'DISMISSED' ? 'Report dismissed' : 'Report resolved'))
      fetchOpenCount()
      navigate('/reports')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to resolve report'))
      setSubmitting(null)
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/reports')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Reports
      </button>

      <PageHeader
        title={`Reported ${TARGET_LABELS[report.targetType]?.toLowerCase() ?? 'content'}`}
        description={isOpen
          ? `${report.reportCount} ${report.reportCount === 1 ? 'open report' : 'open reports'} on this ${TARGET_LABELS[report.targetType]?.toLowerCase() ?? 'item'}`
          : 'This report has been resolved.'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reported content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card-surface p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant={status.variant} label={status.label} />
              {report.target.isHidden && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                  <EyeOff size={12} /> Hidden from members
                </span>
              )}
            </div>

            {report.target.exists ? (
              <>
                {report.target.title && <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{report.target.title}</h2>}
                <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {report.target.excerpt || <span className="italic text-gray-400">No text content</span>}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    By <span className="font-medium text-gray-900 dark:text-gray-100">{report.target.authorName ?? 'Unknown'}</span>
                  </span>
                  {link && (
                    <Link to={link.to} className="inline-flex items-center gap-1.5 font-medium text-brand-600 dark:text-brand-400 hover:underline">
                      <ExternalLink size={14} /> {link.label}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm italic text-gray-500 dark:text-gray-400">This content no longer exists. Dismiss the report to clear it from the queue.</p>
            )}
          </div>

          {/* Actions */}
          {isOpen && !canResolve ? (
            <div className="admin-card-surface p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">You don't have permission to resolve reports.</p>
            </div>
          ) : isOpen ? (
            <div className="admin-card-surface p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Resolve</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Resolving closes every open report on this {TARGET_LABELS[report.targetType]?.toLowerCase() ?? 'item'}.
                {report.targetType === 'FORUM_POST' || report.targetType === 'FORUM_COMMENT' ? ' Dismissing also un-hides it if it was hidden automatically.' : ''}
                {isMember ? ' Members can only be suspended, not hidden or deleted, from a report.' : ''}
              </p>
              <Textarea
                label="Resolution note (optional)"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why you took this action (visible to other admins)"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<XCircle size={15} />}
                  loading={submitting === 'DISMISS'}
                  disabled={busy}
                  onClick={() => resolve({ status: 'DISMISSED', action: 'NONE' })}
                >
                  Dismiss
                </Button>
                {/* The API rejects hide/delete for member reports. */}
                {!isMember && (
                  <>
                    <Button
                      variant="secondary"
                      leftIcon={<EyeOff size={15} />}
                      loading={submitting === 'HIDE_CONTENT'}
                      disabled={busy || !report.target.exists}
                      onClick={() => resolve({ status: 'ACTIONED', action: 'HIDE_CONTENT' })}
                    >
                      {/* Hiding a job un-approves it. */}
                      {report.targetType === 'JOB' ? 'Unpublish job' : report.target.isHidden ? 'Keep hidden' : 'Hide content'}
                    </Button>
                    <Button
                      variant="danger"
                      leftIcon={<Trash2 size={15} />}
                      disabled={busy || !report.target.exists}
                      onClick={() => setConfirmAction('DELETE_CONTENT')}
                    >
                      Delete content
                    </Button>
                  </>
                )}
                {canSuspend && (
                  <Button
                    variant="danger"
                    leftIcon={<Ban size={15} />}
                    disabled={busy || !suspendTargetId}
                    onClick={() => setConfirmAction('SUSPEND_AUTHOR')}
                  >
                    {isMember ? 'Suspend member' : 'Suspend author'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-card-surface p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Resolution</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {report.status === 'DISMISSED' ? 'Dismissed' : ACTION_LABELS[report.action ?? 'NONE']}
                {report.resolvedAt && <span className="text-gray-400 dark:text-gray-500"> · {formatDateTime(report.resolvedAt)}</span>}
              </p>
              {report.resolutionNote && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{report.resolutionNote}</p>
              )}
            </div>
          )}
        </div>

        {/* Report details */}
        <div className="admin-card-surface p-6 h-fit">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Flag size={14} /> Report
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</dt>
              <dd className="mt-1"><Badge variant={reason.variant} label={reason.label} /></dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</dt>
              <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.details || <span className="text-gray-400">None given</span>}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reported by</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{report.reporter?.fullName ?? 'Unknown member'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reported</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDateTime(report.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'DELETE_CONTENT'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => resolve({ status: 'ACTIONED', action: 'DELETE_CONTENT' })}
        loading={submitting === 'DELETE_CONTENT'}
        title="Delete Content"
        message={`Permanently delete this ${TARGET_LABELS[report.targetType]?.toLowerCase() ?? 'content'}? This cannot be undone.`}
        confirmLabel="Delete"
      />
      <ConfirmDialog
        open={confirmAction === 'SUSPEND_AUTHOR'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => resolve({ status: 'ACTIONED', action: 'SUSPEND_AUTHOR' })}
        loading={submitting === 'SUSPEND_AUTHOR'}
        title={isMember ? 'Suspend Member' : 'Suspend Author'}
        message={`Suspend ${report.target.authorName ?? 'this member'}? They will no longer be able to sign in or post.`}
        confirmLabel="Suspend"
      />
    </div>
  )
}
