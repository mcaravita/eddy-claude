import { useState } from 'react'
import './App.css'
import { askEddy } from './api'
import { EddyFace } from './components/EddyFace'
import { ResponseBubble } from './components/ResponseBubble'
import { cancelSpeech, speak } from './speech'
import type { EddyMode } from './types'

const ERROR_MESSAGE = 'I miei circuiti fanno i capricci. Riprova, umano.'
// The spoken question is not transcribed (§3): the backend receives this placeholder.
const VOICE_PLACEHOLDER = '🎤 Domanda vocale'

export function App() {
  const [currentText, setCurrentText] = useState<string | null>(null)
  const [lastResponseId, setLastResponseId] = useState<string | null>(null)
  const [mode, setMode] = useState<EddyMode>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function ask() {
    setMode('loading')
    setErrorMessage(null)

    try {
      const response = await askEddy(VOICE_PLACEHOLDER, lastResponseId)
      setCurrentText(response.text)
      setLastResponseId(response.id)
      setMode('speaking')
      speak(response.text, { onEnd: () => setMode('idle') })
    } catch {
      setErrorMessage(ERROR_MESSAGE)
      setMode('idle')
    }
  }

  // Single entry point driven by the current state:
  // idle → start listening; listening → send; speaking → stop and listen again.
  function handleEddyClick() {
    switch (mode) {
      case 'idle':
        setErrorMessage(null)
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
      <ResponseBubble text={errorMessage ?? currentText} loading={mode === 'loading'} />
    </main>
  )
}
