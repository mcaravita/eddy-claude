import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EddyCharacter } from './EddyCharacter'

// Name of the mouth pose currently marked as visible (see data-pose in EddyCharacter).
function shownPose(container: HTMLElement): string | null {
  return container.querySelector('.eddy-mouth--show')?.getAttribute('data-pose') ?? null
}

describe('EddyCharacter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('exposes an accessible image labelled "Eddy"', () => {
    const { getByRole } = render(<EddyCharacter mode="idle" />)
    expect(getByRole('img', { name: 'Eddy' })).toBeInTheDocument()
  })

  it('smiles by default when not speaking', () => {
    const { container } = render(<EddyCharacter mode="idle" />)
    expect(shownPose(container)).toBe('smile')
  })

  it('occasionally switches to closed or frowning, then back to smiling', () => {
    // Math.random = 0 forces the shortest gap (1500ms) and the "closed" branch.
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { container } = render(<EddyCharacter mode="idle" />)

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(shownPose(container)).toBe('closed')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(shownPose(container)).toBe('smile')
  })

  it('cycles through mouth shapes while speaking, never closed or frowning', () => {
    const { container } = render(<EddyCharacter mode="speaking" />)
    const seen = new Set([shownPose(container)])

    for (let i = 0; i < 6; i++) {
      act(() => {
        vi.advanceTimersByTime(110)
      })
      seen.add(shownPose(container))
    }

    expect(seen.size).toBeGreaterThan(1)
    expect(seen.has('closed')).toBe(false)
    expect(seen.has('frown')).toBe(false)
  })

  it('returns to smiling (not closed) once speaking ends', () => {
    const { container, rerender } = render(<EddyCharacter mode="speaking" />)
    act(() => {
      vi.advanceTimersByTime(110)
    })

    rerender(<EddyCharacter mode="idle" />)

    expect(shownPose(container)).toBe('smile')
  })
})
