import { computed, reactive } from 'vue'

import type { Project } from './lib/types'
import { computeLayout } from './lib/bend_math'
import { buildOutline, buildProfile } from './lib/profile'
import { analyze } from './lib/checks'
import { createBuiltin, createBlank, uid } from './lib/builtin'
import { loadLibrary, saveLibrary } from './lib/storage'

export const store = reactive({
  project: createBuiltin() as Project,
  library: loadLibrary(),
  past: [] as string[],
  future: [] as string[],
  snapOn: true,
  snapGrid: 0.5,
})

// 派生计算: 改任何参数, 展开/轮廓/校验全部联动
export const layout = computed(() => computeLayout(store.project))
export const profile = computed(() => buildProfile(store.project, layout.value))
export const outline = computed(() => buildOutline(profile.value, store.project.thickness))
export const analysis = computed(() => analyze(store.project, layout.value, profile.value))

const HISTORY_LIMIT = 100

// 所有修改走 mutate: 先存快照再变更, 保证可撤销
export const mutate = (fn: () => void) => {
  store.past.push(JSON.stringify(store.project))
  if (store.past.length > HISTORY_LIMIT) store.past.shift()
  store.future = []
  fn()
  store.project.updatedAt = new Date().toISOString()
}

export const undo = () => {
  const prev = store.past.pop()
  if (!prev) return
  store.future.push(JSON.stringify(store.project))
  store.project = JSON.parse(prev)
}

export const redo = () => {
  const next = store.future.pop()
  if (!next) return
  store.past.push(JSON.stringify(store.project))
  store.project = JSON.parse(next)
}

// 孔位吸附: 网格 + 板宽中线 + 折弯区边缘
export const snapX = (x: number) => {
  if (!store.snapOn) return x
  const g = store.snapGrid
  let best = Math.round(x / g) * g
  let bestD = Math.abs(best - x)
  for (const b of layout.value.bendX) {
    for (const e of [b.x0, b.x1]) {
      const d = Math.abs(e - x)
      if (d < bestD && d <= g / 2) {
        best = e
        bestD = d
      }
    }
  }
  return Math.round(best * 1000) / 1000
}

export const snapY = (y: number) => {
  if (!store.snapOn) return y
  const g = store.snapGrid
  const mid = store.project.width / 2
  if (Math.abs(y - mid) <= g / 2) return mid
  return Math.round(Math.round(y / g) * g * 1000) / 1000
}

// 工程库操作
export const saveToLibrary = () => {
  const copy = JSON.parse(JSON.stringify(store.project)) as Project
  const i = store.library.findIndex((p) => p.id === copy.id)
  if (i >= 0) store.library[i] = copy
  else store.library.push(copy)
  saveLibrary(store.library)
}

export const removeFromLibrary = (id: string) => {
  store.library = store.library.filter((p) => p.id !== id)
  saveLibrary(store.library)
}

export const openProject = (p: Project) => {
  mutate(() => {
    store.project = JSON.parse(JSON.stringify(p))
  })
}

export const newProject = () => {
  mutate(() => {
    store.project = createBlank()
  })
}

export const resetBuiltin = () => {
  mutate(() => {
    store.project = createBuiltin()
  })
}

// 方案复制: 当前工程另存为新 id 副本并切换过去
export const duplicateProject = (p?: Project) => {
  const src = p ?? store.project
  const copy = JSON.parse(JSON.stringify(src)) as Project
  copy.id = uid()
  copy.name = `${src.name} 副本`
  copy.updatedAt = new Date().toISOString()
  store.library.push(copy)
  saveLibrary(store.library)
  if (!p) store.project = copy
  return copy
}
