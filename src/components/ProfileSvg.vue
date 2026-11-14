<script setup lang="ts">
import { computed } from 'vue'

import { store, layout, profile, outline, analysis } from '../store'
import type { ProfilePoint } from '../lib/profile'

// 侧视轮廓: y 轴翻转到 SVG 坐标系
const mapped = computed(() => profile.value.map((pt) => ({ x: pt.x, y: -pt.y, flat: pt.flat })))
const outlinePts = computed(() => outline.value.map((pt) => `${pt.x},${-pt.y}`).join(' '))
const centerPts = computed(() => mapped.value.map((pt) => `${pt.x},${pt.y}`).join(' '))

const bounds = computed(() => {
  const xs = mapped.value.map((pt) => pt.x)
  const ys = mapped.value.map((pt) => pt.y)
  const m = 14
  const x0 = Math.min(...xs) - m
  const y0 = Math.min(...ys) - m
  return {
    x: x0,
    y: y0,
    w: Math.max(...xs) - x0 + m,
    h: Math.max(...ys) - y0 + m,
  }
})
const viewBox = computed(() => {
  const b = bounds.value
  return `${b.x} ${b.y} ${b.w} ${b.h}`
})

// 按展开坐标在轮廓上插值取点, 用于标注定位
const pointAtFlat = (flat: number): ProfilePoint => {
  const pts = mapped.value
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].flat >= flat) {
      const span = pts[i].flat - pts[i - 1].flat
      const f = span > 1e-9 ? (flat - pts[i - 1].flat) / span : 0
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
        flat,
      }
    }
  }
  return pts[pts.length - 1]
}

const segLabels = computed(() =>
  store.project.segments.map((seg, i) => {
    const sx = layout.value.segX[i]
    const pt = pointAtFlat((sx.x0 + sx.x1) / 2)
    return { x: pt.x, y: pt.y, text: seg.length.toFixed(1), key: seg.id }
  }),
)

const bendLabels = computed(() =>
  store.project.bends.map((bend, i) => {
    const bz = layout.value.bendX[i]
    const pt = pointAtFlat((bz.x0 + bz.x1) / 2)
    return { x: pt.x, y: pt.y, text: `弯${i + 1} ${bend.angle}°`, key: bend.id }
  }),
)

const marks = computed(() => analysis.value.interferences.map((it) => ({ x: it.x, y: -it.y, text: it.text })))
</script>

<template>
  <svg :viewBox="viewBox" class="profile-svg" role="img" aria-label="折弯侧视轮廓">
    <polygon :points="outlinePts" fill="#f1f5f9" stroke="#0f172a" stroke-width="0.35" />
    <polyline :points="centerPts" fill="none" stroke="#94a3b8" stroke-width="0.2" stroke-dasharray="1.5 1" />

    <g v-for="s in segLabels" :key="s.key">
      <text :x="s.x" :y="s.y + 5" text-anchor="middle" font-size="3.2" fill="#334155">{{ s.text }}</text>
    </g>
    <g v-for="b in bendLabels" :key="b.key">
      <circle :cx="b.x" :cy="b.y" r="0.8" fill="#2563eb" />
      <text :x="b.x" :y="b.y - 3" text-anchor="middle" font-size="3.2" fill="#2563eb">{{ b.text }}</text>
    </g>

    <!-- 干涉定位标记 -->
    <g v-for="(mk, i) in marks" :key="'mk' + i">
      <circle :cx="mk.x" :cy="mk.y" r="1.6" fill="none" stroke="#dc2626" stroke-width="0.4" />
      <circle :cx="mk.x" :cy="mk.y" r="0.5" fill="#dc2626" />
      <title>{{ mk.text }}</title>
    </g>
  </svg>
</template>

<style scoped>
.profile-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
