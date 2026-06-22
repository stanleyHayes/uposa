import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, BookOpen, Map, Pause, Volume2 } from 'lucide-react'
import { alumniHelpTopics, topicToSpeech } from '../../components/help/helpContent'
import { replayAlumniTour } from '../../components/help/helpEvents'

function speak(text: string, onDone: () => void) {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.94
  utterance.onend = onDone
  utterance.onerror = onDone
  window.speechSynthesis.speak(utterance)
  return true
}

export default function HelpPage() {
  const navigate = useNavigate()
  const [speakingTopic, setSpeakingTopic] = useState<string | null>(null)

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  const toggleSpeech = (topicId: string) => {
    if (speakingTopic === topicId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setSpeakingTopic(null)
      return
    }
    const topic = alumniHelpTopics.find((item) => item.id === topicId)
    if (!topic) return
    const started = speak(topicToSpeech(topic), () => setSpeakingTopic(null))
    if (started) setSpeakingTopic(topicId)
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-primary/10 bg-primary p-6 text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.22)] md:p-8">
        <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 object-contain opacity-[0.05]" />
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-secondary">Help library</p>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Know what every member page is for.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-content/66">
              Use this as the alumni portal guide. Every topic can be read aloud with browser text-to-speech.
            </p>
          </div>
          <button
            type="button"
            onClick={replayAlumniTour}
            className="inline-flex items-center justify-center gap-2 border border-secondary/40 bg-secondary px-5 py-3 text-sm font-black text-primary"
          >
            <Map size={17} /> Replay dashboard tour
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {alumniHelpTopics.map((topic) => (
          <article key={topic.id} className="flex min-h-[260px] flex-col overflow-hidden border border-primary/10 bg-base-100 shadow-[0_18px_55px_rgba(0,27,80,0.08)]">
            <div className="border-b border-base-300/70 p-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-secondary">{topic.routeLabel}</p>
              <h2 className="text-lg font-black text-base-content">{topic.title}</h2>
              <p className="mt-3 text-sm leading-6 text-base-content/58">{topic.summary}</p>
            </div>
            <div className="flex flex-1 flex-col justify-between p-5">
              <ul className="space-y-2">
                {topic.sections.slice(0, 2).map((section) => (
                  <li key={section} className="text-sm leading-6 text-base-content/62">
                    {section}
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleSpeech(topic.id)}
                  className="inline-flex items-center justify-center gap-2 border border-secondary/35 bg-secondary/12 px-3 py-2 text-sm font-black text-base-content"
                >
                  {speakingTopic === topic.id ? <Pause size={15} /> : <Volume2 size={15} />}
                  {speakingTopic === topic.id ? 'Stop' : 'Listen'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(topic.paths?.[0] ?? topic.startsWith?.[0] ?? '/dashboard')}
                  className="inline-flex items-center justify-center gap-2 border border-primary/10 px-3 py-2 text-sm font-black text-base-content"
                >
                  Open <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="border border-primary/10 bg-base-100 p-5 shadow-[0_18px_55px_rgba(0,27,80,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center bg-secondary/18 text-secondary">
              <BookOpen size={20} />
            </span>
            <div>
              <h2 className="font-black text-base-content">Page help is also in the profile menu.</h2>
              <p className="mt-1 text-sm text-base-content/55">Open it from any screen for context-specific guidance.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 border border-primary/10 px-4 py-2 text-sm font-black text-base-content"
          >
            Back to dashboard <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  )
}
