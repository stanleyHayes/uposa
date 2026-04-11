import { useState, createElement } from 'react'
import MDEditorComponent from '@uiw/react-md-editor'

// Workaround for React 18 type mismatch with the library
const MDEditor = MDEditorComponent as any
const MDPreview = (MDEditorComponent as any).Markdown

interface MarkdownEditorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  height?: number
  helperText?: string
}

export default function MarkdownEditor({ label, value, onChange, height = 300, helperText }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-2.5 py-1 rounded-md transition-colors ${mode === 'edit' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-2.5 py-1 rounded-md transition-colors ${mode === 'preview' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Preview
            </button>
          </div>
        </div>
      )}
      <div data-color-mode="light">
        {mode === 'edit' ? (
          createElement(MDEditor, {
            value,
            onChange: (v: string) => onChange(v || ''),
            height,
            preview: 'edit',
            hideToolbar: false,
          })
        ) : (
          <div className="border rounded-lg p-4 min-h-[200px] prose prose-sm max-w-none dark:prose-invert bg-white dark:bg-dark-card">
            {createElement(MDPreview, { source: value })}
          </div>
        )}
      </div>
      {helperText && <p className="text-xs text-gray-400 mt-1.5">{helperText}</p>}
    </div>
  )
}
