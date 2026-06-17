interface Props {
  label: string
  consumed: number
  goal: number
  color: string
  unit?: string
}

export default function MacroBar({ label, consumed, goal, color, unit = 'g' }: Props) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-white/90">
          {Math.round(consumed)}
          <span className="text-muted">
            /{goal}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}
