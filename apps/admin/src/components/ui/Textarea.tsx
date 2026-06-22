import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import AIWritingAssistant, { type TextSelection } from './AIWritingAssistant'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  aiAssistant?: boolean | { contextLabel?: string }
}

const aiEligiblePattern = /\b(body|bio|content|description|excerpt|manifesto|message|mission|note|notes|policy|quote|reason|reminder|summary|testimonial|vision)\b/i
const aiExcludedPattern = /\b(email|gallery|image|link|password|phone|photo|slug|url)\b/i

function shouldShowAiAssistant(label?: string, name?: string, placeholder?: string) {
  const descriptor = [label, name, placeholder].filter(Boolean).join(' ')
  if (!descriptor || aiExcludedPattern.test(descriptor)) return false
  return aiEligiblePattern.test(descriptor)
}

function setNativeTextareaValue(element: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  descriptor?.set?.call(element, value)
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, rows = 4, aiAssistant, onChange, value, defaultValue, name, placeholder, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const innerRef = useRef<HTMLTextAreaElement | null>(null)
    const [currentValue, setCurrentValue] = useState(() => String(value ?? defaultValue ?? ''))
    const showAiAssistant = aiAssistant !== false && (typeof aiAssistant === 'object' || shouldShowAiAssistant(label, name, typeof placeholder === 'string' ? placeholder : undefined))
    const contextLabel = typeof aiAssistant === 'object' && aiAssistant.contextLabel ? aiAssistant.contextLabel : label ?? name ?? 'Admin text field'

    useEffect(() => {
      if (value !== undefined) setCurrentValue(String(value))
    }, [value])

    const setRefs = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentValue(event.currentTarget.value)
      onChange?.(event)
    }

    const getSelection = (): TextSelection | null => {
      const node = innerRef.current
      if (!node || node.selectionStart === node.selectionEnd) return null
      return {
        start: node.selectionStart,
        end: node.selectionEnd,
        text: node.value.slice(node.selectionStart, node.selectionEnd),
      }
    }

    const applyAiValue = (nextValue: string) => {
      const node = innerRef.current
      setCurrentValue(nextValue)
      if (node) {
        setNativeTextareaValue(node, nextValue)
      }
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          id={textareaId}
          name={name}
          placeholder={placeholder}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={cn(
            'block w-full border px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:bg-dark-hover shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'disabled:bg-gray-50 dark:disabled:bg-dark-card disabled:text-gray-500 disabled:cursor-not-allowed',
            error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600',
            className
          )}
          {...props}
        />
        {showAiAssistant && (
          <AIWritingAssistant
            value={currentValue}
            onChange={applyAiValue}
            getSelection={getSelection}
            contextLabel={contextLabel}
            disabled={props.disabled}
          />
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
