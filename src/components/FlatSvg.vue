<script setup lang="ts">
import { computed, ref } from 'vue'

import { store, layout, analysis } from '../store'

// withDims: 是否绘制尺寸标注(出件页可开关)
const props = withDefaults(defineProps<{ withDims?: boolean }>(), { withDims: true })

const el = ref<SVGSVGElement>()
defineExpose({ el })

const p = computed(() => store.project)
const lay = computed(() => layout.value)

// 图面边距: 左侧放板宽标注, 下方放两段尺寸链
const M = { l: 26, t: 14, r: 10, b: 34 }
const viewBox = computed(
  () =>
    `${-M.l} ${-M.t} ${lay.value.total + M.l + M.r} ${p.value.width + M.t + M.b}`,
)

// 尺寸链条目: 直段标长度, 折弯标中性层弧长
interface DimItem {
  x0: number
  x1: number
  label: string
  bend: boolean
}
const dimItems = computed<DimItem[]>(() => {
  const items: DimItem[] = []
  p.value.segments.forEach((seg, i) => {
    const sx = lay.value.segX[i]
    items.push({ x0: sx.x0, x1: sx.x1, label: seg.length.toFixed(1), bend: false })
    const bz = lay.value.bendX[i]
    if (bz) items.push({ x0: bz.x0, x1: bz.x1, label: `弧${bz.ba.toFixed(2)}`, bend: true })
  })
  return items
})

const holeInfo = computed(() => {
  const map = new Map<string, { crossBend: boolean; outOfBounds: boolean; overlaps: string[] }>()
  analysis.value.holes.forEach((h) => map.set(h.id, h))
  return map
})

const holeLabel = (h: { type: string; d: number; len: number; wid: number }) =>
  h.type === 'circle' ? `⌀${h.d}` : `${h.len}×${h.wid}`

const f = (n: number) => Math.round(n * 100) / 100
</script>

<template>
  <svg
    ref="el"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    class="flat-svg"
    role="img"
    aria-label="展开图"
  >
    <rect :x="-M.l" :y="-M.t" :width="lay.total + M.l + M.r" :height="p.width + M.t + M.b" fill="#ffffff" />

    <!-- 折弯区: 淡色填充 + 中性层虚线 -->
    <g v-for="(bz, i) in lay.bendX" :key="'bz' + i">
      <rect :x="bz.x0" y="0" :width="bz.ba" :height="p.width" fill="#2563eb" opacity="0.07" />
      <line
        :x1="(bz.x0 + bz.x1) / 2"
        y1="0"
        :x2="(bz.x0 + bz.x1) / 2"
        :y2="p.width"
        stroke="#2563eb"
        stroke-width="0.25"
        stroke-dasharray="2 1.5"
      />
      <text
        :x="(bz.x0 + bz.x1) / 2"
        y="-4"
        text-anchor="middle"
        font-size="3.2"
        fill="#2563eb"
      >弯{{ i + 1 }} {{ p.bends[i].angle }}°</text>
    </g>

    <!-- 外轮廓 -->
    <rect
      x="0"
      y="0"
      :width="lay.total"
      :height="p.width"
      fill="none"
      stroke="#0f172a"
      stroke-width="0.35"
    />

    <!-- 孔槽: 跨弯孔整体绘制, 绝不切断 -->
    <g v-for="h in p.holes" :key="h.id">
      <circle
        v-if="h.type === 'circle'"
        :cx="h.x"
        :cy="h.y"
        :r="h.d / 2"
        fill="none"
        :stroke="holeInfo.get(h.id)?.crossBend ? '#d97706' : '#0f172a'"
        :stroke-width="holeInfo.get(h.id)?.crossBend ? 0.4 : 0.3"
      />
      <rect
        v-else
        :x="h.x - h.len / 2"
        :y="h.y - h.wid / 2"
        :width="h.len"
        :height="h.wid"
        :rx="h.wid / 2"
        fill="none"
        :stroke="holeInfo.get(h.id)?.crossBend ? '#d97706' : '#0f172a'"
        :stroke-width="holeInfo.get(h.id)?.crossBend ? 0.4 : 0.3"
      />
      <text :x="h.x" :y="h.y - (h.type === 'circle' ? h.d : h.wid) / 2 - 1.2" text-anchor="middle" font-size="2.8" fill="#64748b">
        {{ holeLabel(h) }}{{ holeInfo.get(h.id)?.crossBend ? ' 跨弯' : '' }}
      </text>
    </g>

    <!-- 尺寸标注 -->
    <g v-if="props.withDims" stroke="#94a3b8" stroke-width="0.2">
      <template v-for="(d, i) in dimItems" :key="'dim' + i">
        <line :x1="d.x0" :y1="p.width" :x2="d.x0" :y2="p.width + 9" />
        <line :x1="d.x1" :y1="p.width" :x2="d.x1" :y2="p.width + 9" />
        <line :x1="d.x0" :y1="p.width + 7" :x2="d.x1" :y2="p.width + 7" />
        <path :d="`M${f(d.x0)} ${p.width + 7} l2 -0.8 v1.6 z M${f(d.x1)} ${p.width + 7} l-2 -0.8 v1.6 z`" fill="#94a3b8" stroke="none" />
        <text
          :x="(d.x0 + d.x1) / 2"
          :y="p.width + 5.6"
          text-anchor="middle"
          font-size="3"
          :fill="d.bend ? '#2563eb' : '#334155'"
          stroke="none"
        >{{ d.label }}</text>
      </template>
      <!-- 总长 -->
      <line x1="0" :y1="p.width + 16" :x2="lay.total" :y2="p.width + 16" />
      <path :d="`M0 ${p.width + 16} l2.4 -1 v2 z M${f(lay.total)} ${p.width + 16} l-2.4 -1 v2 z`" fill="#94a3b8" stroke="none" />
      <text :x="lay.total / 2" :y="p.width + 14.4" text-anchor="middle" font-size="3.4" fill="#0f172a" stroke="none">
        展开总长 {{ lay.total.toFixed(2) }}
      </text>
      <!-- 板宽 -->
      <line x1="-8" y1="0" x2="-8" :y2="p.width" />
      <path :d="`M-8 0 l-1 2.4 h2 z M-8 ${f(p.width)} l-1 -2.4 h2 z`" fill="#94a3b8" stroke="none" />
      <text :x="-11" :y="p.width / 2" text-anchor="middle" font-size="3.4" fill="#0f172a" stroke="none" :transform="`rotate(-90 -11 ${f(p.width / 2)})`">
        板宽 {{ p.width }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.flat-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
