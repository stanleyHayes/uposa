import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(dateStr: string): string {
  try { return format(new Date(dateStr), 'dd MMM yyyy') } catch { return dateStr }
}

export function formatDateTime(dateStr: string): string {
  try { return format(new Date(dateStr), 'dd MMM yyyy, HH:mm') } catch { return dateStr }
}

/** ISO timestamp -> `<input type="datetime-local">` value in the browser's local time ('' if unset/invalid). */
export function toDateTimeLocal(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatTimeAgo(dateStr: string): string {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}
