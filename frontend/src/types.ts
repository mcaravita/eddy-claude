export interface AskResponse {
  id: string
  text: string
}

// Interaction state of the voice flow: idle → listening → loading → speaking → idle.
export type EddyMode = 'idle' | 'listening' | 'loading' | 'speaking'
