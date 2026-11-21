import { describe, expect, it } from 'vitest'
import { ago, bucket, duration, interval, ms, pct, percentile } from './format'

describe('format', () => {
  it('durations', () => {
    expect(duration(42)).toBe('42s')
    expect(duration(135 * 60)).toBe('2h 15m')
    expect(duration(50 * 3600)).toBe('2d 2h')
    expect(ago(null)).toBe('never')
    expect(ago(new Date(Date.now() - 2000).toISOString())).toBe('just now')
    expect(ago(new Date(Date.now() - 90_000).toISOString())).toBe('1m ago')
  })

  it('uptime never rounds up to 100%', () => {
    expect(pct(99.999)).toBe('99.99%')
    expect(pct(100)).toBe('100%')
    expect(pct(null)).toBe('—')
  })

  it('latency and interval', () => {
    expect(ms(87.4)).toBe('87ms')
    expect(ms(1530)).toBe('1.53s')
    expect(interval(30)).toBe('30s')
    expect(interval(300)).toBe('5m')
    expect(interval(3600)).toBe('1h')
  })

  it('percentile and bucketing', () => {
    expect(percentile([], 95)).toBeNull()
    expect(percentile([5, 1, 3, 2, 4], 50)).toBe(3)
    expect(percentile(Array.from({ length: 100 }, (_, i) => i + 1), 95)).toBe(95)
    const b = bucket(Array.from({ length: 1000 }, (_, i) => i), 100)
    expect(b).toHaveLength(100)
    expect(b.flat()).toHaveLength(1000)
    expect(bucket([1, 2], 10)).toEqual([[1], [2]])
  })
})
