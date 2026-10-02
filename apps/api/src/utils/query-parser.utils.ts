import querystring from 'querystring';

/**
 * Express "query parser": parses like Express 5's default ('simple', i.e.
 * node:querystring) but keeps only the first value of a repeated key. Every
 * handler treats query values as strings; `?status=a&status=b` used to produce
 * an array and crash them (`.toUpperCase is not a function` → 500).
 */
export function parseQueryFirstValue(str: string): Record<string, string> {
  const parsed = querystring.parse(str);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined) continue;
    result[key] = Array.isArray(value) ? value[0] ?? '' : value;
  }
  return result;
}
