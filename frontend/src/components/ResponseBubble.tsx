interface ResponseBubbleProps {
  text: string | null
  loading: boolean
}

export function ResponseBubble({ text, loading }: ResponseBubbleProps) {
  return (
    <div className="response-bubble" aria-live="polite">
      {loading ? (
        <p className="response-bubble__loading">Eddy sta elaborando una battuta all'altezza...</p>
      ) : text ? (
        <p className="response-bubble__text">{text}</p>
      ) : (
        <p className="response-bubble__placeholder">Fai una domanda, se ci riesci.</p>
      )}
    </div>
  )
}
