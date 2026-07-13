import type { AskResponse } from './types'

export class EddyApiError extends Error {}

export async function askEddy(question: string, lastResponseId: string | null): Promise<AskResponse> {
  let res: Response
  try {
    res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        last_response_id: lastResponseId ?? undefined,
      }),
    })
  } catch {
    throw new EddyApiError('network_error')
  }

  if (!res.ok) {
    throw new EddyApiError(`http_${res.status}`)
  }

  return (await res.json()) as AskResponse
}
