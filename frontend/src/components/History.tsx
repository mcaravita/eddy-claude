import type { Exchange } from '../types'

interface HistoryProps {
  exchanges: Exchange[]
}

export function History({ exchanges }: HistoryProps) {
  if (exchanges.length === 0) {
    return null
  }

  return (
    <section className="history" aria-label="Storico delle domande">
      <h2 className="history__title">Ultimi scambi</h2>
      <ul className="history__list">
        {exchanges.map((exchange) => (
          <li key={exchange.exchangeId} className="history__item">
            <p className="history__question">Tu: {exchange.question}</p>
            <p className="history__answer">Eddy: {exchange.response.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
