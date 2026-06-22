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
