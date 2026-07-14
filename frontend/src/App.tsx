import { useState } from 'react'
import './App.css'
import { askEddy } from './api'
import { EddyFace } from './components/EddyFace'
import { cancelSpeech, speak } from './speech'
import type { EddyMode } from './types'

const ERROR_MESSAGE = 'I miei circuiti fanno i capricci. Riprova, umano.'
// The spoken question is not transcribed (§3): the backend receives this placeholder.
const VOICE_PLACEHOLDER = '🎤 Domanda vocale'

export function App() {
  const [lastResponseId, setLastResponseId] = useState<string | null>(null)
  const [mode, setMode] = useState<EddyMode>('idle')

  async function ask() {
    setMode('loading')

    try {
      const response = await askEddy(VOICE_PLACEHOLDER, lastResponseId)
      setLastResponseId(response.id)
      setMode('speaking')
      speak(response.text, { onEnd: () => setMode('idle') })
    } catch {
      // No on-screen text (character-only UI): the error is spoken instead of displayed.
      setMode('speaking')
      speak(ERROR_MESSAGE, { onEnd: () => setMode('idle') })
    }
  }

  // Single entry point driven by the current state:
  // idle → start listening; listening → send; speaking → stop and listen again.
  function handleEddyClick() {
    switch (mode) {
      case 'idle':
        setMode('listening')
        break
      case 'listening':
        void ask()
        break
      case 'speaking':
        cancelSpeech()
        setMode('listening')
        break
      case 'loading':
        break
    }
  }

  return (
    <main className="app">
      <EddyFace mode={mode} onActivate={handleEddyClick} />
    </main>
  )
}
