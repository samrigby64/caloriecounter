import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  DEFAULT_PROFILE,
  type Entry,
  type Favorite,
  type FoodDraft,
  type MealType,
  type Profile,
} from '../lib/types'

/* ------------------------------- Profile -------------------------------- */

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      if (data) return data as Profile
      // First login — create a default profile row.
      const row = { id: user!.id, ...DEFAULT_PROFILE }
      const { data: created, error: insErr } = await supabase
        .from('profiles')
        .insert(row)
        .select('*')
        .single()
      if (insErr) throw insErr
      return created as Profile
    },
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Profile, 'id'>>) => {
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user!.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.id] }),
  })
}

/* ------------------------------- Entries -------------------------------- */

export function useEntries(date: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['entries', user?.id, date],
    enabled: !!user,
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', date)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Entry[]
    },
  })
}

export function useAddEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      date: string
      meal: MealType
      food: FoodDraft
    }) => {
      const { food } = input
      const { error } = await supabase.from('entries').insert({
        user_id: user!.id,
        date: input.date,
        meal: input.meal,
        name: food.name,
        calories: Math.round(food.calories),
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        serving: food.serving,
        barcode: food.barcode,
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['entries', user?.id, vars.date] }),
  })
}

export function useDeleteEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entry: Entry) => {
      const { error } = await supabase.from('entries').delete().eq('id', entry.id)
      if (error) throw error
    },
    onSuccess: (_d, entry) =>
      qc.invalidateQueries({ queryKey: ['entries', user?.id, entry.date] }),
  })
}

/* ------------------------------ Favourites ------------------------------ */

export function useFavorites() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['favorites', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Favorite[]> => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Favorite[]
    },
  })
}

export function useAddFavorite() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (food: FoodDraft) => {
      const { error } = await supabase.from('favorites').insert({
        user_id: user!.id,
        name: food.name,
        calories: Math.round(food.calories),
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        serving: food.serving,
        barcode: food.barcode,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  })
}

export function useDeleteFavorite() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('favorites').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  })
}

/* -------------------------------- Recents ------------------------------- */

/** Most-recently logged foods (de-duplicated by name), for one-tap re-logging. */
export function useRecents() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recents', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<FoodDraft[]> => {
      const { data, error } = await supabase
        .from('entries')
        .select('name, calories, protein, carbs, fat, serving, barcode')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(60)
      if (error) throw error
      const seen = new Set<string>()
      const out: FoodDraft[] = []
      for (const r of (data ?? []) as FoodDraft[]) {
        const key = r.name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(r)
        if (out.length >= 20) break
      }
      return out
    },
  })
}
