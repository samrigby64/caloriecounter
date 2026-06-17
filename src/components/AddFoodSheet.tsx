import { useMemo, useState } from 'react'
import type { FoodHit } from '../lib/openfoodfacts'
import type { FoodDraft, MealType } from '../lib/types'
import { MEALS } from '../lib/types'

interface Props {
  hit: FoodHit
  meal: MealType
  onMealChange: (m: MealType) => void
  onClose: () => void
  onAdd: (food: FoodDraft, alsoFavorite: boolean) => void
  adding?: boolean
}

type Mode = 'grams' | 'serving'

/** Bottom sheet for choosing a quantity and logging a food hit. */
export default function AddFoodSheet({
  hit,
  meal,
  onMealChange,
  onClose,
  onAdd,
  adding,
}: Props) {
  const hasServing = !!hit.perServing
  const hasPer100 = !!hit.per100g
  const [mode, setMode] = useState<Mode>(hasServing && !hasPer100 ? 'serving' : 'grams')
  const [grams, setGrams] = useState('100')
  const [servings, setServings] = useState('1')
  const [favorite, setFavorite] = useState(false)

  const draft = useMemo<FoodDraft>(() => {
    const round = (n: number) => Math.round(n * 10) / 10
    if (mode === 'serving' && hit.perServing) {
      const n = Math.max(0, parseFloat(servings) || 0)
      return {
        name: label(hit),
        calories: Math.round(hit.perServing.calories * n),
        protein: round(hit.perServing.protein * n),
        carbs: round(hit.perServing.carbs * n),
        fat: round(hit.perServing.fat * n),
        serving: `${trim(n)} serving${n === 1 ? '' : 's'}${
          hit.servingSize ? ` (${hit.servingSize})` : ''
        }`,
        barcode: hit.barcode,
      }
    }
    // grams mode
    const g = Math.max(0, parseFloat(grams) || 0)
    const f = g / 100
    const base = hit.per100g ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return {
      name: label(hit),
      calories: Math.round(base.calories * f),
      protein: round(base.protein * f),
      carbs: round(base.carbs * f),
      fat: round(base.fat * f),
      serving: `${trim(g)} g`,
      barcode: hit.barcode,
    }
  }, [mode, grams, servings, hit])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
      <button className="flex-1" aria-label="Close" onClick={onClose} />
      <div className="safe-bottom rounded-t-3xl border-t border-border bg-surface p-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <h2 className="text-lg font-semibold leading-tight">{label(hit)}</h2>
        {hit.barcode && (
          <p className="mt-0.5 text-xs text-muted">Barcode {hit.barcode}</p>
        )}

        {/* Meal selector */}
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {MEALS.map((m) => (
            <button
              key={m.key}
              onClick={() => onMealChange(m.key)}
              className={`rounded-lg py-1.5 text-xs ${
                meal === m.key
                  ? 'bg-brand text-black'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Quantity */}
        <div className="mt-4 flex items-center gap-2">
          {hasPer100 && (
            <button
              onClick={() => setMode('grams')}
              className={`rounded-lg px-3 py-1.5 text-xs ${
                mode === 'grams' ? 'bg-surface-2 text-white' : 'text-muted'
              }`}
            >
              Grams
            </button>
          )}
          {hasServing && (
            <button
              onClick={() => setMode('serving')}
              className={`rounded-lg px-3 py-1.5 text-xs ${
                mode === 'serving' ? 'bg-surface-2 text-white' : 'text-muted'
              }`}
            >
              Servings
            </button>
          )}
        </div>

        <div className="mt-2">
          {mode === 'grams' ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="w-28 rounded-xl bg-surface-2 px-4 py-3 text-lg tabular-nums outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="text-muted">grams</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-28 rounded-xl bg-surface-2 px-4 py-3 text-lg tabular-nums outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="text-muted">
                servings{hit.servingSize ? ` · ${hit.servingSize}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Computed nutrition */}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <div>
            <span className="text-2xl font-bold tabular-nums">
              {draft.calories}
            </span>
            <span className="ml-1 text-sm text-muted">kcal</span>
          </div>
          <div className="flex gap-3 text-xs text-muted">
            <span>P {draft.protein}g</span>
            <span>C {draft.carbs}g</span>
            <span>F {draft.fat}g</span>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Save to favourites
        </label>

        <button
          onClick={() => onAdd(draft, favorite)}
          disabled={adding}
          className="mt-4 w-full rounded-xl bg-brand py-3.5 font-semibold text-black active:scale-[0.99] disabled:opacity-60"
        >
          {adding ? 'Adding…' : `Add to ${MEALS.find((m) => m.key === meal)?.label}`}
        </button>
      </div>
    </div>
  )
}

function label(hit: FoodHit): string {
  return hit.brand ? `${hit.name} (${hit.brand})` : hit.name
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10)
}
