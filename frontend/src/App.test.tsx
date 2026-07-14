import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

function mockFetchOnce(response: unknown) {
  return vi.fn().mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => response,
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders Eddy and the voice call-to-action', () => {
    render(<App />)

    expect(screen.getByAltText('Eddy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Parla con Eddy' })).toBeInTheDocument()
    expect(screen.getByText('Clicca su Eddy e parla')).toBeInTheDocument()
  })

  it('speaks the response after two clicks on Eddy, showing the loading state in between', async () => {
    const user = userEvent.setup()
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak')
    let resolveFetch: (value: unknown) => void = () => {}
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    ) as unknown as typeof fetch

    render(<App />)
    const eddy = screen.getByRole('button')
    await user.click(eddy) // idle → listening
    await user.click(eddy) // listening → send

    expect(screen.getByText("Eddy sta elaborando una battuta all'altezza...")).toBeInTheDocument()

    resolveFetch({ ok: true, status: 200, json: async () => ({ id: 'r_001', text: 'Fatto.' }) })

    expect(await screen.findByText('Fatto.')).toBeInTheDocument()
    expect(speakSpy).toHaveBeenCalledTimes(1)
    expect(speakSpy.mock.calls[0][0].text).toBe('Fatto.')
  })

  it('keeps only the last N exchanges in history, labelled as voice questions', async () => {
    const user = userEvent.setup()
    render(<App />)
    const eddy = () => screen.getByRole('button')

    for (let i = 0; i < 12; i++) {
      globalThis.fetch = mockFetchOnce({ id: `r_${i}`, text: `Risposta ${i}` }) as unknown as typeof fetch
      await user.click(eddy()) // idle → listening
      await user.click(eddy()) // send
      await waitFor(() => expect(screen.getByText(`Risposta ${i}`)).toBeInTheDocument())
    }

    const historyQuestions = screen.getAllByText('Tu: 🎤 Domanda vocale')
    expect(historyQuestions).toHaveLength(10)
    expect(screen.getByText('Eddy: Risposta 11')).toBeInTheDocument()
    expect(screen.queryByText('Eddy: Risposta 0')).not.toBeInTheDocument()
  })

  it('shows an in-character error message when the API call fails, without crashing', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('network down')) as unknown as typeof fetch

    render(<App />)
    const eddy = screen.getByRole('button')
    await user.click(eddy) // idle → listening
    await user.click(eddy) // send

    expect(await screen.findByText('I miei circuiti fanno i capricci. Riprova, umano.')).toBeInTheDocument()
  })
})
