import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom does not implement the Web Speech API; provide a minimal on-device stub
// so the TTS layer (src/speech.ts) can run under tests.
class MockSpeechSynthesisUtterance {
  text: string
  lang = ''
  voice: SpeechSynthesisVoice | null = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

const speechSynthesisMock = {
  speak(utterance: MockSpeechSynthesisUtterance) {
    // Simulate immediate synthesis so callers advance start → end.
    utterance.onstart?.()
    utterance.onend?.()
  },
  cancel() {},
  getVoices(): SpeechSynthesisVoice[] {
    return []
  },
}

vi.stubGlobal('speechSynthesis', speechSynthesisMock)
vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance)
