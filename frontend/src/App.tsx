import { useState } from 'react'
import './App.css'
import { askEddy } from './api'
import { AskForm } from './components/AskForm'
import { EddyFace } from './components/EddyFace'
import { History } from './components/History'
import { ResponseBubble } from './components/ResponseBubble'
import { HISTORY_SIZE } from './config'
import type { Exchange } from './types'

const ERROR_MESSAGE = 'I miei circuiti fanno i capricci. Riprova, umano.'

export function App() {
  const [currentText, setCurrentText] = useState<string | null>(null)
  const [lastResponseId, setLastResponseId] = useState<string | null>(null)
  const [history, setHistory] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [nextExchangeId, setNextExchangeId] = useState(0)

  async function handleAsk(question: string) {
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await askEddy(question, lastResponseId)
      setCurrentText(response.text)
      setLastResponseId(response.id)
      setHistory((prev) =>
        [{ exchangeId: nextExchangeId, question, response }, ...prev].slice(0, HISTORY_SIZE),
      )
      setNextExchangeId((id) => id + 1)
    } catch {
      setErrorMessage(ERROR_MESSAGE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app">
      <EddyFace active={loading} />
      <AskForm onSubmit={handleAsk} disabled={loading} />
      <ResponseBubble text={errorMessage ?? currentText} loading={loading} />
      <History exchanges={history} />
    </main>
  )
}
