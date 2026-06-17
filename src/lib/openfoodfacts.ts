/**
 * Open Food Facts client.
 *
 * Free, no API key. We bias results towards the UK but keep the worldwide
 * index so own-brand and imported items still resolve. Nutrition is returned
 * per 100 g plus (when present) per declared serving, and the Add flow scales
 * it to whatever quantity the user logs.
 */

export interface Nutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface FoodHit {
  name: string
  brand: string | null
  barcode: string | null
  per100g: Nutrition | null
  perServing: Nutrition | null
  /** Declared serving text, e.g. "30 g". */
  servingSize: string | null
  imageUrl: string | null
}

const FIELDS = [
  'code',
  'product_name',
  'brands',
  'serving_size',
  'image_small_url',
  'nutriments',
].join(',')

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

interface OffProduct {
  code?: string
  product_name?: string
  brands?: string
  serving_size?: string
  image_small_url?: string
  nutriments?: Record<string, unknown>
}

function parseNutrition(n: Record<string, unknown>, suffix: string): Nutrition | null {
  const kcalKey = `energy-kcal${suffix}`
  // Some products only carry kJ — convert as a fallback.
  const hasKcal = n[kcalKey] != null
  const hasKj = n[`energy${suffix}`] != null || n[`energy-kj${suffix}`] != null
  if (!hasKcal && !hasKj) return null
  const calories = hasKcal
    ? num(n[kcalKey])
    : Math.round(num(n[`energy-kj${suffix}`] ?? n[`energy${suffix}`]) / 4.184)
  return {
    calories: Math.round(calories),
    protein: num(n[`proteins${suffix}`]),
    carbs: num(n[`carbohydrates${suffix}`]),
    fat: num(n[`fat${suffix}`]),
  }
}

function toHit(p: OffProduct): FoodHit | null {
  const name = (p.product_name ?? '').trim()
  if (!name) return null
  const nutriments = p.nutriments ?? {}
  const per100g = parseNutrition(nutriments, '_100g')
  const perServing = parseNutrition(nutriments, '_serving')
  // No usable energy data at all — not worth showing.
  if (!per100g && !perServing) return null
  return {
    name,
    brand: (p.brands ?? '').split(',')[0]?.trim() || null,
    barcode: p.code ?? null,
    per100g,
    perServing,
    servingSize: p.serving_size?.trim() || null,
    imageUrl: p.image_small_url ?? null,
  }
}

/** Look up a single product by its barcode (EAN/UPC). */
export async function lookupBarcode(barcode: string): Promise<FoodHit | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json?fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { status?: number; product?: OffProduct }
  if (data.status !== 1 || !data.product) return null
  return toHit(data.product)
}

/** Free-text search, UK-biased. Returns up to ~25 usable hits. */
export async function searchFoods(query: string): Promise<FoodHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '40',
    fields: FIELDS,
    // Prioritise UK / English-language products.
    tagtype_0: 'countries',
    tag_contains_0: 'contains',
    tag_0: 'united-kingdom',
  })
  const url = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { products?: OffProduct[] }
  const hits = (data.products ?? [])
    .map(toHit)
    .filter((h): h is FoodHit => h !== null)
  return hits.slice(0, 25)
}
