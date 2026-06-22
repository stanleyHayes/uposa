import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Pause,
  Volume2,
  X,
} from 'lucide-react'
import { ADMIN_HELP_EVENT, ADMIN_TOUR_EVENT } from './helpEvents'
import { adminTourSteps, getAdminHelpTopic, topicToSpeech } from './helpContent'

interface HelpExperienceProps {
  userKey?: string
}

interface HighlightBox {
  top: number
  left: number
  width: number
  height: number
}

function speakText(text: string, onDone: () => void) {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.94
  utterance.pitch = 1
  utterance.onend = onDone
  utterance.onerror = onDone
  window.speechSynthesis.speak(utterance)
  return true
}

function seenKey(userKey?: string) {
  return `uposa-admin-dashboard-tour-seen:${userKey || 'anonymous'}`
}

export default function HelpExperience({ userKey }: HelpExperienceProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const topic = useMemo(() => getAdminHelpTopic(location.pathname), [location.pathname])
  const [tourOpen, setTourOpen] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [highlight, setHighlight] = useState<HighlightBox | null>(null)

  const markSeen = useCallback(() => {
    localStorage.setItem(seenKey(userKey), 'true')
  }, [userKey])

  const startTour = useCallback(() => {
    setHelpOpen(false)
    setTourIndex(0)
    setTourOpen(true)
  }, [])

  const closeTour = useCallback(() => {
    markSeen()
    setTourOpen(false)
    setHighlight(null)
  }, [markSeen])

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speakTopic = useCallback(() => {
    const started = speakText(topicToSpeech(topic), () => setSpeaking(false))
    setSpeaking(started)
  }, [topic])

  useEffect(() => () => stopSpeech(), [stopSpeech])

  useEffect(() => {
    const replay = () => {
      navigate('/dashboard')
      window.setTimeout(startTour, 250)
    }
    const openHelp = () => setHelpOpen(true)

    window.addEventListener(ADMIN_TOUR_EVENT, replay)
    window.addEventListener(ADMIN_HELP_EVENT, openHelp)
    return () => {
      window.removeEventListener(ADMIN_TOUR_EVENT, replay)
      window.removeEventListener(ADMIN_HELP_EVENT, openHelp)
    }
  }, [navigate, startTour])

  useEffect(() => {
    if (!userKey || location.pathname !== '/dashboard') return
    if (localStorage.getItem(seenKey(userKey))) return

    const timer = window.setTimeout(startTour, 800)
    return () => window.clearTimeout(timer)
  }, [location.pathname, startTour, userKey])

  useEffect(() => {
    if (!tourOpen) return
    const step = adminTourSteps[tourIndex]

    const updateHighlight = () => {
      if (!step.selector) {
        setHighlight(null)
        return
      }
      const target = document.querySelector(step.selector)
      if (!(target instanceof HTMLElement)) {
        setHighlight(null)
        return
      }
      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
      const rect = target.getBoundingClientRect()
      setHighlight({
        top: Math.max(8, rect.top - 8),
        left: Math.max(8, rect.left - 8),
        width: Math.min(window.innerWidth - 16, rect.width + 16),
        height: Math.min(window.innerHeight - 16, rect.height + 16),
      })
    }

    const timer = window.setTimeout(updateHighlight, 120)
    window.addEventListener('resize', updateHighlight)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateHighlight)
    }
  }, [tourIndex, tourOpen])

  const step = adminTourSteps[tourIndex]
  const canGoBack = tourIndex > 0
  const canGoNext = tourIndex < adminTourSteps.length - 1

  return (
    <>
      {tourOpen && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-brand-950/68 backdrop-blur-[2px]" />
          {highlight && (
            <div
              className="absolute border-2 border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_0_9999px_rgba(0,10,32,0.58),0_18px_60px_rgba(212,175,55,0.22)]"
              style={highlight}
            />
          )}
          <div className="absolute bottom-5 left-1/2 w-[min(92vw,520px)] -translate-x-1/2 border border-[#D4AF37]/35 bg-cream-50 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.35)] dark:bg-dark-card">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                  Show me around / Step {tourIndex + 1} of {adminTourSteps.length}
                </p>
                <h2 className="text-xl font-black text-brand-950 dark:text-gray-100">{step.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeTour}
                className="grid h-9 w-9 place-items-center border border-brand-950/10 text-brand-950/55 hover:bg-cream-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-dark-hover"
                aria-label="Close tour"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm leading-6 text-brand-950/62 dark:text-gray-400">{step.body}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  closeTour()
                  setHelpOpen(true)
                }}
                className="inline-flex items-center gap-2 text-sm font-black text-brand-950/60 hover:text-brand-950 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <HelpCircle size={16} /> Open page help
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!canGoBack}
                  onClick={() => setTourIndex((value) => Math.max(0, value - 1))}
                  className="inline-flex items-center gap-2 border border-brand-950/10 px-4 py-2 text-sm font-black text-brand-950 disabled:opacity-35 dark:border-white/10 dark:text-gray-100"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (canGoNext) setTourIndex((value) => value + 1)
                    else closeTour()
                  }}
                  className="inline-flex items-center gap-2 border border-[#D4AF37]/40 bg-[#D4AF37] px-4 py-2 text-sm font-black text-[#001B50]"
                >
                  {canGoNext ? 'Next' : 'Done'} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-[85]">
          <button
            type="button"
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-[1px]"
            aria-label="Close help"
            onClick={() => setHelpOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(92vw,430px)] flex-col border-l border-brand-950/10 bg-cream-50 shadow-[0_24px_70px_rgba(0,27,80,0.24)] dark:border-dark-border dark:bg-dark-card">
            <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-brand-950 to-[#D4AF37]" />
            <div className="border-b border-brand-950/10 p-5 dark:border-dark-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">Page help</p>
                  <h2 className="text-xl font-black text-brand-950 dark:text-gray-100">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-950/58 dark:text-gray-400">{topic.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="grid h-9 w-9 place-items-center border border-brand-950/10 text-brand-950/55 hover:bg-cream-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-dark-hover"
                  aria-label="Close help"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={speaking ? stopSpeech : speakTopic}
                  className="inline-flex items-center justify-center gap-2 border border-[#D4AF37]/40 bg-[#D4AF37] px-3 py-2 text-sm font-black text-[#001B50]"
                >
                  {speaking ? <Pause size={15} /> : <Volume2 size={15} />}
                  {speaking ? 'Stop' : 'Listen'}
                </button>
                <button
                  type="button"
                  onClick={() => { setHelpOpen(false); navigate('/help') }}
                  className="inline-flex items-center justify-center gap-2 border border-brand-950/10 px-3 py-2 text-sm font-black text-brand-950 dark:border-white/10 dark:text-gray-100"
                >
                  <BookOpen size={15} /> Library
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">What this page does</h3>
                <div className="space-y-2">
                  {topic.sections.map((section) => (
                    <p key={section} className="border border-brand-950/10 bg-cream-100/45 p-3 text-sm leading-6 text-brand-950/68 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300">
                      {section}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Good next actions</h3>
                <div className="space-y-2">
                  {topic.actions.map((action) => (
                    <p key={action} className="border-l-2 border-[#D4AF37] bg-[#D4AF37]/10 p-3 text-sm font-semibold leading-6 text-brand-950/70 dark:text-gray-300">
                      {action}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
