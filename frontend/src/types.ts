export interface AskResponse {
  id: string
  text: string
}

export interface Exchange {
  exchangeId: number
  question: string
  response: AskResponse
}

// Interaction state of the voice flow: idle → listening → loading → speaking → idle.
export type EddyMode = 'idle' | 'listening' | 'loading' | 'speaking'
