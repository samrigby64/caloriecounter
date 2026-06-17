/** Local-date helpers. We key entries by the user's *local* calendar day,
 *  never UTC, so a late-night snack lands on the right date in the UK. */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + delta)
  return toISODate(date)
}

export function formatDayLabel(iso: string): string {
  if (iso === todayISO()) return 'Today'
  if (iso === addDays(todayISO(), -1)) return 'Yesterday'
  if (iso === addDays(todayISO(), 1)) return 'Tomorrow'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
