import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { reportsApi } from '../../api/services'
import { REPORT_CONFIRMATION, REPORT_REASONS, apiErrorMessage } from '../../lib/moderation'
import type { ReportReason, ReportTargetType } from '../../types'

const TARGET_NOUN: Record<ReportTargetType, string> = {
  FORUM_POST: 'post',
  FORUM_COMMENT: 'comment',
  JOB: 'job post',
  MEMBER: 'member',
}

export default function ReportDialog({
  targetType,
  targetId,
  onClose,
}: {
  targetType: ReportTargetType
  targetId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!reason) {
      setError('Choose a reason for the report.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      // 201 for a new report, 200 if this member already reported it — both are a success.
      await reportsApi.create({ targetType, targetId, reason, details: details.trim() || undefined })
      setDone(true)
    } catch (err) {
      setError(apiErrorMessage(err) || 'Could not send your report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={done ? 'Report sent' : `Report this ${TARGET_NOUN[targetType]}`}>
      {done ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-[16px_4px_16px_4px] bg-success/10 p-4 text-sm font-semibold text-base-content">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p>{REPORT_CONFIRMATION}</p>
          </div>
          <button type="button" className="btn btn-primary min-h-11 w-full" onClick={onClose}>Done</button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm text-base-content/60">What is wrong with it?</legend>
            {REPORT_REASONS.map((item) => (
              <label
                key={item.value}
                className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors rounded-[14px_3px_14px_3px] ${
                  reason === item.value ? 'border-primary bg-primary/6' : 'border-base-300 hover:bg-base-200/50'
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  className="radio radio-primary radio-sm mt-0.5"
                  checked={reason === item.value}
                  onChange={() => {
                    setReason(item.value)
                    setError('')
                  }}
                />
                <span>
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="block text-xs text-base-content/55">{item.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="form-control">
            <span className="mb-2 text-sm text-base-content/60">Details (optional)</span>
            <textarea
              className="textarea textarea-bordered min-h-20 w-full"
              maxLength={1000}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Anything that helps the moderators understand the problem"
            />
          </label>
          {error && <p className="text-sm font-semibold text-error">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="submit" className="btn btn-error min-h-11 sm:flex-1" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send report'}
            </button>
            <button type="button" className="btn btn-ghost min-h-11" onClick={onClose} disabled={submitting}>Cancel</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
