interface ApiErrorBody {
  message?: string
  errors?: { field?: string; message?: string }[]
}

/**
 * Best human-readable message from an axios error. The API responds with
 * `{ message }`, plus `errors: [{ field, message }]` for validation failures
 * (where `message` is just "Validation failed").
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: ApiErrorBody } } | null)?.response?.data
  const first = data?.errors?.[0]
  if (first?.message) return first.field ? `${first.field}: ${first.message}` : first.message
  return data?.message || fallback
}
