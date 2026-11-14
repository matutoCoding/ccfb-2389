import type { Project } from './types'

export const deg2rad = (d: number) => (d * Math.PI) / 180

// 中性层半径 = 内半径 + K * 板厚
export const neutralRadius = (r: number, k: number, t: number) => r + k * t

// 折弯处中性层弧长(折弯补偿 BA)
export const bendAllowance = (angle: number, r: number, k: number, t: number) =>
  deg2rad(angle) * neutralRadius(r, k, t)

export interface BendZone {
  x0: number
  x1: number
  ba: number // 中性层弧长
  nr: number // 中性层半径
}

export interface Layout {
  segX: { x0: number; x1: number }[] // 每段直段在展开图上的区间
  bendX: BendZone[] // 每个折弯区在展开图上的区间
  total: number // 展开总长
  straightSum: number // 直段合计
  arcSum: number // 弧长合计
}

// 展开布局: 直段长度与折弯补偿依次累加
export const computeLayout = (p: Project): Layout => {
  const segX: Layout['segX'] = []
  const bendX: BendZone[] = []
  let x = 0
  let straightSum = 0
  let arcSum = 0
  p.segments.forEach((seg, i) => {
    segX.push({ x0: x, x1: x + seg.length })
    x += seg.length
    straightSum += seg.length
    const bend = p.bends[i]
    if (bend) {
      const ba = bendAllowance(bend.angle, bend.radius, p.kFactor, p.thickness)
      bendX.push({ x0: x, x1: x + ba, ba, nr: neutralRadius(bend.radius, p.kFactor, p.thickness) })
      x += ba
      arcSum += ba
    }
  })
  return { segX, bendX, total: x, straightSum, arcSum }
}
