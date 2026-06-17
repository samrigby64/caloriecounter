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
}

/** Concentric "bullseye" rings — one per macro. Outer→inner:
 *  calories, protein, carbs, fat. Each fills consumed/goal. */
export default function MacroRings({ data, size = 160 }: Props) {
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
                strokeDashoffset={circ * (1 - pct)}
                style={{
                  // Soft glow so the colours read like Apple Activity rings.
                  filter: `drop-shadow(0 0 3px ${ring.color}cc)`,
                  transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
