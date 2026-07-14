import type { EddyMode } from '../types'
import { EddyCharacter } from './EddyCharacter'

interface EddyFaceProps {
  mode: EddyMode
  onActivate: () => void
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
        <EddyCharacter mode={mode} />
      </button>
    </div>
  )
}
