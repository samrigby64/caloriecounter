import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeleteEntry, useEntries, useProfile } from '../hooks/useData'
import { addDays, formatDayLabel, todayISO } from '../lib/date'
import { MEALS, type Entry } from '../lib/types'
import { MACRO_COLORS } from '../lib/macros'
import MacroRings from '../components/MacroRings'
import Spinner from '../components/Spinner'

const round = (n: number) => Math.round(n)

export default function Today() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const { data: profile } = useProfile()
  const { data: entries, isLoading } = useEntries(date)
  const deleteEntry = useDeleteEntry()

  const goal = {
    cal: profile?.calorie_goal ?? 2000,
    protein: profile?.protein_goal ?? 120,
    carbs: profile?.carbs_goal ?? 230,
    fat: profile?.fat_goal ?? 65,
  }

  const totals = useMemo(() => {
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    for (const e of entries ?? []) {
      t.calories += e.calories
      t.protein += e.protein
      t.carbs += e.carbs
      t.fat += e.fat
    }
    return t
  }, [entries])

  const byMeal = useMemo(() => {
    const map: Record<string, Entry[]> = {}
    for (const e of entries ?? []) (map[e.meal] ??= []).push(e)
    return map
  }, [entries])

  return (
    <div className="safe-top px-4 pt-4">
      {/* Date switcher */}
      <header className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setDate((d) => addDays(d, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted active:scale-95"
          aria-label="Previous day"
        >
          ‹
        </button>
        <button onClick={() => setDate(todayISO())} className="text-lg font-semibold">
          {formatDayLabel(date)}
        </button>
        <button
          onClick={() => setDate((d) => addDays(d, 1))}
          disabled={date >= todayISO()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted active:scale-95 disabled:opacity-30"
          aria-label="Next day"
        >
          ›
        </button>
      </header>

      {/* Summary: legend + bullseye rings */}
      <section className="flex items-center gap-3 rounded-3xl bg-surface p-5">
        <div className="flex-1 space-y-2.5">
          <LegendRow label="Kcal" consumed={totals.calories} goal={goal.cal} unit="kcal" color={MACRO_COLORS.kcal} />
          <LegendRow label="Protein" consumed={totals.protein} goal={goal.protein} unit="g" color={MACRO_COLORS.protein} />
          <LegendRow label="Carbs" consumed={totals.carbs} goal={goal.carbs} unit="g" color={MACRO_COLORS.carbs} />
          <LegendRow label="Fat" consumed={totals.fat} goal={goal.fat} unit="g" color={MACRO_COLORS.fat} />
        </div>
        <MacroRings
          size={150}
          data={{
            kcal: { consumed: totals.calories, goal: goal.cal },
            protein: { consumed: totals.protein, goal: goal.protein },
            carbs: { consumed: totals.carbs, goal: goal.carbs },
            fat: { consumed: totals.fat, goal: goal.fat },
          }}
        />
      </section>

      {/* Meals */}
      <section className="mt-5 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          MEALS.map(({ key, label }) => {
            const items = byMeal[key] ?? []
            const mt = items.reduce(
              (s, e) => ({
                cal: s.cal + e.calories,
                protein: s.protein + e.protein,
                carbs: s.carbs + e.carbs,
                fat: s.fat + e.fat,
              }),
              { cal: 0, protein: 0, carbs: 0, fat: 0 },
            )
            return (
              <div key={key} className="rounded-2xl bg-surface p-4">
                <h2 className="mb-2 font-semibold">{label}</h2>

                {/* Column totals header */}
                <div className="flex items-end gap-1.5 border-b border-border pb-2">
                  <span className="flex-1" />
                  <TotalCell value={`${mt.cal}`} color={MACRO_COLORS.kcal} />
                  <TotalCell value={`${round(mt.protein)}g`} color={MACRO_COLORS.protein} />
                  <TotalCell value={`${round(mt.carbs)}g`} color={MACRO_COLORS.carbs} />
                  <TotalCell value={`${round(mt.fat)}g`} color={MACRO_COLORS.fat} />
                  <span className="w-4" />
                </div>

                {/* Entries */}
                {items.length > 0 && (
                  <ul className="divide-y divide-border/60">
                    {items.map((e) => (
                      <li key={e.id} className="flex items-center gap-1.5 py-2.5 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{e.name}</p>
                          {e.serving && (
                            <p className="truncate text-xs text-muted">{e.serving}</p>
                          )}
                        </div>
                        <span className="w-12 text-right tabular-nums">{e.calories}</span>
                        <span className="w-12 text-right tabular-nums text-white/80">{round(e.protein)}g</span>
                        <span className="w-12 text-right tabular-nums text-white/80">{round(e.carbs)}g</span>
                        <span className="w-12 text-right tabular-nums text-white/80">{round(e.fat)}g</span>
                        <button
                          onClick={() => deleteEntry.mutate(e)}
                          className="w-4 shrink-0 text-muted active:text-red-400"
                          aria-label={`Remove ${e.name}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => navigate(`/add?meal=${key}&date=${date}`)}
                  className="mt-2 text-sm font-medium text-brand active:opacity-70"
                >
                  + Add food
                </button>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}

function LegendRow({
  label,
  consumed,
  goal,
  unit,
  color,
}: {
  label: string
  consumed: number
  goal: number
  unit: string
  color: string
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-14 shrink-0 text-sm text-white/90">{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
        {round(consumed)}/{goal}
        {unit}
      </span>
    </div>
  )
}

function TotalCell({ value, color }: { value: string; color: string }) {
  return (
    <div className="w-12">
      <div className="text-right text-xs font-medium tabular-nums">{value}</div>
      <div className="ml-auto mt-1 h-0.5 w-8 rounded" style={{ background: color }} />
    </div>
  )
}
