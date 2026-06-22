import { useEffect, useRef, useState, createElement } from 'react'
import MDEditorComponent from '@uiw/react-md-editor'
import AIWritingAssistant, { type TextSelection } from './AIWritingAssistant'

const MDEditor = MDEditorComponent
const MDPreview = MDEditorComponent.Markdown

interface MarkdownEditorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  height?: number
  helperText?: string
  aiAssistant?: boolean | { contextLabel?: string }
}

function getEditorColorMode(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export default function MarkdownEditor({ label, value, onChange, height = 300, helperText, aiAssistant = true }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(getEditorColorMode)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const showAiAssistant = aiAssistant !== false
  const contextLabel = typeof aiAssistant === 'object' && aiAssistant.contextLabel ? aiAssistant.contextLabel : label ?? 'Markdown content field'

  useEffect(() => {
    const root = document.documentElement
    const syncColorMode = () => setColorMode(getEditorColorMode())
    const observer = new MutationObserver(syncColorMode)

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    syncColorMode()

    return () => observer.disconnect()
  }, [])

  const getSelection = (): TextSelection | null => {
    const textarea = shellRef.current?.querySelector('textarea')
    if (!textarea || textarea.selectionStart === textarea.selectionEnd) return null
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: value.slice(textarea.selectionStart, textarea.selectionEnd),
    }
  }

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-bold text-brand-950/75 dark:text-gray-300">{label}</label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-2.5 py-1 font-bold transition-colors ${mode === 'edit' ? 'bg-cream-100 text-brand-950 dark:bg-brand-900/30 dark:text-brand-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-2.5 py-1 font-bold transition-colors ${mode === 'preview' ? 'bg-cream-100 text-brand-950 dark:bg-brand-900/30 dark:text-brand-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Preview
            </button>
          </div>
        </div>
      )}
      {showAiAssistant && mode === 'edit' && (
        <AIWritingAssistant
          value={value}
          onChange={onChange}
          getSelection={getSelection}
          contextLabel={contextLabel}
          contentType="markdown"
          className="mb-2"
        />
      )}
      <div ref={shellRef} className="markdown-editor-shell" data-color-mode={colorMode}>
        {mode === 'edit' ? (
          createElement(MDEditor, {
            value,
            onChange: (v?: string) => onChange(v || ''),
            height,
            preview: 'edit',
            hideToolbar: false,
          })
        ) : (
          <div className="admin-card-surface markdown-editor-preview min-h-[200px] max-w-none p-4">
            {createElement(MDPreview, { source: value })}
          </div>
        )}
      </div>
      {helperText && <p className="text-xs text-brand-950/45 dark:text-gray-500 mt-1.5">{helperText}</p>}
    </div>
  )
}
