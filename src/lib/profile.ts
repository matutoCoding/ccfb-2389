import type { Project } from './types'
import { deg2rad, type Layout } from './bend_math'

export interface Pt {
  x: number
  y: number
}

export interface ProfilePoint extends Pt {
  flat: number // 该点对应的展开坐标, 用于孔位映射与干涉定位
}

// 折弯后侧视轮廓(中层面): 直段走直线, 折弯处走半径 R+T/2 的圆弧
export const buildProfile = (p: Project, layout: Layout, arcSteps = 24): ProfilePoint[] => {
  const pts: ProfilePoint[] = [{ x: 0, y: 0, flat: 0 }]
  let heading = 0
  let cx = 0
  let cy = 0
  p.segments.forEach((seg, i) => {
    cx += Math.cos(heading) * seg.length
    cy += Math.sin(heading) * seg.length
    pts.push({ x: cx, y: cy, flat: layout.segX[i].x1 })
    const bend = p.bends[i]
    if (!bend) return
    const zone = layout.bendX[i]
    const phi = deg2rad(bend.angle) * bend.dir
    const rm = bend.radius + p.thickness / 2
    // 弧心在行进方向的法线上, 方向由 dir 决定
    const na = heading + (bend.dir > 0 ? Math.PI / 2 : -Math.PI / 2)
    const ccx = cx + Math.cos(na) * rm
    const ccy = cy + Math.sin(na) * rm
    const a0 = Math.atan2(cy - ccy, cx - ccx)
    for (let s = 1; s <= arcSteps; s++) {
      const f = s / arcSteps
      const a = a0 + phi * f
      pts.push({
        x: ccx + Math.cos(a) * rm,
        y: ccy + Math.sin(a) * rm,
        flat: zone.x0 + zone.ba * f,
      })
    }
    cx = pts[pts.length - 1].x
    cy = pts[pts.length - 1].y
    heading += phi
  })
  return pts
}

// 中线两侧各偏移 T/2 得到带厚度的截面轮廓多边形
export const buildOutline = (pts: Pt[], t: number): Pt[] => {
  const n = pts.length
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[Math.min(n - 1, i + 1)]
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const l = Math.hypot(dx, dy) || 1
    left.push({ x: pts[i].x - (dy / l) * (t / 2), y: pts[i].y + (dx / l) * (t / 2) })
    right.push({ x: pts[i].x + (dy / l) * (t / 2), y: pts[i].y - (dx / l) * (t / 2) })
  }
  return [...left, ...right.reverse()]
}
