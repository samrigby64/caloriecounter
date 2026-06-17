export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
]

/** A logged food entry, stored in Supabase. */
export interface Entry {
  id: string
  user_id: string
  /** ISO date string, e.g. "2026-06-17" (the day this was eaten). */
  date: string
  meal: MealType
  name: string
  /** Calories for the logged quantity (already multiplied out). */
  calories: number
  protein: number
  carbs: number
  fat: number
  /** Human-readable serving description, e.g. "1 serving (100 g)". */
  serving: string | null
  barcode: string | null
  created_at: string
}

/** A saved favourite food the user can quickly re-log. */
export interface Favorite {
  id: string
  user_id: string
  name: string
  /** Per-serving nutrition. */
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string | null
  barcode: string | null
  created_at: string
}

/** The user's daily targets. */
export interface Profile {
  id: string
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
}

/** Normalised nutrition for a single serving — the shape the Add flow produces. */
export interface FoodDraft {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string | null
  barcode: string | null
}

export const DEFAULT_PROFILE: Omit<Profile, 'id'> = {
  calorie_goal: 2000,
  protein_goal: 120,
  carbs_goal: 230,
  fat_goal: 65,
}
