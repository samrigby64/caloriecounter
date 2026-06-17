import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile, useUpdateProfile } from '../hooks/useData'
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="safe-top px-5 pt-6">
      <h1 className="mb-1 text-2xl font-bold">Goals</h1>
      <p className="mb-6 text-sm text-muted">{user?.email}</p>

      <div className="space-y-3">
        {FIELDS.map((f) => (
          <label
            key={f.key}
            className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
          >
            <span className="text-sm">{f.label}</span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={form[f.key] ?? ''}
                onChange={(e) =>
                  setForm((s) => ({ ...s, [f.key]: e.target.value }))
                }
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
        className="mt-6 w-full rounded-xl bg-brand py-3 font-semibold text-black active:scale-[0.99] disabled:opacity-60"
      >
        {saved ? 'Saved ✓' : updateProfile.isPending ? 'Saving…' : 'Save goals'}
      </button>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-3 w-full rounded-xl border border-border py-3 text-sm text-muted active:bg-surface"
      >
        Sign out
      </button>

      <p className="mt-8 text-center text-xs text-muted">
        Food data from Open Food Facts. Add to your home screen for the full
        app experience.
      </p>
    </div>
  )
}
