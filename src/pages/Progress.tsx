import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useLogWeight,
  useProfile,
  useRangeTotals,
  useWeights,
  type WeightPoint,
} from '../hooks/useData'
import { addDays, todayISO } from '../lib/date'
import MacroRings from '../components/MacroRings'
import Spinner from '../components/Spinner'
import { haptic } from '../lib/haptics'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Progress() {
  const navigate = useNavigate()
  const today = todayISO()

  // 6-week grid aligned to Monday, ending with the current week.
  const { gridStart, dates } = useMemo(() => {
    const [y, m, d] = today.split('-').map(Number)
    const dow = (new Date(y, m - 1, d).getDay() + 6) % 7 // Mon = 0
    const weekMonday = addDays(today, -dow)
    const end = addDays(weekMonday, 6)
    const start = addDays(end, -41)
    const list: string[] = []
    for (let i = 0; i < 42; i++) list.push(addDays(start, i))
    return { gridStart: start, dates: list }
  }, [today])

  const { data: profile } = useProfile()
  const { data: totals, isLoading } = useRangeTotals(gridStart, today)

  const goal = profile?.calorie_goal ?? 2000
  const pGoal = profile?.protein_goal ?? 120
  const cGoal = profile?.carbs_goal ?? 230
  const fGoal = profile?.fat_goal ?? 65

  const streak = useMemo(() => {
    if (!totals) return 0
    const logged = (d: string) => (totals[d]?.calories ?? 0) > 0
    let cursor = logged(today) ? today : addDays(today, -1)
    let n = 0
    while (logged(cursor)) {
      n++
      cursor = addDays(cursor, -1)
    }
    return n
  }, [totals, today])

  return (
    <div className="safe-top px-4 pt-3">
      <h1 className="mb-5 text-[30px] font-bold leading-none tracking-tight">Progress</h1>

      {/* Streak */}
      <section className="pop-in mb-4 flex items-center gap-4 rounded-3xl border border-white/[0.06] bg-surface p-5">
        <div className="text-4xl">🔥</div>
        <div>
          <p className="text-2xl font-bold leading-none">
            {streak} <span className="text-base font-medium text-muted">day{streak === 1 ? '' : 's'}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {streak > 0 ? 'Logging streak — keep it going!' : 'Log a food today to start a streak.'}
          </p>
        </div>
      </section>

      {/* Activity history calendar */}
      <section className="pop-in mb-4 rounded-3xl border border-white/[0.06] bg-surface p-5">
        <h2 className="mb-3 font-semibold">Last 6 weeks</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
              {WEEKDAYS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dates.map((d) => {
                const future = d > today
                const t = totals?.[d]
                const dayNum = Number(d.split('-')[2])
                return (
                  <button
                    key={d}
                    disabled={future}
                    onClick={() => {
                      haptic()
                      navigate(`/?date=${d}`)
                    }}
                    className={`flex flex-col items-center rounded-lg py-1 active:scale-90 disabled:opacity-25 ${
                      d === today ? 'bg-white/[0.06]' : ''
                    }`}
                  >
                    <MacroRings
                      size={32}
                      data={{
                        kcal: { consumed: t?.calories ?? 0, goal },
                        protein: { consumed: t?.protein ?? 0, goal: pGoal },
                        carbs: { consumed: t?.carbs ?? 0, goal: cGoal },
                        fat: { consumed: t?.fat ?? 0, goal: fGoal },
                      }}
                    />
                    <span
                      className={`mt-1 text-[10px] tabular-nums ${
                        d === today ? 'font-bold text-brand' : 'text-muted'
                      }`}
                    >
                      {dayNum}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-center text-xs text-muted">Tap a day to open it.</p>
          </>
        )}
      </section>

      {/* Weight */}
      <WeightSection />
    </div>
  )
}

function WeightSection() {
  const { data: weights, isLoading } = useWeights()
  const logWeight = useLogWeight()
  const [input, setInput] = useState('')

  const latest = weights && weights.length ? weights[weights.length - 1] : null

  async function submit() {
    const w = parseFloat(input)
    if (!Number.isFinite(w) || w <= 0) return
    haptic()
    await logWeight.mutateAsync({ date: todayISO(), weight: Math.round(w * 10) / 10 })
    setInput('')
  }

  return (
    <section className="pop-in mb-4 rounded-3xl border border-white/[0.06] bg-surface p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">Weight</h2>
        {latest && (
          <span className="text-sm tabular-nums text-muted">
            <span className="text-base font-semibold text-white">{latest.weight}</span> kg
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : weights && weights.length >= 2 ? (
        <WeightChart points={weights} />
      ) : (
        <p className="py-2 text-sm text-muted">
          Log your weight on a few days to see your trend.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Today's weight (kg)"
          className="flex-1 rounded-xl border border-border bg-surface-2 px-4 py-2.5 tabular-nums outline-none focus:border-brand"
        />
        <button
          onClick={submit}
          disabled={logWeight.isPending || !input}
          className="rounded-xl bg-brand px-5 font-semibold text-black active:scale-95 disabled:opacity-50"
        >
          Log
        </button>
      </div>
    </section>
  )
}

function WeightChart({ points }: { points: WeightPoint[] }) {
  const data = points.slice(-30)
  const W = 320
  const H = 110
  const pad = 10
  const ws = data.map((p) => p.weight)
  const min = Math.min(...ws)
  const max = Math.max(...ws)
  const span = max - min || 1
  const x = (i: number) =>
    data.length === 1 ? W / 2 : pad + (i / (data.length - 1)) * (W - pad * 2)
  const y = (w: number) => pad + (1 - (w - min) / span) * (H - pad * 2)

  const line = data.map((p, i) => `${x(i)},${y(p.weight)}`).join(' ')
  const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#wfill)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.weight)} r="2.5" fill="var(--color-brand)" />
      ))}
    </svg>
  )
}
