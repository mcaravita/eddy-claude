import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders only the character, with an accessible call-to-action', () => {
    render(<App />)

    expect(screen.getByRole('img', { name: 'Eddy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Parla con Eddy' })).toBeInTheDocument()
  })

  it('speaks the response after two clicks on Eddy, disabling the button while loading', async () => {
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

    expect(screen.getByRole('button', { name: 'Eddy sta elaborando la risposta' })).toBeDisabled()

    resolveFetch({ ok: true, status: 200, json: async () => ({ id: 'r_001', text: 'Fatto.' }) })

    await waitFor(() => expect(speakSpy).toHaveBeenCalledTimes(1))
    expect(speakSpy.mock.calls[0][0].text).toBe('Fatto.')
  })

  it('speaks an in-character error message when the API call fails, without crashing', async () => {
    const user = userEvent.setup()
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak')
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('network down')) as unknown as typeof fetch

    render(<App />)
    const eddy = screen.getByRole('button')
    await user.click(eddy) // idle → listening
    await user.click(eddy) // send

    await waitFor(() => expect(speakSpy).toHaveBeenCalledTimes(1))
    expect(speakSpy.mock.calls[0][0].text).toBe('I miei circuiti fanno i capricci. Riprova, umano.')
  })
})
