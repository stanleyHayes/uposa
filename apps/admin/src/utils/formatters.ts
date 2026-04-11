import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(dateStr: string): string {
  try { return format(new Date(dateStr), 'dd MMM yyyy') } catch { return dateStr }
}

export function formatDateTime(dateStr: string): string {
  try { return format(new Date(dateStr), 'dd MMM yyyy, HH:mm') } catch { return dateStr }
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
