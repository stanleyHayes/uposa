const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function fetchSiteData() {
  // Time the request out so an unreachable API (e.g. a stale/localhost
  // VITE_API_URL in production) surfaces as an error instead of hanging forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${API_BASE}/public/site-data`, { signal: controller.signal });
    if (!res.ok) throw new Error('Failed to fetch site data');
    const json = await res.json();
    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function submitContact(data: { name: string; email: string; subject: string; message: string }) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to send message');
  return json;
}

export async function registerMember(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Registration failed');
  return json;
}

export async function submitTranscriptRequest(data: { fullName: string; email: string; phone?: string; yearGroup: string; notes?: string }) {
  const res = await fetch(`${API_BASE}/transcripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to submit transcript request');
  return json;
}

export async function subscribeNewsletter(email: string) {
  const res = await fetch(`${API_BASE}/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to subscribe');
  return json;
}

export async function getPlatformFeePreview(amount: number) {
  const res = await fetch(`${API_BASE}/payments/platform-fee?amount=${amount}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch fee preview');
  return json.data;
}

export async function rsvpToEvent(eventId: string, data: { name: string; email: string; phone?: string }) {
  const res = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to RSVP');
  return json;
}
