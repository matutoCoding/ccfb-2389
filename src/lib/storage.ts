import type { Project } from './types'

const KEY = 'sheetloft.library.v1'

// localStorage 属于外部不可信来源, 解析失败回退空数组
export const loadLibrary = (): Project[] => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const saveLibrary = (list: Project[]) => {
  localStorage.setItem(KEY, JSON.stringify(list))
}
