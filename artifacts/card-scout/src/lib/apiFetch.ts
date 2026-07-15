/**
 * Drop-in replacement for `fetch` that:
 *  - Always includes credentials (session cookie)
 *  - Redirects to /api/login if the server returns 401 (session expired)
 */
function getLoginUrl() {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '') || '';
  return `/api/login?returnTo=${encodeURIComponent(base || '/')}`;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, {
    credentials: 'include',
    ...init,
  });

  if (res.status === 401) {
    window.location.href = getLoginUrl();
    // Return a never-resolving promise so callers don't process a 401 body
    return new Promise(() => {});
  }

  return res;
}
