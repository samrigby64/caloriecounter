import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeleteEntry, useEntries, useProfile } from '../hooks/useData'
import { addDays, formatDayLabel, todayISO } from '../lib/date'
import { MEALS, type Entry } from '../lib/types'
import CalorieRing from '../components/CalorieRing'
import MacroBar from '../components/MacroBar'
import Spinner from '../components/Spinner'

export default function Today() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const { data: profile } = useProfile()
  const { data: entries, isLoading } = useEntries(date)
  const deleteEntry = useDeleteEntry()

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
      <header className="mb-5 flex items-center justify-between">
        <button
          onClick={() => setDate((d) => addDays(d, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted active:scale-95"
          aria-label="Previous day"
        >
          ‹
        </button>
        <button
          onClick={() => setDate(todayISO())}
          className="text-lg font-semibold"
        >
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

      {/* Summary */}
      <section className="flex flex-col items-center rounded-3xl bg-surface p-6">
        <CalorieRing
          consumed={totals.calories}
          goal={profile?.calorie_goal ?? 2000}
        />
        <div className="mt-6 flex w-full gap-4">
          <MacroBar
            label="Protein"
            consumed={totals.protein}
            goal={profile?.protein_goal ?? 120}
            color="#38bdf8"
          />
          <MacroBar
            label="Carbs"
            consumed={totals.carbs}
            goal={profile?.carbs_goal ?? 230}
            color="#f59e0b"
          />
          <MacroBar
            label="Fat"
            consumed={totals.fat}
            goal={profile?.fat_goal ?? 65}
            color="#a78bfa"
          />
        </div>
      </section>

      {/* Meals */}
      <section className="mt-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          MEALS.map(({ key, label }) => {
            const items = byMeal[key] ?? []
            const mealCals = items.reduce((s, e) => s + e.calories, 0)
            return (
              <div key={key} className="rounded-2xl bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold">{label}</h2>
                  <span className="text-sm tabular-nums text-muted">
                    {mealCals} kcal
                  </span>
                </div>

                {items.length > 0 && (
                  <ul className="mb-2 divide-y divide-border">
                    {items.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{e.name}</p>
                          {e.serving && (
                            <p className="truncate text-xs text-muted">
                              {e.serving}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm tabular-nums">
                          {e.calories}
                        </span>
                        <button
                          onClick={() => deleteEntry.mutate(e)}
                          className="shrink-0 text-muted active:text-red-400"
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
                  className="w-full rounded-xl border border-dashed border-border py-2 text-sm text-brand active:bg-surface-2"
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
