interface Props {
  consumed: number
  goal: number
}

/** Big circular progress ring: calories eaten vs. goal, remaining in the middle. */
export default function CalorieRing({ consumed, goal }: Props) {
  const size = 200
  const stroke = 16
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0
  const remaining = Math.round(goal - consumed)
  const over = remaining < 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? '#ef4444' : 'var(--color-brand)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-4xl font-bold tabular-nums ${
            over ? 'text-red-400' : 'text-white'
          }`}
        >
          {Math.abs(remaining)}
        </span>
        <span className="text-xs uppercase tracking-wide text-muted">
          {over ? 'over' : 'remaining'}
        </span>
        <span className="mt-1 text-xs text-muted">
          {Math.round(consumed)} / {goal} kcal
        </span>
      </div>
    </div>
  )
}
