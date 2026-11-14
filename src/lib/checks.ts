import type { Project } from './types'
import type { Layout } from './bend_math'
import type { ProfilePoint } from './profile'
import { aabbIntersect, holeAabb } from './geometry'

export interface HoleInfo {
  id: string
  crossBend: boolean // 跨弯孔: 包围盒与折弯区相交
  outOfBounds: boolean
  overlaps: string[] // 与之重叠的其他孔 id
}

export interface Interference {
  x: number
  y: number
  flat: number // 展开坐标, 用于定位
  text: string
}

export interface Analysis {
  closed: boolean
  closeMsg: string
  holes: HoleInfo[]
  interferences: Interference[]
  angleIssues: string[]
}

// 找展开坐标 x 附近最近的折弯序号, 用于干涉定位描述
const nearestBend = (layout: Layout, x: number) => {
  let best = -1
  let bestD = Infinity
  layout.bendX.forEach((b, i) => {
    const d = x < b.x0 ? b.x0 - x : x > b.x1 ? x - b.x1 : 0
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

export const analyze = (p: Project, layout: Layout, profile: ProfilePoint[]): Analysis => {
  // 轮廓闭合校验: 结构完整、长度为正、角度合法
  const problems: string[] = []
  if (p.segments.length < 2) problems.push('至少需要两段直段')
  if (p.bends.length !== p.segments.length - 1) problems.push('折弯数量与直段不匹配')
  if (p.width <= 0) problems.push('板宽必须为正')
  p.segments.forEach((s, i) => {
    if (s.length <= 0) problems.push(`直段${i + 1}长度必须为正`)
  })
  p.bends.forEach((b, i) => {
    if (b.angle <= 0 || b.angle >= 180) problems.push(`弯${i + 1}角度须在 0~180 之间`)
    if (b.radius < 0) problems.push(`弯${i + 1}内半径不能为负`)
  })
  const closed = problems.length === 0
  const closeMsg = closed ? '轮廓闭合, 结构完整' : problems.join('; ')

  // 角度工艺限位
  const angleIssues: string[] = []
  p.bends.forEach((b, i) => {
    if (b.angle < p.angleMin || b.angle > p.angleMax) {
      angleIssues.push(`弯${i + 1} 角度 ${b.angle}° 超出工艺限位 [${p.angleMin}°, ${p.angleMax}°]`)
    }
  })

  // 孔槽: 跨弯 / 出界 / 重叠
  const holes: HoleInfo[] = p.holes.map((h) => {
    const box = holeAabb(h)
    const crossBend = layout.bendX.some((b) => box.x0 < b.x1 && box.x1 > b.x0)
    const outOfBounds =
      box.x0 < 0 || box.x1 > layout.total || box.y0 < 0 || box.y1 > p.width
    return { id: h.id, crossBend, outOfBounds, overlaps: [] }
  })
  p.holes.forEach((a, i) => {
    p.holes.forEach((b, j) => {
      if (j <= i) return
      if (aabbIntersect(holeAabb(a), holeAabb(b))) {
        holes[i].overlaps.push(b.id)
        holes[j].overlaps.push(a.id)
      }
    })
  })

  // 干涉定位: 中层面上间距过小的非相邻点(板厚无法通过)
  const interferences: Interference[] = []
  const seen = new Set<number>()
  const t = p.thickness
  for (let i = 0; i < profile.length; i++) {
    for (let j = i + 6; j < profile.length; j++) {
      const dx = profile[i].x - profile[j].x
      const dy = profile[i].y - profile[j].y
      if (dx * dx + dy * dy < t * t * 0.98) {
        const key = Math.round(profile[i].flat)
        if (seen.has(key)) continue
        seen.add(key)
        const bi = nearestBend(layout, profile[i].flat)
        interferences.push({
          x: profile[i].x,
          y: profile[i].y,
          flat: profile[i].flat,
          text: `展开 ${profile[i].flat.toFixed(1)}mm 处板件相碰(弯${bi + 1}附近)`,
        })
        if (interferences.length >= 20) return { closed, closeMsg, holes, interferences, angleIssues }
      }
    }
  }
  return { closed, closeMsg, holes, interferences, angleIssues }
}
