// 板件 = 直段与折弯交替排列: seg0 - bend0 - seg1 - bend1 - seg2 ...
export interface Segment {
  id: string
  length: number // 直段长度 mm
}

export interface Bend {
  id: string
  angle: number // 折弯角(度), 1~179
  dir: 1 | -1 // 折弯方向: 1 向上 / -1 向下
  radius: number // 内半径 mm
  order: number // 折弯顺序
}

export type HoleType = 'circle' | 'slot'

// 孔槽定义在展开坐标系: x 沿展开全长, y 沿板宽
// 跨弯孔因此始终是完整实体, 展开/折弯只是坐标映射, 不会断裂
export interface Hole {
  id: string
  type: HoleType
  x: number
  y: number
  d: number // 圆孔直径
  len: number // 槽长(沿 x)
  wid: number // 槽宽(沿 y)
}

export interface Project {
  id: string
  name: string
  thickness: number // 板厚 T
  kFactor: number // K 因子
  width: number // 板宽
  angleMin: number // 工艺角度限位
  angleMax: number
  segments: Segment[]
  bends: Bend[] // 长度恒为 segments.length - 1
  holes: Hole[]
  updatedAt: string
}
