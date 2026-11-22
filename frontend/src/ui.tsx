import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Beat, Status } from './api'
import { bucket, ms } from './format'

export function StatusMark({ status, paused }: { status: Status; paused?: boolean }) {
  const kind = paused ? 'paused' : status.toLowerCase()
  return <span className={`mark mark-${kind}`} aria-hidden />
}

export function depthClass(v: number) {
  return v < 100 ? 'd0' : v < 300 ? 'd1' : v < 1000 ? 'd2' : 'd3'
}

export function Ticks({ beats, slots = 40 }: { beats: Beat[]; slots?: number }) {
  const recent = beats.slice(-slots)
  const pad = Array.from({ length: slots - recent.length })
  return (
    <span className="ticks" role="img" aria-label={`Last ${recent.length} checks, ${recent.filter(b => !b.up).length} failed`}>
      {pad.map((_, i) => <i key={'p' + i} className="tick tick-none" />)}
      {recent.map(b => (
        <i key={b.t} className={`tick ${b.up ? `tick-up ${depthClass(b.ms)}` : 'tick-down'}`} title={`${new Date(b.t).toLocaleString()} · ${b.up ? ms(b.ms) : b.error ?? 'down'}`} />
      ))}
    </span>
  )
}

interface Point { t: number; ms: number | null; down: boolean }

const CONTOURS = [100, 300, 1000]
const FRACTIONS = [0, 0.32, 0.58, 0.82, 1]

export function TideChart({ beats }: { beats: Beat[] }) {
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const W = 800, H = 240, TOP = 12, BOTTOM = 24

  const points: Point[] = useMemo(() => bucket(beats, 240).map(group => {
    const up = group.filter(b => b.up)
    return {
      t: Date.parse(group[group.length - 1].t),
      ms: up.length ? up.reduce((s, b) => s + b.ms, 0) / up.length : null,
      down: up.length < group.length,
    }
  }), [beats])

  if (points.length < 2) return <p className="chart-empty">Not enough checks yet. The curve fills in after a few more.</p>

  const values = points.map(p => p.ms).filter((v): v is number => v != null)
  const allDown = values.length === 0
  const peak = allDown ? 0 : Math.max(...values)
  const top = Math.max(1500, peak * 1.08)
  const stops = [0, ...CONTOURS, top]
  const floor = H - BOTTOM
  const span = floor - TOP
  // banded scale: each depth band gets a fixed share of the height, linear inside it
  const y = (v: number) => {
    const c = Math.min(v, top)
    let i = 0
    while (i < stops.length - 2 && c > stops[i + 1]) i++
    const f = FRACTIONS[i] + ((c - stops[i]) / (stops[i + 1] - stops[i])) * (FRACTIONS[i + 1] - FRACTIONS[i])
    return floor - f * span
  }
  const x = (i: number) => (i / (points.length - 1)) * W

  let line = ''
  let pen = false
  points.forEach((p, i) => {
    if (p.ms == null) { pen = false; return }
    line += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.ms).toFixed(1)} `
    pen = true
  })
  const step = W / (points.length - 1)
  const hp = hover == null ? null : points[hover]
  const peakIndex = allDown ? -1 : points.findIndex(p => p.ms === peak)
  const pct = (v: number) => `${(v / H) * 100}%`

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(((e.clientX - r.left) / r.width) * (points.length - 1)))))
  }

  return (
    <figure className={`tide ${allDown ? 'tide-down' : ''}`}>
      <div className="tide-plot">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(null) }} role="img"
          aria-label={allDown ? 'No successful checks in this range' : `Response time over the selected range, peak ${ms(peak)}`}>
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" />
            </pattern>
          </defs>
          {!allDown && stops.slice(0, -1).map((b, i) => (
            <rect key={b} x="0" width={W} y={y(stops[i + 1])} height={y(b) - y(stops[i + 1])} className={`band band-${i}`} />
          ))}
          {!allDown && CONTOURS.map(b => <line key={b} x1="0" x2={W} y1={y(b)} y2={y(b)} className="contour" vectorEffect="non-scaling-stroke" />)}
          {points.map((p, i) => {
            if (!p.down) return null
            const x0 = Math.max(0, x(i) - step / 2)
            return <rect key={i} x={x0} width={Math.max(2, Math.min(W, x(i) + step / 2) - x0)} y={TOP} height={span} fill="url(#hatch)" className="outage" />
          })}
          <line x1="0" x2={W} y1={floor} y2={floor} className="baseline" vectorEffect="non-scaling-stroke" />
          {!allDown && <path d={line} className="curve" vectorEffect="non-scaling-stroke" />}
          {hp && !allDown && <line x1={x(hover!)} x2={x(hover!)} y1={TOP} y2={floor} className="cursor" vectorEffect="non-scaling-stroke" />}
        </svg>
        {!allDown && CONTOURS.map(b => <span key={b} className="sounding" style={{ top: pct(y(b)) }}>{b >= 1000 ? '1 s' : `${b} ms`}</span>)}
        {!allDown && peakIndex >= 0 && (
          <span className={`crest ${peakIndex > points.length * 0.85 ? 'crest-end' : ''}`} style={{ left: `${(peakIndex / (points.length - 1)) * 100}%`, top: pct(y(peak)) }}>{ms(peak)}</span>
        )}
        {allDown && <p className="tide-none"><span>No successful checks in this range</span></p>}
        {hp && hp.ms != null && <span className="cursor-dot" style={{ left: `${(hover! / (points.length - 1)) * 100}%`, top: pct(y(hp.ms)) }} />}
      </div>
      <figcaption className="tide-axis">
        <span>{new Date(points[0].t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        {!allDown && (hp
          ? <span className="tide-readout"><b>{hp.ms == null ? 'Down' : ms(hp.ms)}</b> at {new Date(hp.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{hp.down && hp.ms != null ? ', with failures' : ''}</span>
          : <span className="tide-readout tide-hint">Point at or tap the curve to read a value</span>)}
        <span>Now</span>
      </figcaption>
    </figure>
  )
}

export function Modal({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const openRef = useRef(open)
  openRef.current = open
  useEffect(() => {
    const d = ref.current!
    if (open && !d.open) {
      d.showModal()
      d.querySelector<HTMLElement>('input:not([type=checkbox])')?.focus()
    }
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? 'dialog-wide' : ''}`}
      aria-label={title}
      onClose={() => { if (openRef.current) onClose() }}
      onClick={e => { if (e.target === ref.current) onClose() }}
    >
      <div className="dialog-body">{open && children}</div>
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
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <Icon name={t.kind === 'ok' ? 'check' : 'alert'} size={15} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
  return { push, view }
}

export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden>
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" />
      <path d="M5 17h6l2.5-7 5 14 2.5-7H27" />
    </svg>
  )
}

export function Icon({ name, size = 16 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="icon">
      {ICONS[name]}
    </svg>
  )
}

const ICONS = {
  plus: <path d="M12 5v14M5 12h14" />,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  pause: <><path d="M9 5v14" /><path d="M15 5v14" /></>,
  play: <path d="M7 4v16l13-8z" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  external: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="1.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  alert: <><path d="M12 8v5M12 16.5h.01" /><circle cx="12" cy="12" r="9" /></>,
  back: <path d="M15 18l-6-6 6-6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
}
