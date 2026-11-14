<script setup lang="ts">
import { computed, ref } from 'vue'

import { store, layout, analysis } from '../store'
import FlatSvg from '../components/FlatSvg.vue'

const withDims = ref(true)
const p = computed(() => store.project)
const lay = computed(() => layout.value)
const ana = computed(() => analysis.value)

const holeMap = computed(() => {
  const map = new Map()
  ana.value.holes.forEach((h) => map.set(h.id, h))
  return map
})

const holeParam = (h: { type: string; d: number; len: number; wid: number }) =>
  h.type === 'circle' ? `⌀${h.d}` : `${h.len} × ${h.wid}`
</script>

<template>
  <div class="unfold-page">
    <div class="card viewer">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <span class="sec-title">展开图</span>
        <label class="flex items-center gap-2 lbl cursor-pointer">
          <input type="checkbox" v-model="withDims" />尺寸标注
        </label>
      </div>
      <div class="canvas">
        <FlatSvg :with-dims="withDims" />
      </div>
    </div>

    <div class="flex flex-col gap-4 side">
      <!-- 尺寸明细: 直段与中性层弧长分开列账 -->
      <div class="card p-4">
        <div class="sec-title mb-2">尺寸明细</div>
        <table class="tbl">
          <thead>
            <tr><th>部位</th><th>类型</th><th class="text-right">数值 mm</th></tr>
          </thead>
          <tbody>
            <template v-for="(seg, i) in p.segments" :key="seg.id">
              <tr>
                <td>直段{{ i + 1 }}</td>
                <td>直段</td>
                <td class="text-right">{{ seg.length.toFixed(2) }}</td>
              </tr>
              <tr v-if="p.bends[i]">
                <td>弯{{ i + 1 }}</td>
                <td>
                  中性层弧长
                  <span class="lbl">(R{{ p.bends[i].radius }}+K·T={{ lay.bendX[i].nr.toFixed(2) }})</span>
                </td>
                <td class="text-right">{{ lay.bendX[i].ba.toFixed(3) }}</td>
              </tr>
            </template>
            <tr class="sum"><td>直段合计</td><td></td><td class="text-right">{{ lay.straightSum.toFixed(2) }}</td></tr>
            <tr class="sum"><td>弧长合计</td><td></td><td class="text-right">{{ lay.arcSum.toFixed(3) }}</td></tr>
            <tr class="total"><td>展开总长</td><td>K = {{ p.kFactor }}, T = {{ p.thickness }}</td><td class="text-right">{{ lay.total.toFixed(2) }}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- 孔位明细 -->
      <div class="card p-4">
        <div class="sec-title mb-2">孔位明细(展开坐标)</div>
        <table class="tbl" v-if="p.holes.length">
          <thead>
            <tr><th>类型</th><th class="text-right">X</th><th class="text-right">Y</th><th>参数</th><th>状态</th></tr>
          </thead>
          <tbody>
            <tr v-for="h in p.holes" :key="h.id">
              <td>{{ h.type === 'circle' ? '圆孔' : '槽孔' }}</td>
              <td class="text-right">{{ h.x.toFixed(1) }}</td>
              <td class="text-right">{{ h.y.toFixed(1) }}</td>
              <td>{{ holeParam(h) }}</td>
              <td>
                <span v-if="holeMap.get(h.id)?.crossBend" class="badge badge-warn">跨弯</span>
                <span v-if="holeMap.get(h.id)?.outOfBounds" class="badge badge-danger">出界</span>
                <span v-if="holeMap.get(h.id)?.overlaps.length" class="badge badge-danger">重叠</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="lbl">暂无孔槽</div>
      </div>

      <!-- 校验结果 -->
      <div class="card p-4 flex flex-col gap-2">
        <div class="sec-title">校验</div>
        <div class="flex items-center gap-2">
          <span class="badge" :class="ana.closed ? 'badge-ok' : 'badge-danger'">
            {{ ana.closed ? '轮廓闭合' : '轮廓异常' }}
          </span>
          <span class="lbl">{{ ana.closeMsg }}</span>
        </div>
        <div v-if="ana.angleIssues.length" class="msg warn" v-for="(m, i) in ana.angleIssues" :key="'a' + i">{{ m }}</div>
        <div v-if="ana.interferences.length" class="msg danger" v-for="(it, i) in ana.interferences" :key="'i' + i">{{ it.text }}</div>
        <div v-if="!ana.angleIssues.length && !ana.interferences.length && ana.closed" class="lbl">
          无干涉, 无超限, 可以出件
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unfold-page {
  display: grid;
  grid-template-columns: 1fr 400px;
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
.side {
  min-width: 0;
}
.sum td {
  font-weight: var(--fw-medium);
  color: var(--c-sub);
}
.total td {
  font-weight: var(--fw-semibold);
  color: var(--c-accent);
  font-size: var(--fs-sm);
}
.msg {
  font-size: var(--fs-xs);
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--radius-sm);
}
.msg.warn {
  background: var(--c-warn-soft);
  color: var(--c-warn);
}
.msg.danger {
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
@media (max-width: 1100px) {
  .unfold-page {
    grid-template-columns: 1fr;
  }
}
</style>
