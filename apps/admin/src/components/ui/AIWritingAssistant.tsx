import { BouncingDots } from "./BouncingDots";
import { useMemo, useState } from 'react'
import { ArrowDownToLine, Check, Clipboard, Copy, Sparkles, Trash2 } from 'lucide-react'
import { adminAiApi, type AIWritingAction } from '../../api/services'
import { cn } from '../../utils/cn'

export interface TextSelection {
  start: number
  end: number
  text: string
}

interface AIWritingAssistantProps {
  value: string
  onChange: (value: string) => void
  getSelection?: () => TextSelection | null
  contextLabel?: string
  contentType?: 'plain' | 'markdown'
  disabled?: boolean
  className?: string
}

interface WritingResult {
  output: string
  usage?: {
    limit: number
    remaining: number
    resetAt: string
  }
}

const actions: Array<{ value: AIWritingAction; label: string; needsPrompt?: boolean; needsLanguage?: boolean }> = [
  { value: 'formalize', label: 'Formalize text' },
  { value: 'summarize', label: 'Summarize text' },
  { value: 'make_casual', label: 'Make casual' },
  { value: 'expand', label: 'Expand text' },
  { value: 'fix_grammar', label: 'Fix grammar' },
  { value: 'create_from_prompt', label: 'Create from prompt', needsPrompt: true },
  { value: 'improve_clarity', label: 'Improve clarity' },
  { value: 'generate_title', label: 'Generate title/headline' },
  { value: 'generate_message', label: 'Generate email/message', needsPrompt: true },
  { value: 'translate', label: 'Translate text', needsLanguage: true },
]

const languageOptions = ['English', 'Twi', 'Ga', 'Ewe', 'French', 'Spanish', 'German']

function getErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) return 'AI writing failed. Try again.'
  const response = 'response' in error ? error.response : undefined
  if (typeof response !== 'object' || response === null) return 'AI writing failed. Try again.'
  const data = 'data' in response ? response.data : undefined
  if (typeof data !== 'object' || data === null) return 'AI writing failed. Try again.'
  const message = 'message' in data ? data.message : undefined
  return typeof message === 'string' ? message : 'AI writing failed. Try again.'
}

function formatResetTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AIWritingAssistant({
  value,
  onChange,
  getSelection,
  contextLabel = 'Admin content field',
  contentType = 'plain',
  disabled = false,
  className,
}: AIWritingAssistantProps) {
  const [action, setAction] = useState<AIWritingAction>('improve_clarity')
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState('English')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<WritingResult | null>(null)
  const [resultSelection, setResultSelection] = useState<TextSelection | null>(null)

  const selectedAction = useMemo(() => actions.find((item) => item.value === action) ?? actions[0], [action])

  const currentSelection = () => {
    const selection = getSelection?.()
    return selection?.text.trim() ? selection : null
  }

  const runAssistant = async () => {
    const selection = currentSelection()
    const targetText = selection?.text || value

    if (!targetText.trim() && !prompt.trim()) {
      setError('Add text or describe what you want AI to create.')
      return
    }

    setLoading(true)
    setError('')
    setCopied(false)

    try {
      const response = await adminAiApi.write({
        action,
        text: targetText,
        fullText: value,
        prompt,
        language,
        fieldContext: contextLabel,
        contentType,
      })
      const data = response.data.data
      if (!data?.output) throw new Error('No AI output returned')
      setResult({ output: data.output, usage: data.usage })
      setResultSelection(selection)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const replaceText = () => {
    if (!result) return
    const hasExistingText = resultSelection?.text || value.trim()
    if (hasExistingText && !window.confirm('Replace the current text with the AI suggestion?')) return

    if (resultSelection) {
      onChange(`${value.slice(0, resultSelection.start)}${result.output}${value.slice(resultSelection.end)}`)
    } else {
      onChange(result.output)
    }
    setResult(null)
  }

  const insertBelow = () => {
    if (!result) return
    if (resultSelection) {
      onChange(`${value.slice(0, resultSelection.end)}\n\n${result.output}${value.slice(resultSelection.end)}`)
    } else {
      onChange([value.trimEnd(), result.output].filter(Boolean).join('\n\n'))
    }
    setResult(null)
  }

  const copyResult = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.output)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Could not copy the suggestion.')
    }
  }

  return (
    <div className={cn('border border-brand-950/10 bg-cream-50/70 dark:border-white/10 dark:bg-white/[0.03]', className)}>
      <div className="flex flex-col gap-2 p-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-950/55 dark:text-cream-100/55">
          <Sparkles size={14} className="text-cream-600 dark:text-cream-400" />
          AI writing
        </div>

        <div className="grid flex-1 gap-2 md:grid-cols-[minmax(12rem,0.8fr)_minmax(14rem,1fr)_auto]">
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value as AIWritingAction)
              setError('')
            }}
            disabled={disabled || loading}
            className="h-9 border border-brand-950/10 bg-white px-2 text-xs font-bold text-brand-950 outline-none transition-colors focus:border-cream-500 dark:border-white/10 dark:bg-dark-hover dark:text-gray-100"
          >
            {actions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          {selectedAction.needsLanguage ? (
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={disabled || loading}
              className="h-9 border border-brand-950/10 bg-white px-2 text-xs font-bold text-brand-950 outline-none transition-colors focus:border-cream-500 dark:border-white/10 dark:bg-dark-hover dark:text-gray-100"
            >
              {languageOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : selectedAction.needsPrompt ? (
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={disabled || loading}
              placeholder={action === 'generate_message' ? 'Describe the audience, purpose, and channel...' : 'Describe what you want written...'}
              className="h-9 border border-brand-950/10 bg-white px-3 text-xs font-semibold text-brand-950 outline-none transition-colors placeholder:text-brand-950/35 focus:border-cream-500 dark:border-white/10 dark:bg-dark-hover dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          ) : (
            <p className="flex min-h-9 items-center border border-transparent px-1 text-xs font-semibold text-brand-950/45 dark:text-gray-500">
              Uses selected text first, otherwise the full field.
            </p>
          )}

          <button
            type="button"
            onClick={runAssistant}
            disabled={disabled || loading}
            className="inline-flex h-9 items-center justify-center gap-2 bg-brand-950 px-3 text-xs font-black text-cream-100 transition-colors hover:bg-cream-500 hover:text-brand-950 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cream-100 dark:text-brand-950 dark:hover:bg-cream-500"
          >
            {loading ? <BouncingDots /> : <Sparkles size={14} />}
            {loading ? 'Writing' : 'Run'}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-t border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="border-t border-brand-950/10 bg-white/70 p-3 dark:border-white/10 dark:bg-dark-card/75">
          <div className="max-h-56 overflow-auto whitespace-pre-wrap border border-brand-950/10 bg-cream-50 p-3 text-sm leading-6 text-brand-950 dark:border-white/10 dark:bg-dark-hover dark:text-gray-100">
            {result.output}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-bold text-brand-950/45 dark:text-gray-500">
              {resultSelection ? 'Previewing a rewrite for selected text.' : 'Previewing a suggestion for the full field.'}
              {result.usage ? ` ${result.usage.remaining}/${result.usage.limit} uses left until ${formatResetTime(result.usage.resetAt)}.` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={replaceText} className="inline-flex items-center gap-1.5 bg-brand-950 px-3 py-2 text-xs font-black text-cream-100 hover:bg-cream-500 hover:text-brand-950 dark:bg-cream-100 dark:text-brand-950">
                <Check size={13} /> Replace
              </button>
              <button type="button" onClick={insertBelow} className="inline-flex items-center gap-1.5 border border-brand-950/10 px-3 py-2 text-xs font-black text-brand-950 hover:border-cream-500 hover:bg-cream-100 dark:border-white/10 dark:text-gray-100 dark:hover:bg-white/10">
                <ArrowDownToLine size={13} /> Insert below
              </button>
              <button type="button" onClick={copyResult} className="inline-flex items-center gap-1.5 border border-brand-950/10 px-3 py-2 text-xs font-black text-brand-950 hover:border-cream-500 hover:bg-cream-100 dark:border-white/10 dark:text-gray-100 dark:hover:bg-white/10">
                {copied ? <Clipboard size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={() => setResult(null)} className="inline-flex items-center gap-1.5 border border-brand-950/10 px-3 py-2 text-xs font-black text-brand-950/60 hover:bg-brand-950/5 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10">
                <Trash2 size={13} /> Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
