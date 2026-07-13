import { useState, type FormEvent } from 'react'
import { QUESTION_MAX_LENGTH, QUESTION_MIN_LENGTH } from '../config'

interface AskFormProps {
  onSubmit: (question: string) => void
  disabled: boolean
}

export function AskForm({ onSubmit, disabled }: AskFormProps) {
  const [question, setQuestion] = useState('')
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = question.trim()

    if (trimmed.length < QUESTION_MIN_LENGTH) {
      setValidationMessage('Dai, scrivi qualcosa. Anche i bot hanno bisogno di input.')
      return
    }
    if (trimmed.length > QUESTION_MAX_LENGTH) {
      setValidationMessage(`Troppo lungo, umano. Massimo ${QUESTION_MAX_LENGTH} caratteri.`)
      return
    }

    setValidationMessage(null)
    onSubmit(trimmed)
    setQuestion('')
  }

  return (
    <form className="ask-form" onSubmit={handleSubmit} noValidate>
      <label className="ask-form__label" htmlFor="question-input">
        Chiedi qualcosa a Eddy
      </label>
      <div className="ask-form__row">
        <input
          id="question-input"
          className="ask-form__input"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={QUESTION_MAX_LENGTH}
          placeholder="Es. Che tempo fa?"
          disabled={disabled}
        />
        <button className="ask-form__button" type="submit" disabled={disabled}>
          Chiedi a Eddy
        </button>
      </div>
      {validationMessage && (
        <p className="ask-form__validation" role="alert">
          {validationMessage}
        </p>
      )}
    </form>
  )
}
