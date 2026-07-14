import { useEffect, useState } from 'react'
import type { EddyMode } from '../types'

interface EddyCharacterProps {
  mode: EddyMode
}

// Eye pose driven by the interaction state: alert while listening, looking up
// while "thinking" (loading), neutral otherwise.
type EyeExpression = 'normal' | 'alert' | 'thinking'

// "frown" is the "smile" path rotated 180° around its own centre (see the JSX
// below) — there is no separate hand-drawn shape for it.
type MouthPose = 'closed' | 'smile' | 'open2' | 'open3' | 'frown'

// Blink cadence: a short closure at random intervals, active in every state.
const BLINK_CLOSED_MS = 150
const BLINK_MIN_GAP_MS = 1500
const BLINK_MAX_EXTRA_MS = 3000

// Resting mouth mood: smiles by default, occasionally flashing closed or
// frowning at random (same cadence style as blinking) whenever Eddy isn't
// speaking.
const MOOD_HOLD_MS = 500
const MOOD_MIN_GAP_MS = 1500
const MOOD_MAX_EXTRA_MS = 3000

// Talking animation: cycles through these poses while speaking.
const MOUTH_INTERVAL_MS = 110
const SPEAKING_POSES: MouthPose[] = ['smile', 'open2', 'open3']

function eyeExpressionFor(mode: EddyMode): EyeExpression {
  if (mode === 'listening') return 'alert'
  if (mode === 'loading') return 'thinking'
  return 'normal'
}

/**
 * Inline SVG rendition of Eddy that reacts to the interaction state: it blinks
 * and shifts its resting mouth mood (smile/closed/frown) on its own at all
 * times, and moves its mouth through the speaking poses while
 * `mode === 'speaking'`. The animation is driven entirely by the `mode` prop
 * (no coupling to the speech layer).
 */
export function EddyCharacter({ mode }: EddyCharacterProps) {
  const [blinking, setBlinking] = useState(false)
  const [mouthPose, setMouthPose] = useState<MouthPose>('smile')
  const isSpeaking = mode === 'speaking'

  // Random blinking loop, always running regardless of interaction state.
  useEffect(() => {
    let openTimer: ReturnType<typeof setTimeout>
    let closeTimer: ReturnType<typeof setTimeout>
    const scheduleNext = () => {
      openTimer = setTimeout(
        () => {
          setBlinking(true)
          closeTimer = setTimeout(() => {
            setBlinking(false)
            scheduleNext()
          }, BLINK_CLOSED_MS)
        },
        BLINK_MIN_GAP_MS + Math.random() * BLINK_MAX_EXTRA_MS,
      )
    }
    scheduleNext()
    return () => {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  // Resting mouth mood: smiles by default, briefly closed/frowning at random.
  // Paused while speaking, which drives the mouth itself (effect below).
  useEffect(() => {
    if (isSpeaking) return
    setMouthPose('smile')
    let moodTimer: ReturnType<typeof setTimeout>
    let revertTimer: ReturnType<typeof setTimeout>
    const scheduleNext = () => {
      moodTimer = setTimeout(
        () => {
          setMouthPose(Math.random() < 0.5 ? 'closed' : 'frown')
          revertTimer = setTimeout(() => {
            setMouthPose('smile')
            scheduleNext()
          }, MOOD_HOLD_MS)
        },
        MOOD_MIN_GAP_MS + Math.random() * MOOD_MAX_EXTRA_MS,
      )
    }
    scheduleNext()
    return () => {
      clearTimeout(moodTimer)
      clearTimeout(revertTimer)
    }
  }, [isSpeaking])

  // Mouth movement: cycles through the speaking poses only while speaking.
  useEffect(() => {
    if (!isSpeaking) return
    let previous: MouthPose = SPEAKING_POSES[0]
    const interval = setInterval(() => {
      let next = previous
      // Avoid repeating the same mouth twice in a row for a smoother animation.
      while (next === previous) {
        next = SPEAKING_POSES[Math.floor(Math.random() * SPEAKING_POSES.length)]
      }
      previous = next
      setMouthPose(next)
    }, MOUTH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isSpeaking])

  const expression = eyeExpressionFor(mode)
  const mouthClass = (pose: MouthPose) =>
    `feat eddy-mouth${pose === mouthPose ? ' eddy-mouth--show' : ''}`

  return (
    <svg
      className="eddy-face__image eddy-character"
      viewBox="0 0 320 420"
      role="img"
      aria-label="Eddy"
    >
      {/* Base shape: the letter E */}
      <path className="strk" d="M 60 340 V 120 A 100 100 0 0 1 260 120 V 120" />
      <path className="strk" d="M 60 250 H 235" />
      <path className="strk" d="M 60 360 H 250" />

      {/* Inner Y */}
      <path className="feat" d="M 120 260 L 160 320 L 200 260" />
      <path className="feat" d="M 160 320 V 350" />

      {/* Eyes: the expression shifts the whole group; blinking swaps open/closed. */}
      <g transform="translate(0 40)">
        <g className={`eddy-eyes eddy-eyes--${expression}`}>
          {blinking ? (
            <>
              <path className="feat" d="M 95 90 H 135" />
              <path className="feat" d="M 185 90 H 225" />
            </>
          ) : (
            <>
              <path className="feat" d="M 90 85 A 20 20 0 0 1 145 85 Z" />
              <path className="feat" d="M 170 85 A 20 20 0 0 1 225 85 Z" />
            </>
          )}
        </g>
      </g>

      {/* Mouth: only the active pose is displayed. */}
      <g transform="translate(0 40)">
        <path className={mouthClass('closed')} data-pose="closed" d="M 120 140 H 200" />
        <path
          className={mouthClass('smile')}
          data-pose="smile"
          d="M 120 140 H 200 A 40 20 0 0 1 120 140 Z"
        />
        <path
          className={mouthClass('open2')}
          data-pose="open2"
          d="M 110 135 H 210 A 50 30 0 0 1 110 135 Z"
        />
        <path
          className={mouthClass('open3')}
          data-pose="open3"
          d="M 110 130 H 210 A 50 45 0 0 1 110 130 Z"
        />
        {/* Same path as "smile", rotated 180° around its centre (160,150) to read as a frown. */}
        <path
          className={mouthClass('frown')}
          data-pose="frown"
          d="M 120 140 H 200 A 40 20 0 0 1 120 140 Z"
          transform="rotate(180 160 150)"
        />
      </g>
    </svg>
  )
}
