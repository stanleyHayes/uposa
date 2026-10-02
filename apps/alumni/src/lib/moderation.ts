import type { ReportReason } from '../types'

// Plain-language report reasons, in the order shown to members.
export const REPORT_REASONS: Array<{ value: ReportReason; label: string; hint: string }> = [
  { value: 'SPAM', label: 'Spam or scam', hint: 'Advertising, fraud or repeated unwanted posts' },
  { value: 'HARASSMENT', label: 'Harassment or bullying', hint: 'Targeting, insulting or intimidating someone' },
  { value: 'HATE', label: 'Hate or discrimination', hint: 'Attacks on tribe, ethnicity, religion, gender or other identity' },
  { value: 'SEXUAL', label: 'Sexual or explicit content', hint: 'Nudity, sexual content or solicitation' },
  { value: 'VIOLENCE', label: 'Violence or threats', hint: 'Threats, encouraging harm or graphic violence' },
  { value: 'MISLEADING', label: 'False or misleading', hint: 'Fake jobs, impersonation or misinformation' },
  { value: 'OTHER', label: 'Something else', hint: 'Tell us what is wrong in the details box' },
]

export const REPORT_CONFIRMATION = 'Thanks. Our moderators will review this within 24 hours.'
export const BLOCK_EXPLANATION = "You won't see their posts, comments or jobs, and they won't appear in your directory."

/** Server message from an axios error, if any. */
export function apiErrorMessage(err: unknown): string | undefined {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
}
