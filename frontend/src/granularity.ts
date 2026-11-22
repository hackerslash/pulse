import type { Granularity } from './api'

export const OPTIONS: { id: Granularity; label: string; span: string; cell: string }[] = [
  { id: 'day', label: '1 day', span: '24 hours', cell: '15 minutes' },
  { id: 'week', label: '1 week', span: '7 days', cell: '2 hours' },
  { id: 'month', label: '1 month', span: '30 days', cell: '8 hours' },
]
