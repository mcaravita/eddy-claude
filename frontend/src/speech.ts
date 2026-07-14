// Text-to-speech on-device via Web Speech API. No network calls leave the device
// (constraint §3): the browser synthesizes speech using locally installed voices.

export interface SpeakCallbacks {
  onStart?: () => void
  onEnd?: () => void
}

/** True when the browser exposes the Speech Synthesis API (on-device TTS). */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickItalianVoice(): SpeechSynthesisVoice | undefined {
  try {
    const voices = window.speechSynthesis.getVoices() ?? []
    return voices.find((voice) => voice.lang?.toLowerCase().startsWith('it'))
  } catch {
    return undefined
  }
}

// Keep a handle on the active utterance so we can detach its listeners before
// cancelling: cancel() fires the "end" event, which would otherwise run onEnd
// and reset the caller's state even when the user is starting a new turn.
let currentUtterance: SpeechSynthesisUtterance | null = null

function detachCurrent(): void {
  if (currentUtterance) {
    currentUtterance.onstart = null
    currentUtterance.onend = null
    currentUtterance.onerror = null
    currentUtterance = null
  }
}

/**
 * Speaks `text` out loud with the device voice (Italian when available).
 * If TTS is unavailable, invokes onEnd immediately so the caller's state does
 * not get stuck (the response text stays visible on screen as a fallback).
 */
export function speak(text: string, callbacks: SpeakCallbacks = {}): void {
  const { onStart, onEnd } = callbacks

  if (!isSpeechSupported()) {
    onEnd?.()
    return
  }

  detachCurrent()
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'it-IT'
  const voice = pickItalianVoice()
  if (voice) {
    utterance.voice = voice
  }
  if (onStart) {
    utterance.onstart = () => onStart()
  }
  // onend covers both natural completion and interruption via cancel().
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

/** Immediately stops any ongoing speech without triggering the end callback. */
export function cancelSpeech(): void {
  if (!isSpeechSupported()) {
    return
  }
  detachCurrent()
  window.speechSynthesis.cancel()
}
