import { useEffect, useState } from 'react'
import { MACRO_COLORS } from '../lib/macros'

interface RingDatum {
  consumed: number
  goal: number
}

interface Props {
  data: {
    kcal: RingDatum
    protein: RingDatum
    carbs: RingDatum
    fat: RingDatum
  }
  size?: number
  /** Animate the rings filling from empty on mount (use on the main view). */
  animate?: boolean
}

/** Concentric "bullseye" rings — one per macro. Outer→inner:
 *  calories, protein, carbs, fat. Each fills consumed/goal, glows in its
 *  colour, and breathes gently once complete. */
export default function MacroRings({ data, size = 160, animate = false }: Props) {
  const [shown, setShown] = useState(!animate)
  useEffect(() => {
    if (!animate) return
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [animate])

  const VB = 220
  const c = VB / 2
  const sw = 18

  const rings = [
    { ...data.kcal, r: 94, color: MACRO_COLORS.kcal },
    { ...data.protein, r: 73, color: MACRO_COLORS.protein },
    { ...data.carbs, r: 52, color: MACRO_COLORS.carbs },
    { ...data.fat, r: 31, color: MACRO_COLORS.fat },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      aria-hidden
      className="shrink-0 overflow-visible"
    >
      <g transform={`rotate(-90 ${c} ${c})`}>
        {rings.map((ring) => {
          const circ = 2 * Math.PI * ring.r
          const pct = ring.goal > 0 ? Math.min(ring.consumed / ring.goal, 1) : 0
          const complete = pct >= 0.999
          const eff = shown ? pct : 0
          return (
            <g key={ring.color}>
              <circle
                cx={c}
                cy={c}
                r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeOpacity={0.16}
                strokeWidth={sw}
              />
              <circle
                cx={c}
                cy={c}
                r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - eff)}
                className={complete ? 'ring-complete' : undefined}
                style={{
                  // Stronger glow once the ring closes — like Apple Activity rings.
                  filter: `drop-shadow(0 0 ${complete ? 6 : 3}px ${ring.color}${
                    complete ? 'ee' : 'cc'
                  })`,
                  transition: 'stroke-dashoffset 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)',
                }}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
