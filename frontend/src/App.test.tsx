import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders Eddy and the voice call-to-action', () => {
    render(<App />)

    expect(screen.getByRole('img', { name: 'Eddy' })).toBeInTheDocument()
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
