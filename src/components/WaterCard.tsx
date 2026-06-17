import { GLASS_ML } from '../lib/types'
import { WATER_COLOR as WATER } from '../lib/macros'
import { haptic } from '../lib/haptics'

const MAX_DROPS = 14

interface Props {
  glasses: number
  goal: number
  onChange: (next: number) => void
}

/** Daily water tracker — tap a glass to set the level, tap the last full one
 *  to remove it. Each glass is 250 ml. */
export default function WaterCard({ glasses, goal, onChange }: Props) {
  const count = Math.min(Math.max(goal, glasses), MAX_DROPS)
  const litres = ((glasses * GLASS_ML) / 1000).toFixed(1)
  const goalLitres = ((goal * GLASS_ML) / 1000).toFixed(1)

  function tap(i: number) {
    haptic()
    // Tapping the currently-last-full glass clears it; otherwise fill up to i.
    onChange(glasses === i + 1 ? i : i + 1)
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-surface p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">Water</h2>
        <span className="text-sm tabular-nums" style={{ color: WATER }}>
          {litres}
          <span className="text-muted"> / {goalLitres} L</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, i) => {
          const filled = i < glasses
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              aria-label={`Set water to ${i + 1} glass${i ? 'es' : ''}`}
              className="transition-transform active:scale-90"
            >
              <Drop filled={filled} />
            </button>
          )
        })}
        {glasses > MAX_DROPS && (
          <span className="self-center text-xs text-muted">+{glasses - MAX_DROPS}</span>
        )}
      </div>
    </div>
  )
}

function Drop({ filled }: { filled: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      aria-hidden
      className="overflow-visible"
      style={filled ? { filter: `drop-shadow(0 0 3px ${WATER}cc)` } : undefined}
    >
      <path
        d="M12 3c3.6 4.2 6 7.2 6 10.2A6 6 0 0 1 6 13.2C6 10.2 8.4 7.2 12 3z"
        fill={filled ? WATER : 'transparent'}
        stroke={filled ? WATER : 'var(--color-border)'}
        strokeWidth="1.6"
      />
    </svg>
  )
}
