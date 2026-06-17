import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  lookupBarcode,
  searchFoods,
  type FoodHit,
} from '../lib/openfoodfacts'
import {
  useAddEntry,
  useAddFavorite,
  useDeleteFavorite,
  useFavorites,
  useRecents,
} from '../hooks/useData'
import type { FoodDraft, MealType } from '../lib/types'
import { todayISO } from '../lib/date'
import { haptic } from '../lib/haptics'
import AddFoodSheet from '../components/AddFoodSheet'
import Spinner from '../components/Spinner'

// The barcode scanner pulls in the heavy ZXing library — only load it
// when the user actually opens the Scan tab.
const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))

type Tab = 'search' | 'scan' | 'saved' | 'manual'

export default function Add() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [meal, setMeal] = useState<MealType>(
    (params.get('meal') as MealType) || defaultMeal(),
  )
  const date = params.get('date') || todayISO()
  const [tab, setTab] = useState<Tab>('search')
  const [manualBarcode, setManualBarcode] = useState<string | null>(null)

  const addEntry = useAddEntry()
  const addFavorite = useAddFavorite()
  const [hit, setHit] = useState<FoodHit | null>(null)

  async function logFood(food: FoodDraft, alsoFavorite = false) {
    haptic()
    await addEntry.mutateAsync({ date, meal, food })
    if (alsoFavorite) await addFavorite.mutateAsync(food)
    navigate('/')
  }

  return (
    <div className="safe-top px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Add food</h1>
        <button onClick={() => navigate('/')} className="text-sm text-muted">
          Cancel
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-surface p-1 text-sm">
        {(
          [
            ['search', 'Search'],
            ['scan', 'Scan'],
            ['saved', 'Saved'],
            ['manual', 'Manual'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg py-2 ${
              tab === key ? 'bg-brand font-semibold text-black' : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'search' && <SearchTab onPick={setHit} />}
      {tab === 'scan' && (
        <ScanTab
          onPick={setHit}
          onManual={(barcode) => {
            setManualBarcode(barcode)
            setTab('manual')
          }}
        />
      )}
      {tab === 'saved' && <SavedTab onLog={logFood} meal={meal} />}
      {tab === 'manual' && (
        <ManualTab
          onLog={logFood}
          barcode={manualBarcode}
          adding={addEntry.isPending}
        />
      )}

      {hit && (
        <AddFoodSheet
          hit={hit}
          meal={meal}
          onMealChange={setMeal}
          onClose={() => setHit(null)}
          onAdd={logFood}
          adding={addEntry.isPending}
        />
      )}
    </div>
  )
}

/* ------------------------------- Search --------------------------------- */

function SearchTab({ onPick }: { onPick: (h: FoodHit) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<FoodHit[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        setResults(await searchFoods(q))
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q])

  return (
    <div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search foods, e.g. Tesco hummus"
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
      />
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {!loading && searched && results.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">
          No matches. Try a different term or add it manually.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {results.map((h, i) => (
          <HitRow key={`${h.barcode}-${i}`} hit={h} onPick={onPick} />
        ))}
      </ul>
    </div>
  )
}

function HitRow({ hit, onPick }: { hit: FoodHit; onPick: (h: FoodHit) => void }) {
  const per = hit.per100g ?? hit.perServing
  const basis = hit.per100g ? 'per 100g' : 'per serving'
  return (
    <li>
      <button
        onClick={() => onPick(hit)}
        className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left active:bg-surface-2"
      >
        {hit.imageUrl ? (
          <img
            src={hit.imageUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg">
            🍽️
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{hit.name}</p>
          <p className="truncate text-xs text-muted">
            {hit.brand ? `${hit.brand} · ` : ''}
            {per?.calories ?? 0} kcal {basis}
          </p>
        </div>
        <span className="text-brand">+</span>
      </button>
    </li>
  )
}

/* -------------------------------- Scan ---------------------------------- */

function ScanTab({
  onPick,
  onManual,
}: {
  onPick: (h: FoodHit) => void
  onManual: (barcode: string) => void
}) {
  const [status, setStatus] = useState<'idle' | 'looking' | 'notfound'>('idle')
  const [lastCode, setLastCode] = useState<string | null>(null)

  async function handleDetected(code: string) {
    if (status === 'looking') return
    setLastCode(code)
    setStatus('looking')
    const found = await lookupBarcode(code)
    if (found) {
      setStatus('idle')
      onPick(found)
    } else {
      setStatus('notfound')
    }
  }

  return (
    <div>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center rounded-2xl bg-black">
            <Spinner />
          </div>
        }
      >
        <BarcodeScanner onDetected={handleDetected} />
      </Suspense>
      <div className="mt-4 text-center text-sm">
        {status === 'idle' && (
          <p className="text-muted">Point at a barcode to scan.</p>
        )}
        {status === 'looking' && (
          <p className="flex items-center justify-center gap-2 text-muted">
            <Spinner className="h-4 w-4" /> Looking up {lastCode}…
          </p>
        )}
        {status === 'notfound' && (
          <div className="space-y-2">
            <p className="text-muted">
              No product found for {lastCode}.
            </p>
            <button
              onClick={() => lastCode && onManual(lastCode)}
              className="rounded-lg bg-surface-2 px-4 py-2 text-brand"
            >
              Enter it manually
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Saved/Recents --------------------------- */

function SavedTab({
  onLog,
  meal,
}: {
  onLog: (f: FoodDraft, fav?: boolean) => void
  meal: MealType
}) {
  const { data: favorites, isLoading: favLoading } = useFavorites()
  const { data: recents, isLoading: recLoading } = useRecents()
  const deleteFavorite = useDeleteFavorite()

  if (favLoading || recLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  const hasFav = (favorites ?? []).length > 0
  const hasRec = (recents ?? []).length > 0

  if (!hasFav && !hasRec) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        Foods you log or favourite will show up here for one-tap re-logging.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {hasFav && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Favourites
          </h2>
          <ul className="space-y-2">
            {favorites!.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl bg-surface p-3"
              >
                <button
                  onClick={() => onLog(toDraft(f))}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm">{f.name}</p>
                  <p className="truncate text-xs text-muted">
                    {f.calories} kcal{f.serving ? ` · ${f.serving}` : ''}
                  </p>
                </button>
                <button
                  onClick={() => deleteFavorite.mutate(f.id)}
                  className="text-muted active:text-red-400"
                  aria-label="Remove favourite"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasRec && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Recent
          </h2>
          <ul className="space-y-2">
            {recents!.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => onLog(r)}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left active:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.name}</p>
                    <p className="truncate text-xs text-muted">
                      {r.calories} kcal{r.serving ? ` · ${r.serving}` : ''}
                    </p>
                  </div>
                  <span className="text-brand">+</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-xs text-muted">Tap to add to {meal}.</p>
    </div>
  )
}

function toDraft(f: {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string | null
  barcode: string | null
}): FoodDraft {
  return {
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    serving: f.serving,
    barcode: f.barcode,
  }
}

/* ------------------------------- Manual --------------------------------- */

function ManualTab({
  onLog,
  barcode,
  adding,
}: {
  onLog: (f: FoodDraft, fav?: boolean) => void
  barcode: string | null
  adding?: boolean
}) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [serving, setServing] = useState('')
  const [favorite, setFavorite] = useState(false)

  const valid = name.trim().length > 0 && calories !== '' && Number(calories) >= 0

  function submit() {
    if (!valid) return
    onLog(
      {
        name: name.trim(),
        calories: Math.round(Number(calories) || 0),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        serving: serving.trim() || null,
        barcode,
      },
      favorite,
    )
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs text-muted">Food name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Porridge with banana"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
      </label>

      <NumberField label="Calories (kcal)" value={calories} set={setCalories} />

      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Protein (g)" value={protein} set={setProtein} />
        <NumberField label="Carbs (g)" value={carbs} set={setCarbs} />
        <NumberField label="Fat (g)" value={fat} set={setFat} />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-muted">Serving (optional)</span>
        <input
          value={serving}
          onChange={(e) => setServing(e.target.value)}
          placeholder="e.g. 1 bowl"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={favorite}
          onChange={(e) => setFavorite(e.target.checked)}
          className="h-4 w-4 accent-brand"
        />
        Save to favourites
      </label>

      <button
        onClick={submit}
        disabled={!valid || adding}
        className="w-full rounded-xl bg-brand py-3.5 font-semibold text-black active:scale-[0.99] disabled:opacity-50"
      >
        {adding ? 'Adding…' : 'Add food'}
      </button>
    </div>
  )
}

function NumberField({
  label,
  value,
  set,
}: {
  label: string
  value: string
  set: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder="0"
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 tabular-nums outline-none focus:border-brand"
      />
    </label>
  )
}

function defaultMeal(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}
