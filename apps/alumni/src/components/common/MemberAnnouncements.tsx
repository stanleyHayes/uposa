import { lazy, Suspense, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Siren, X, type LucideIcon } from 'lucide-react'
import { announcementsApi } from '../../api/services'
import type { Announcement, AnnouncementType } from '../../types'
import { formatDate } from '../../utils/formatters'

// react-markdown stays in its own chunk and is only fetched when there is
// something to show. Raw HTML is not enabled, so bodies render safely.
const MarkdownContent = lazy(() => import('./MarkdownContent'))

const DISMISSED_KEY = 'uposa_alumni_dismissed_announcements'
const MAX_SHOWN = 3

const tones: Record<AnnouncementType, { icon: LucideIcon; cls: string }> = {
  INFO: { icon: Info, cls: 'border-info/25 bg-info/8 text-info' },
  WARNING: { icon: AlertTriangle, cls: 'border-warning/30 bg-warning/10 text-warning' },
  URGENT: { icon: Siren, cls: 'border-error/30 bg-error/8 text-error' },
  SUCCESS: { icon: CheckCircle2, cls: 'border-success/25 bg-success/8 text-success' },
}

function readDismissed(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export default function MemberAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<string[]>(readDismissed)

  useEffect(() => {
    let active = true
    announcementsApi.members()
      .then((res) => {
        if (!active) return
        const list = [...(res.data.data || [])]
        list.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
        setItems(list)
      })
      // Optional strip: stays hidden when there is nothing to show or the call fails.
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const visible = items.filter((item) => !dismissed.includes(item.id)).slice(0, MAX_SHOWN)
  if (visible.length === 0) return null

  const dismiss = (id: string) => {
    // Keep only ids that are still being served so the stored list can't grow forever.
    const next = [...dismissed.filter((existing) => items.some((item) => item.id === existing)), id]
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    } catch {
      // storage unavailable — dismissal lasts for this visit only
    }
  }

  return (
    <section aria-label="Announcements" className="relative z-10 grid gap-2">
      {visible.map((item) => {
        const tone = tones[item.type] ?? tones.INFO
        const Icon = tone.icon
        return (
          <article key={item.id} className={`flex gap-3 border p-4 ${tone.cls}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-base-content">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-sm font-bold">{item.title}</h2>
                {item.publishedAt && <span className="text-xs text-base-content/45">{formatDate(item.publishedAt)}</span>}
              </div>
              <Suspense fallback={<p className="mt-1 whitespace-pre-line text-sm text-base-content/70">{item.body}</p>}>
                <MarkdownContent content={item.body} className="mt-1 text-sm" />
              </Suspense>
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="btn btn-ghost btn-xs btn-square shrink-0 text-base-content/50"
              aria-label={`Dismiss announcement: ${item.title}`}
            >
              <X className="h-4 w-4" />
            </button>
          </article>
        )
      })}
    </section>
  )
}
