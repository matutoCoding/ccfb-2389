import type { Project } from './types'

export const uid = () => Math.random().toString(36).slice(2, 10)

export const BUILTIN_ID = 'builtin-double-bend-channel'

// 内置双折弯槽件: U 形槽, 两弯 90°, 含跨弯孔示例
export const createBuiltin = (): Project => ({
  id: BUILTIN_ID,
  name: '双折弯槽件(内置)',
  thickness: 2,
  kFactor: 0.44,
  width: 60,
  angleMin: 15,
  angleMax: 175,
  segments: [
    { id: uid(), length: 40 },
    { id: uid(), length: 30 },
    { id: uid(), length: 40 },
  ],
  bends: [
    { id: uid(), angle: 90, dir: 1, radius: 2, order: 1 },
    { id: uid(), angle: 90, dir: 1, radius: 2, order: 2 },
  ],
  holes: [
    { id: uid(), type: 'slot', x: 59.5, y: 30, d: 0, len: 20, wid: 6 },
    { id: uid(), type: 'circle', x: 20, y: 30, d: 8, len: 0, wid: 0 },
    { id: uid(), type: 'circle', x: 99, y: 30, d: 8, len: 0, wid: 0 },
    { id: uid(), type: 'circle', x: 42.3, y: 30, d: 3, len: 0, wid: 0 },
  ],
  updatedAt: new Date().toISOString(),
})

export const createBlank = (): Project => ({
  ...createBuiltin(),
  id: uid(),
  name: '新建工程',
  holes: [],
  updatedAt: new Date().toISOString(),
})
