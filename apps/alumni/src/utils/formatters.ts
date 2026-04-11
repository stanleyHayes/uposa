import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'MMM d, yyyy h:mm a')
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatCurrency(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatEnum(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\bAnd\b/g, 'and')
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(text: string, length = 150) {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '...'
}
