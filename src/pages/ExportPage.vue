<script setup lang="ts">
import { computed, ref } from 'vue'

import { store, mutate, saveToLibrary, duplicateProject } from '../store'
import { download } from '../lib/download'
import type { Project } from '../lib/types'
import Icon from '../components/Icon.vue'
import FlatSvg from '../components/FlatSvg.vue'

const flatRef = ref<InstanceType<typeof FlatSvg>>()
const withDims = ref(true)
const savedTip = ref('')
const fileInp = ref<HTMLInputElement>()

const p = computed(() => store.project)
const fileName = computed(() => p.value.name.replace(/[\\/:*?"<>|]/g, '_'))

let tipTimer = 0
const tip = (msg: string) => {
  savedTip.value = msg
  clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => (savedTip.value = ''), 2000)
}

// SVG 出件: 直接序列化渲染节点, 所见即所得
const exportSvg = () => {
  const el = flatRef.value?.el
  if (!el) return
  const str = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(el)}`
  download(`${fileName.value}.svg`, str, 'image/svg+xml')
  tip('SVG 已导出')
}

const exportJson = () => {
  download(`${fileName.value}.json`, JSON.stringify(p.value, null, 2), 'application/json')
  tip('工程已导出')
}

const importJson = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result)) as Project
      if (!Array.isArray(obj.segments) || !Array.isArray(obj.bends) || !Array.isArray(obj.holes)) {
        tip('文件格式不正确')
        return
      }
      mutate(() => {
        store.project = obj
      })
      tip('工程已导入')
    } catch {
      tip('文件解析失败')
    }
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

const archive = () => {
  saveToLibrary()
  tip('已存入工程库')
}

const duplicate = () => {
  duplicateProject()
  tip('已复制为新方案')
}
</script>

<template>
  <div class="export-page">
    <div class="card viewer">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <span class="sec-title">出件预览</span>
        <label class="flex items-center gap-2 lbl cursor-pointer">
          <input type="checkbox" v-model="withDims" />尺寸标注
        </label>
      </div>
      <div class="canvas">
        <FlatSvg ref="flatRef" :with-dims="withDims" />
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="card p-4 flex flex-col gap-3">
        <div class="sec-title">出件</div>
        <button class="btn btn-primary" @click="exportSvg">
          <Icon name="download" :size="14" />下载 SVG 展开图
        </button>
        <button class="btn" @click="exportJson">
          <Icon name="download" :size="14" />导出工程 JSON
        </button>
        <button class="btn" @click="fileInp?.click()">
          <Icon name="upload" :size="14" />导入工程 JSON
        </button>
        <input ref="fileInp" type="file" accept=".json,application/json" class="hidden" @change="importJson" />
      </div>

      <div class="card p-4 flex flex-col gap-3">
        <div class="sec-title">方案管理</div>
        <button class="btn" @click="archive">
          <Icon name="save" :size="14" />存入工程库(浏览器存档)
        </button>
        <button class="btn" @click="duplicate">
          <Icon name="copy" :size="14" />复制当前方案
        </button>
        <div class="lbl">存档保存在浏览器 localStorage, 清缓存会丢失, 重要工程请导出 JSON 备份</div>
      </div>

      <transition name="fade">
        <div v-if="savedTip" class="tip">{{ savedTip }}</div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.export-page {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--sp-4);
  align-items: start;
}
.viewer {
  overflow: hidden;
}
.canvas {
  height: calc(100vh - 180px);
  min-height: 400px;
  padding: var(--sp-4);
}
.tip {
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-ok-soft);
  color: var(--c-ok);
  border-radius: var(--radius);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  text-align: center;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--t);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width: 1100px) {
  .export-page {
    grid-template-columns: 1fr;
  }
}
</style>
