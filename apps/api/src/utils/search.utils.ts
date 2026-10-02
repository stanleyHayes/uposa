/**
 * Escape user-supplied input so it is treated as a LITERAL substring inside a
 * MongoDB `$regex` filter. Without this, a value like `(a+)+$` is compiled as a
 * regular expression and can trigger catastrophic backtracking (ReDoS), pinning
 * the database CPU. Escaping all metacharacters removes that vector and also
 * makes search behave as a plain case-insensitive substring match.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Canonical form for stored/compared emails. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Case-insensitive exact-match filter for an email. Accounts created before
 * emails were normalised may be stored mixed-case, so lookups can't rely on an
 * exact lowercase match. Anchored and regex-escaped (no partial/ReDoS matches).
 */
export function emailMatch(email: string): { $regex: string; $options: string } {
  return { $regex: `^${escapeRegex(normalizeEmail(email))}$`, $options: 'i' };
}
