import type { EddyMode } from '../types'

interface EddyFaceProps {
  mode: EddyMode
  onActivate: () => void
}

const INSTRUCTION: Record<EddyMode, string> = {
  idle: 'Clicca su Eddy e parla',
  listening: 'Ti ascolto… clicca di nuovo quando hai finito',
  loading: 'Eddy sta elaborando una risposta…',
  speaking: 'Eddy sta rispondendo… clicca per interromperlo',
}

const ARIA_LABEL: Record<EddyMode, string> = {
  idle: 'Parla con Eddy',
  listening: 'Invia la domanda vocale',
  loading: 'Eddy sta elaborando la risposta',
  speaking: 'Eddy sta rispondendo, clicca per interromperlo',
}

export function EddyFace({ mode, onActivate }: EddyFaceProps) {
  // Ignore clicks while the request is in flight; every other state is actionable.
  const disabled = mode === 'loading'

  return (
    <div className={`eddy-face eddy-face--${mode}`}>
      <button
        type="button"
        className="eddy-face__button"
        onClick={onActivate}
        disabled={disabled}
        aria-label={ARIA_LABEL[mode]}
      >
        <img className="eddy-face__image" src="/eddy.svg" alt="Eddy" width={180} height={210} />
      </button>
      <p className="eddy-face__instruction" aria-live="polite">
        {INSTRUCTION[mode]}
      </p>
    </div>
  )
}
