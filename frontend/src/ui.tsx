import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Beat, Status } from './api'
import { bucket, ms } from './format'

export function StatusDot({ status, paused, size = 10 }: { status: Status; paused?: boolean; size?: number }) {
  const kind = paused ? 'paused' : status.toLowerCase()
  return <span className={`dot dot-${kind}`} style={{ width: size, height: size }} aria-label={paused ? 'paused' : status} />
}

export function Heartbeat({ beats, slots = 60 }: { beats: Beat[]; slots?: number }) {
  const recent = beats.slice(-slots)
  const pad = Array.from({ length: slots - recent.length })
  return (
    <div className="heartbeat" role="img" aria-label={`Last ${recent.length} checks`}>
      {pad.map((_, i) => <span key={'p' + i} className="tick tick-empty" />)}
      {recent.map((b, i) => (
        <span
          key={b.t}
          className={`tick ${b.up ? 'tick-up' : 'tick-down'} ${i === recent.length - 1 ? 'tick-last' : ''}`}
          title={`${new Date(b.t).toLocaleString()} · ${b.up ? ms(b.ms) : b.error ?? 'down'}`}
        />
      ))}
    </div>
  )
}

export function Sparkline({ beats, down }: { beats: Beat[]; down?: boolean }) {
  const id = useMemo(() => 'sg' + Math.random().toString(36).slice(2), [])
  const pts = beats.slice(-30).filter(b => b.up).map(b => b.ms)
  if (pts.length < 2) return <div className="sparkline sparkline-empty" />
  const max = Math.max(...pts) * 1.15
  const min = Math.min(...pts) * 0.85
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * 100, 32 - ((v - min) / (max - min || 1)) * 28 - 2])
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const color = down ? 'var(--down)' : 'var(--accent2)'
  return (
    <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L100,32 L0,32 Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

interface Point { t: number; ms: number | null; down: boolean; count: number }

export function LatencyChart({ beats }: { beats: Beat[] }) {
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const W = 800, H = 220, PAD = 28

  const points: Point[] = useMemo(() => bucket(beats, 200).map(group => {
    const up = group.filter(b => b.up)
    return {
      t: Date.parse(group[group.length - 1].t),
      ms: up.length ? up.reduce((s, b) => s + b.ms, 0) / up.length : null,
      down: up.length < group.length,
      count: group.length,
    }
  }), [beats])

  if (points.length < 2) return <div className="chart-empty">Collecting data — the chart fills in after a few checks.</div>

  const max = Math.max(50, ...points.map(p => p.ms ?? 0)) * 1.15
  const x = (i: number) => (i / (points.length - 1)) * W
  const y = (v: number) => PAD + (1 - v / max) * (H - PAD * 2)
  let line = ''
  let pen = false
  points.forEach((p, i) => {
    if (p.ms == null) { pen = false; return }
    line += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.ms).toFixed(1)} `
    pen = true
  })
  const firstUp = points.findIndex(p => p.ms != null)
  const lastUp = points.length - 1 - [...points].reverse().findIndex(p => p.ms != null)
  const area = firstUp < 0 ? '' : `${line} L${x(lastUp)},${H - PAD} L${x(firstUp)},${H - PAD} Z`
  const grid = [0.25, 0.5, 0.75].map(f => max * f)
  const bandW = W / (points.length - 1)
  const hp = hover == null ? null : points[hover]

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, i)))
  }

  return (
    <div className="chart">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Response time chart">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent1)" stopOpacity=".45" />
            <stop offset="1" stopColor="var(--accent2)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="stroke" x1="0" x2="1">
            <stop offset="0" stopColor="var(--accent1)" />
            <stop offset="1" stopColor="var(--accent2)" />
          </linearGradient>
        </defs>
        {grid.map(v => <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} className="gridline" />)}
        {points.map((p, i) => {
          if (!p.down) return null
          const x0 = Math.max(0, x(i) - bandW / 2)
          return <rect key={i} x={x0} y={PAD / 2} width={Math.max(Math.min(W, x(i) + bandW / 2) - x0, 2)} height={H - PAD * 1.5} className="downband" />
        })}
        <path d={area} fill="url(#area)" />
        <path d={line} fill="none" stroke="url(#stroke)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {hp && (
          <g>
            <line x1={x(hover!)} x2={x(hover!)} y1={PAD / 2} y2={H - PAD} className="crosshair" vectorEffect="non-scaling-stroke" />
            {hp.ms != null && <circle cx={x(hover!)} cy={y(hp.ms)} r="4" className="crossdot" vectorEffect="non-scaling-stroke" />}
          </g>
        )}
      </svg>
      <div className="chart-y">{grid.map(v => <span key={v} style={{ top: `${(y(v) / H) * 100}%` }}>{ms(v)}</span>)}</div>
      <div className="chart-x">
        <span>{new Date(points[0].t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>now</span>
      </div>
      {hp && (
        <div className="chart-tip" style={{ left: `${(hover! / (points.length - 1)) * 100}%` }}>
          <b>{hp.ms == null ? 'Down' : ms(hp.ms)}</b>
          <span>{new Date(hp.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{hp.down && hp.ms != null ? ' · had failures' : ''}</span>
        </div>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const openRef = useRef(open)
  openRef.current = open
  useEffect(() => {
    const d = ref.current!
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className={`modal glass ${wide ? 'modal-wide' : ''}`}
      aria-label={title}
      onClose={() => { if (openRef.current) onClose() }}
      onClick={e => { if (e.target === ref.current) onClose() }}
    >
      <div className="modal-body">{open && children}</div>
    </dialog>
  )
}

export interface Toast { id: number; text: string; kind: 'ok' | 'err' }

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = (text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800)
  }
  const view = (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(t => <div key={t.id} className={`toast glass toast-${t.kind}`}>{t.text}</div>)}
    </div>
  )
  return { push, view }
}

export function Icon({ name, size = 16 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}

const ICONS = {
  plus: <path d="M12 5v14M5 12h14" />,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
  play: <path d="M7 4v16l13-8z" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  external: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  alert: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0" /></>,
}

export function Backdrop() {
  return (
    <>
      <div className="aurora" aria-hidden><i /><i /><i /><i /></div>
      <div className="grain" aria-hidden />
    </>
  )
}

export function Logo() {
  return (
    <div className="logo glass">
      <svg viewBox="0 0 32 32" aria-hidden><path className="base" d="M3 17h7l3-8 5 15 3-7h8" /><path d="M3 17h7l3-8 5 15 3-7h8" /></svg>
    </div>
  )
}
