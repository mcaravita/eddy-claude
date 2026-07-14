import { useState } from 'react'
import './App.css'
import { askEddy } from './api'
import { EddyFace } from './components/EddyFace'
import { History } from './components/History'
import { ResponseBubble } from './components/ResponseBubble'
import { HISTORY_SIZE } from './config'
import { cancelSpeech, speak } from './speech'
import type { EddyMode, Exchange } from './types'

const ERROR_MESSAGE = 'I miei circuiti fanno i capricci. Riprova, umano.'
// The spoken question is not transcribed (§3): the history shows this placeholder.
const VOICE_PLACEHOLDER = '🎤 Domanda vocale'

export function App() {
  const [currentText, setCurrentText] = useState<string | null>(null)
  const [lastResponseId, setLastResponseId] = useState<string | null>(null)
  const [history, setHistory] = useState<Exchange[]>([])
  const [mode, setMode] = useState<EddyMode>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [nextExchangeId, setNextExchangeId] = useState(0)

  async function ask() {
    setMode('loading')
    setErrorMessage(null)

    try {
      const response = await askEddy(VOICE_PLACEHOLDER, lastResponseId)
      setCurrentText(response.text)
      setLastResponseId(response.id)
      setHistory((prev) =>
        [{ exchangeId: nextExchangeId, question: VOICE_PLACEHOLDER, response }, ...prev].slice(
          0,
          HISTORY_SIZE,
        ),
      )
      setNextExchangeId((id) => id + 1)
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
      <History exchanges={history} />
    </main>
  )
}
