export type Status = 'PENDING' | 'UP' | 'DOWN'

export interface Monitor {
  id: number
  name: string
  url: string
  intervalSeconds: number
  paused: boolean
  status: Status
  statusSince: string
  lastCheckedAt: string | null
  lastLatencyMs: number | null
  lastStatusCode: number | null
  lastError: string | null
  createdAt: string
}

export interface Beat {
  t: string
  up: boolean
  ms: number
  code: number | null
  error: string | null
}

export interface MonitorView {
  monitor: Monitor
  uptime24h: number | null
  uptime30d: number | null
  avgMs24h: number | null
  beats: Beat[]
}

export interface Incident {
  id: number
  monitorId: number
  startedAt: string
  resolvedAt: string | null
  cause: string | null
}

export interface Webhook {
  id: number
  name: string
  url: string
  enabled: boolean
  lastSentAt: string | null
  lastStatusCode: number | null
  lastError: string | null
}

export type MonitorForm = Pick<Monitor, 'name' | 'url' | 'intervalSeconds'>
export type WebhookForm = Pick<Webhook, 'name' | 'url' | 'enabled'>

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch('/api' + path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? data?.detail ?? `Request failed (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  monitors: () => call<MonitorView[]>('GET', '/monitors'),
  history: (id: number, hours: number) => call<Beat[]>('GET', `/monitors/${id}/checks?hours=${hours}`),
  createMonitor: (f: MonitorForm) => call<Monitor>('POST', '/monitors', f),
  updateMonitor: (id: number, f: MonitorForm) => call<Monitor>('PUT', `/monitors/${id}`, f),
  pause: (id: number, paused: boolean) => call<Monitor>('POST', `/monitors/${id}/pause?paused=${paused}`),
  checkNow: (id: number) => call<Monitor>('POST', `/monitors/${id}/check`),
  deleteMonitor: (id: number) => call<void>('DELETE', `/monitors/${id}`),
  incidents: () => call<Incident[]>('GET', '/incidents'),
  webhooks: () => call<Webhook[]>('GET', '/webhooks'),
  createWebhook: (f: WebhookForm) => call<Webhook>('POST', '/webhooks', f),
  updateWebhook: (id: number, f: WebhookForm) => call<Webhook>('PUT', `/webhooks/${id}`, f),
  testWebhook: (id: number) => call<Webhook>('POST', `/webhooks/${id}/test`),
  deleteWebhook: (id: number) => call<void>('DELETE', `/webhooks/${id}`),
}
