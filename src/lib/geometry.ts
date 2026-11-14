import type { Hole } from './types'

export interface Aabb {
  x0: number
  y0: number
  x1: number
  y1: number
}

// 孔的包围盒: 圆孔取外接方, 槽孔取长宽范围
export const holeAabb = (h: Hole): Aabb => {
  if (h.type === 'circle') {
    return { x0: h.x - h.d / 2, y0: h.y - h.d / 2, x1: h.x + h.d / 2, y1: h.y + h.d / 2 }
  }
  return { x0: h.x - h.len / 2, y0: h.y - h.wid / 2, x1: h.x + h.len / 2, y1: h.y + h.wid / 2 }
}

export const aabbIntersect = (a: Aabb, b: Aabb) =>
  a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

export interface Pt {
  x: number
  y: number
}

// 线段求交(含端点), 用于轮廓自交检测
export const segIntersect = (a: Pt, b: Pt, c: Pt, d: Pt): Pt | null => {
  const r = { x: b.x - a.x, y: b.y - a.y }
  const s = { x: d.x - c.x, y: d.y - c.y }
  const den = r.x * s.y - r.y * s.x
  if (Math.abs(den) < 1e-12) return null
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: a.x + t * r.x, y: a.y + t * r.y }
}
