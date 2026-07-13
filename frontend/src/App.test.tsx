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

  it('renders Eddy static image and the question input', () => {
    render(<App />)

    expect(screen.getByAltText('Eddy')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Eddy' })).toBeInTheDocument()
    expect(screen.getByLabelText('Chiedi qualcosa a Eddy')).toBeInTheDocument()
  })

  it('shows the loading state while in flight, then the response', async () => {
    const user = userEvent.setup()
    let resolveFetch: (value: unknown) => void = () => {}
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    ) as unknown as typeof fetch

    render(<App />)
    await user.type(screen.getByLabelText('Chiedi qualcosa a Eddy'), 'Che tempo fa?')
    await user.click(screen.getByRole('button', { name: 'Chiedi a Eddy' }))

    expect(screen.getByText("Eddy sta elaborando una battuta all'altezza...")).toBeInTheDocument()

    resolveFetch({ ok: true, status: 200, json: async () => ({ id: 'r_001', text: 'Fatto.' }) })

    expect(await screen.findByText('Fatto.')).toBeInTheDocument()
  })

  it('keeps only the last N exchanges in history', async () => {
    const user = userEvent.setup()
    const input = () => screen.getByLabelText('Chiedi qualcosa a Eddy')
    const button = () => screen.getByRole('button', { name: 'Chiedi a Eddy' })
    render(<App />)

    for (let i = 0; i < 12; i++) {
      globalThis.fetch = mockFetchOnce({ id: `r_${i}`, text: `Risposta ${i}` }) as unknown as typeof fetch
      await user.clear(input())
      await user.type(input(), `Domanda ${i}`)
      await user.click(button())
      await waitFor(() => expect(screen.getByText(`Risposta ${i}`)).toBeInTheDocument())
    }

    const historyQuestions = screen.getAllByText(/^Tu: Domanda/)
    expect(historyQuestions).toHaveLength(10)
    expect(screen.queryByText('Tu: Domanda 0')).not.toBeInTheDocument()
    expect(screen.getByText('Tu: Domanda 11')).toBeInTheDocument()
  })

  it('shows an in-character error message when the API call fails, without crashing', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('network down')) as unknown as typeof fetch

    render(<App />)
    await user.type(screen.getByLabelText('Chiedi qualcosa a Eddy'), 'Ci sei?')
    await user.click(screen.getByRole('button', { name: 'Chiedi a Eddy' }))

    expect(await screen.findByText('I miei circuiti fanno i capricci. Riprova, umano.')).toBeInTheDocument()
  })
})
