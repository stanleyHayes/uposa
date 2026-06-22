import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Pause,
  Volume2,
  X,
} from 'lucide-react'
import { ALUMNI_HELP_EVENT, ALUMNI_TOUR_EVENT } from './helpEvents'
import { alumniTourSteps, getAlumniHelpTopic, topicToSpeech } from './helpContent'

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
  return `uposa-alumni-dashboard-tour-seen:${userKey || 'anonymous'}`
}

export default function HelpExperience({ userKey }: HelpExperienceProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const topic = useMemo(() => getAlumniHelpTopic(location.pathname), [location.pathname])
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

    window.addEventListener(ALUMNI_TOUR_EVENT, replay)
    window.addEventListener(ALUMNI_HELP_EVENT, openHelp)
    return () => {
      window.removeEventListener(ALUMNI_TOUR_EVENT, replay)
      window.removeEventListener(ALUMNI_HELP_EVENT, openHelp)
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
    const step = alumniTourSteps[tourIndex]

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

  const step = alumniTourSteps[tourIndex]
  const canGoBack = tourIndex > 0
  const canGoNext = tourIndex < alumniTourSteps.length - 1

  return (
    <>
      {tourOpen && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-primary/68 backdrop-blur-[2px]" />
          {highlight && (
            <div
              className="absolute border-2 border-secondary bg-secondary/10 shadow-[0_0_0_9999px_rgba(0,10,32,0.58),0_18px_60px_rgba(212,175,55,0.22)]"
              style={highlight}
            />
          )}
          <div className="absolute bottom-5 left-1/2 w-[min(92vw,520px)] -translate-x-1/2 border border-secondary/35 bg-base-100 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-secondary">
                  Show me around / Step {tourIndex + 1} of {alumniTourSteps.length}
                </p>
                <h2 className="text-xl font-black text-base-content">{step.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeTour}
                className="grid h-9 w-9 place-items-center border border-primary/10 text-base-content/55 hover:bg-base-200"
                aria-label="Close tour"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm leading-6 text-base-content/62">{step.body}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  closeTour()
                  setHelpOpen(true)
                }}
                className="inline-flex items-center gap-2 text-sm font-black text-base-content/60 hover:text-base-content"
              >
                <HelpCircle size={16} /> Open page help
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!canGoBack}
                  onClick={() => setTourIndex((value) => Math.max(0, value - 1))}
                  className="inline-flex items-center gap-2 border border-primary/10 px-4 py-2 text-sm font-black text-base-content disabled:opacity-35"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (canGoNext) setTourIndex((value) => value + 1)
                    else closeTour()
                  }}
                  className="inline-flex items-center gap-2 border border-secondary/40 bg-secondary px-4 py-2 text-sm font-black text-primary"
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
            className="absolute inset-0 bg-primary/40 backdrop-blur-[1px]"
            aria-label="Close help"
            onClick={() => setHelpOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(92vw,430px)] flex-col border-l border-primary/10 bg-base-100 shadow-[0_24px_70px_rgba(0,27,80,0.24)]">
            <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
            <div className="border-b border-base-300/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-secondary">Page help</p>
                  <h2 className="text-xl font-black text-base-content">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-base-content/58">{topic.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="grid h-9 w-9 place-items-center border border-primary/10 text-base-content/55 hover:bg-base-200"
                  aria-label="Close help"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={speaking ? stopSpeech : speakTopic}
                  className="inline-flex items-center justify-center gap-2 border border-secondary/40 bg-secondary px-3 py-2 text-sm font-black text-primary"
                >
                  {speaking ? <Pause size={15} /> : <Volume2 size={15} />}
                  {speaking ? 'Stop' : 'Listen'}
                </button>
                <button
                  type="button"
                  onClick={() => { setHelpOpen(false); navigate('/help') }}
                  className="inline-flex items-center justify-center gap-2 border border-primary/10 px-3 py-2 text-sm font-black text-base-content"
                >
                  <BookOpen size={15} /> Library
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-base-content/45">What this page does</h3>
                <div className="space-y-2">
                  {topic.sections.map((section) => (
                    <p key={section} className="border border-primary/10 bg-base-200/45 p-3 text-sm leading-6 text-base-content/68">
                      {section}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-base-content/45">Good next actions</h3>
                <div className="space-y-2">
                  {topic.actions.map((action) => (
                    <p key={action} className="border-l-2 border-secondary bg-secondary/10 p-3 text-sm font-semibold leading-6 text-base-content/70">
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
