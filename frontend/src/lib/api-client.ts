const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000')

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  try {
    const timeout = AbortSignal.timeout(20_000)
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout
    return await fetch(input, { ...init, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('The request took too long. Check your connection and try again.')
    }
    throw error
  }
}

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetchWithTimeout(`${apiBaseUrl}${path}`, init)
}
