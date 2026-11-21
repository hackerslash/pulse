export function ago(iso: string | null, now = Date.now()): string {
  if (!iso) return 'never'
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (s < 5) return 'just now'
  return duration(s) + ' ago'
}

export function duration(seconds: number): string {
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`
}

export function since(iso: string, now = Date.now()): string {
  return duration((now - Date.parse(iso)) / 1000)
}

export function pct(v: number | null): string {
  if (v == null) return '—'
  if (v === 100) return '100%'
  return (Math.floor(v * 100) / 100).toFixed(2) + '%'
}

export function ms(v: number | null | undefined): string {
  if (v == null) return '—'
  return v >= 1000 ? (v / 1000).toFixed(2) + 's' : Math.round(v) + 'ms'
}

export function interval(s: number): string {
  if (s % 3600 === 0) return `${s / 3600}h`
  if (s % 60 === 0) return `${s / 60}m`
  return `${s}s`
}

export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

export function bucket<T>(items: T[], max: number): T[][] {
  if (items.length <= max) return items.map(i => [i])
  const size = items.length / max
  return Array.from({ length: max }, (_, i) => items.slice(Math.floor(i * size), Math.floor((i + 1) * size)))
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
