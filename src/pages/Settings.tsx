import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile, useUpdateProfile, useWeights } from '../hooks/useData'
import { haptic } from '../lib/haptics'
import Spinner from '../components/Spinner'

const FIELDS = [
  { key: 'calorie_goal', label: 'Daily calories', unit: 'kcal' },
  { key: 'protein_goal', label: 'Protein', unit: 'g' },
  { key: 'carbs_goal', label: 'Carbs', unit: 'g' },
  { key: 'fat_goal', label: 'Fat', unit: 'g' },
  { key: 'water_goal', label: 'Water', unit: 'glasses' },
] as const

export default function Settings() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: weights } = useWeights()
  const updateProfile = useUpdateProfile()
  const [form, setForm] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        calorie_goal: String(profile.calorie_goal),
        protein_goal: String(profile.protein_goal),
        carbs_goal: String(profile.carbs_goal),
        fat_goal: String(profile.fat_goal),
        water_goal: String(profile.water_goal),
      })
    }
  }, [profile])

  async function save() {
    setSaved(false)
    haptic()
    await updateProfile.mutateAsync({
      calorie_goal: Number(form.calorie_goal) || 0,
      protein_goal: Number(form.protein_goal) || 0,
      carbs_goal: Number(form.carbs_goal) || 0,
      fat_goal: Number(form.fat_goal) || 0,
      water_goal: Number(form.water_goal) || 0,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Push calculated targets into the form (user still taps Save to persist).
  function applyCalculated(c: { calories: number; protein: number; carbs: number; fat: number }) {
    setForm((s) => ({
      ...s,
      calorie_goal: String(c.calories),
      protein_goal: String(c.protein),
      carbs_goal: String(c.carbs),
      fat_goal: String(c.fat),
    }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const latestWeight = weights && weights.length ? weights[weights.length - 1].weight : undefined

  return (
    <div className="safe-top px-5 pt-3">
      <h1 className="text-[30px] font-bold leading-none tracking-tight">Goals</h1>
      <p className="mb-6 mt-1.5 text-sm text-muted">{user?.email}</p>

      <Calculator latestWeight={latestWeight} onApply={applyCalculated} />

      <div className="space-y-3">
        {FIELDS.map((f) => (
          <label
            key={f.key}
            className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-surface px-4 py-3"
          >
            <span className="text-sm">{f.label}</span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={form[f.key] ?? ''}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="w-20 rounded-lg bg-surface-2 px-3 py-1.5 text-right tabular-nums outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="w-14 text-xs text-muted">{f.unit}</span>
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={save}
        disabled={updateProfile.isPending}
        className="mt-6 w-full rounded-2xl bg-brand py-3 font-semibold text-black active:scale-[0.99] disabled:opacity-60"
      >
        {saved ? 'Saved ✓' : updateProfile.isPending ? 'Saving…' : 'Save goals'}
      </button>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-3 w-full rounded-2xl border border-border py-3 text-sm text-muted active:bg-surface"
      >
        Sign out
      </button>

      <p className="mt-8 text-center text-xs text-muted">
        Food data from Open Food Facts. Add to your home screen for the full app
        experience.
      </p>
    </div>
  )
}

const ACTIVITIES = [
  { label: 'Sedentary', mult: 1.2 },
  { label: 'Light', mult: 1.375 },
  { label: 'Moderate', mult: 1.55 },
  { label: 'Active', mult: 1.725 },
  { label: 'Very active', mult: 1.9 },
]

const AIMS = [
  { label: 'Lose', adj: -500 },
  { label: 'Maintain', adj: 0 },
  { label: 'Gain', adj: 300 },
]

function Calculator({
  latestWeight,
  onApply,
}: {
  latestWeight?: number
  onApply: (c: { calories: number; protein: number; carbs: number; fat: number }) => void
}) {
  const [open, setOpen] = useState(false)
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('30')
  const [height, setHeight] = useState('175')
  const [weight, setWeight] = useState(latestWeight ? String(latestWeight) : '75')
  const [actIdx, setActIdx] = useState(2)
  const [aimIdx, setAimIdx] = useState(1)
  const [result, setResult] = useState<{
    calories: number
    protein: number
    carbs: number
    fat: number
  } | null>(null)

  function calculate() {
    haptic()
    const a = Number(age)
    const h = Number(height)
    const w = Number(weight)
    if (!a || !h || !w) return
    // Mifflin–St Jeor
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161)
    const tdee = bmr * ACTIVITIES[actIdx].mult
    const calories = Math.round((tdee + AIMS[aimIdx].adj) / 10) * 10
    const protein = Math.round(2 * w) // 2 g per kg
    const fat = Math.round((calories * 0.25) / 9) // 25% of energy
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
    setResult({ calories, protein, carbs, fat })
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium">✨ Calculate my goals</span>
        <span className="text-muted">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          {/* Sex */}
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className={`flex-1 rounded-lg py-2 text-sm capitalize ${
                  sex === s ? 'bg-brand font-semibold text-black' : 'bg-surface-2 text-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Age" value={age} set={setAge} />
            <Stat label="Height" value={height} set={setHeight} unit="cm" />
            <Stat label="Weight" value={weight} set={setWeight} unit="kg" />
          </div>

          <Picker label="Activity" options={ACTIVITIES.map((a) => a.label)} idx={actIdx} set={setActIdx} />
          <Picker label="Goal" options={AIMS.map((a) => a.label)} idx={aimIdx} set={setAimIdx} />

          <button
            onClick={calculate}
            className="w-full rounded-xl bg-surface-2 py-2.5 text-sm font-semibold text-brand active:scale-[0.99]"
          >
            Calculate
          </button>

          {result && (
            <div className="rounded-xl bg-surface-2 p-3 text-center text-sm">
              <p className="tabular-nums">
                <b>{result.calories}</b> kcal · P {result.protein} · C {result.carbs} · F {result.fat}
              </p>
              <button
                onClick={() => {
                  haptic()
                  onApply(result)
                }}
                className="mt-2 rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-black active:scale-95"
              >
                Use these goals
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  set,
  unit,
}: {
  label: string
  value: string
  set: (v: string) => void
  unit?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">
        {label}
        {unit ? ` (${unit})` : ''}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full rounded-lg bg-surface-2 px-3 py-2 text-center tabular-nums outline-none focus:ring-1 focus:ring-brand"
      />
    </label>
  )
}

function Picker({
  label,
  options,
  idx,
  set,
}: {
  label: string
  options: string[]
  idx: number
  set: (i: number) => void
}) {
  return (
    <div>
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o, i) => (
          <button
            key={o}
            onClick={() => set(i)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              idx === i ? 'bg-brand font-semibold text-black' : 'bg-surface-2 text-muted'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
