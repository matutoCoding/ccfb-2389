<script setup lang="ts">
import { computed, ref } from 'vue'

import { store, layout, analysis, mutate, snapX, snapY } from '../store'
import { uid } from '../lib/builtin'
import type { Bend, HoleType } from '../lib/types'
import Icon from '../components/Icon.vue'
import ThreeView from '../components/ThreeView.vue'
import ProfileSvg from '../components/ProfileSvg.vue'
import FlatSvg from '../components/FlatSvg.vue'

const tab = ref<'3d' | 'side' | 'flat'>('3d')
const p = computed(() => store.project)
const ana = computed(() => analysis.value)

const num = (e: Event) => parseFloat((e.target as HTMLInputElement).value)
const ok = (v: number) => Number.isFinite(v)

// 板材参数
const setParam = (field: 'name' | 'thickness' | 'kFactor' | 'width' | 'angleMin' | 'angleMax', v: string | number) => {
  if (typeof v === 'number' && !ok(v)) return
  mutate(() => {
    // @ts-expect-error 字段与值类型已按调用点约束
    p.value[field] = v
  })
}

// 直段
const setSeg = (i: number, v: number) => {
  if (!ok(v) || v <= 0) return
  mutate(() => {
    p.value.segments[i].length = v
  })
}

// 在直段 i 中间加一条折线: 直段对半分
const addBendAfter = (i: number) => {
  mutate(() => {
    const seg = p.value.segments[i]
    const half = Math.round((seg.length / 2) * 100) / 100
    seg.length = half
    p.value.segments.splice(i + 1, 0, { id: uid(), length: half })
    const order = Math.max(0, ...p.value.bends.map((b) => b.order)) + 1
    p.value.bends.splice(i, 0, { id: uid(), angle: 90, dir: 1, radius: p.value.thickness, order })
  })
}

// 删除折线 i: 合并相邻两段
const removeBend = (i: number) => {
  mutate(() => {
    p.value.segments[i].length += p.value.segments[i + 1].length
    p.value.segments.splice(i + 1, 1)
    p.value.bends.splice(i, 1)
  })
}

const setBend = (i: number, field: keyof Bend, v: number) => {
  if (!ok(v)) return
  mutate(() => {
    const b = p.value.bends[i]
    if (field === 'angle') b.angle = Math.min(179, Math.max(1, v))
    else if (field === 'radius') b.radius = Math.max(0, v)
    else if (field === 'order') b.order = Math.max(1, Math.round(v))
  })
}

const flipBend = (i: number) => {
  mutate(() => {
    const b = p.value.bends[i]
    b.dir = b.dir === 1 ? -1 : 1
  })
}

const bendOutOfLimit = (b: Bend) => b.angle < p.value.angleMin || b.angle > p.value.angleMax

// 孔槽
const addHole = (type: HoleType) => {
  mutate(() => {
    const sx = layout.value.segX[0]
    p.value.holes.push({
      id: uid(),
      type,
      x: snapX((sx.x0 + sx.x1) / 2),
      y: snapY(p.value.width / 2),
      d: type === 'circle' ? 6 : 0,
      len: type === 'slot' ? 16 : 0,
      wid: type === 'slot' ? 6 : 0,
    })
  })
}

const setHole = (id: string, field: 'x' | 'y' | 'd' | 'len' | 'wid', v: number) => {
  if (!ok(v)) return
  mutate(() => {
    const h = p.value.holes.find((x) => x.id === id)
    if (!h) return
    if (field === 'x') h.x = snapX(v)
    else if (field === 'y') h.y = snapY(v)
    else h[field] = Math.max(0.1, v)
  })
}

const removeHole = (id: string) => {
  mutate(() => {
    p.value.holes = p.value.holes.filter((h) => h.id !== id)
  })
}

const holeInfo = computed(() => {
  const map = new Map()
  ana.value.holes.forEach((h) => map.set(h.id, h))
  return map
})
</script>

<template>
  <div class="editor-page">
    <!-- 视图区 -->
    <div class="card viewer">
      <div class="flex items-center gap-1 px-3 py-2 border-b border-slate-200">
        <button class="tab" :class="{ on: tab === '3d' }" @click="tab = '3d'">3D 预览</button>
        <button class="tab" :class="{ on: tab === 'side' }" @click="tab = 'side'">侧视轮廓</button>
        <button class="tab" :class="{ on: tab === 'flat' }" @click="tab = 'flat'">展开图</button>
        <span class="lbl ml-auto">3D 预览不显示孔槽, 孔位以展开图为准</span>
      </div>
      <div class="canvas">
        <ThreeView v-show="tab === '3d'" />
        <ProfileSvg v-if="tab === 'side'" />
        <FlatSvg v-if="tab === 'flat'" :with-dims="false" />
      </div>
    </div>

    <!-- 参数面板 -->
    <div class="panel">
      <div class="card p-4 flex flex-col gap-3">
        <div class="sec-title">板材参数</div>
        <input class="inp w-full" :value="p.name" placeholder="工程名称"
          @change="setParam('name', ($event.target as HTMLInputElement).value)" />
        <div class="grid grid-cols-2 gap-3">
          <label class="fld">板厚 T mm
            <input class="inp inp-num" type="number" step="0.1" min="0.1" :value="p.thickness"
              @change="setParam('thickness', num($event))" /></label>
          <label class="fld">K 因子
            <input class="inp inp-num" type="number" step="0.01" min="0" max="1" :value="p.kFactor"
              @change="setParam('kFactor', num($event))" /></label>
          <label class="fld">板宽 mm
            <input class="inp inp-num" type="number" step="1" min="1" :value="p.width"
              @change="setParam('width', num($event))" /></label>
          <label class="fld">角度限位 °
            <span class="flex gap-1">
              <input class="inp inp-num" type="number" :value="p.angleMin" @change="setParam('angleMin', num($event))" />
              <input class="inp inp-num" type="number" :value="p.angleMax" @change="setParam('angleMax', num($event))" />
            </span></label>
        </div>
      </div>

      <div class="card p-4 flex flex-col gap-2">
        <div class="sec-title">直段与折线</div>
        <template v-for="(seg, i) in p.segments" :key="seg.id">
          <div class="seg-row">
            <span class="lbl">边{{ i + 1 }}</span>
            <input class="inp inp-num" type="number" step="0.5" min="0.1" :value="seg.length"
              @change="setSeg(i, num($event))" />
            <span class="lbl">mm</span>
            <button class="btn btn-sm ml-auto" title="在此边中间加一条折线" @click="addBendAfter(i)">
              <Icon name="plus" :size="13" />加折
            </button>
          </div>
          <div v-if="p.bends[i]" class="bend-card">
            <div class="flex items-center gap-2">
              <span class="badge badge-info">弯{{ i + 1 }} · 顺序 {{ p.bends[i].order }}</span>
              <span v-if="bendOutOfLimit(p.bends[i])" class="badge badge-warn">超限位</span>
              <button class="btn btn-sm ml-auto" title="翻转折弯方向" @click="flipBend(i)">
                <Icon name="flip" :size="13" />{{ p.bends[i].dir === 1 ? '上折' : '下折' }}
              </button>
              <button class="btn btn-sm btn-danger" title="删除折线并合并直段" @click="removeBend(i)">
                <Icon name="trash" :size="13" />
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <label class="fld">角度 °
                <input class="inp inp-num" type="number" step="1" min="1" max="179" :value="p.bends[i].angle"
                  @change="setBend(i, 'angle', num($event))" /></label>
              <label class="fld">内半径
                <input class="inp inp-num" type="number" step="0.5" min="0" :value="p.bends[i].radius"
                  @change="setBend(i, 'radius', num($event))" /></label>
              <label class="fld">顺序
                <input class="inp inp-num" type="number" step="1" min="1" :value="p.bends[i].order"
                  @change="setBend(i, 'order', num($event))" /></label>
            </div>
          </div>
        </template>
      </div>

      <div class="card p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="sec-title">孔槽(展开坐标)</span>
          <span class="flex gap-2">
            <button class="btn btn-sm" @click="addHole('circle')"><Icon name="plus" :size="13" />圆孔</button>
            <button class="btn btn-sm" @click="addHole('slot')"><Icon name="plus" :size="13" />槽孔</button>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-1 lbl cursor-pointer">
            <input type="checkbox" v-model="store.snapOn" />吸附
          </label>
          <select class="inp" v-model.number="store.snapGrid" :disabled="!store.snapOn">
            <option :value="0.1">0.1mm</option>
            <option :value="0.5">0.5mm</option>
            <option :value="1">1mm</option>
            <option :value="5">5mm</option>
          </select>
          <span class="lbl">网格 / 中线 / 折弯边缘</span>
        </div>
        <div v-for="h in p.holes" :key="h.id" class="hole-row">
          <span class="lbl w-8">{{ h.type === 'circle' ? '圆' : '槽' }}</span>
          <label class="fld-s">X<input class="inp inp-num sm" type="number" step="0.5" :value="h.x" @change="setHole(h.id, 'x', num($event))" /></label>
          <label class="fld-s">Y<input class="inp inp-num sm" type="number" step="0.5" :value="h.y" @change="setHole(h.id, 'y', num($event))" /></label>
          <label v-if="h.type === 'circle'" class="fld-s">⌀<input class="inp inp-num sm" type="number" step="0.5" min="0.1" :value="h.d" @change="setHole(h.id, 'd', num($event))" /></label>
          <template v-else>
            <label class="fld-s">长<input class="inp inp-num sm" type="number" step="0.5" min="0.1" :value="h.len" @change="setHole(h.id, 'len', num($event))" /></label>
            <label class="fld-s">宽<input class="inp inp-num sm" type="number" step="0.5" min="0.1" :value="h.wid" @change="setHole(h.id, 'wid', num($event))" /></label>
          </template>
          <span v-if="holeInfo.get(h.id)?.crossBend" class="badge badge-warn">跨弯</span>
          <span v-if="holeInfo.get(h.id)?.outOfBounds" class="badge badge-danger">出界</span>
          <span v-if="holeInfo.get(h.id)?.overlaps.length" class="badge badge-danger">重叠</span>
          <button class="btn btn-sm btn-danger ml-auto" @click="removeHole(h.id)"><Icon name="trash" :size="13" /></button>
        </div>
        <div v-if="!p.holes.length" class="lbl">暂无孔槽, 点击右上角添加</div>
      </div>

      <div class="card p-4 flex flex-col gap-2">
        <div class="sec-title">校验</div>
        <div class="flex items-center gap-2">
          <span class="badge" :class="ana.closed ? 'badge-ok' : 'badge-danger'">{{ ana.closed ? '轮廓闭合' : '轮廓异常' }}</span>
          <span v-if="ana.interferences.length" class="badge badge-danger">{{ ana.interferences.length }} 处干涉</span>
          <span v-if="!ana.interferences.length && ana.closed" class="lbl">无干涉</span>
        </div>
        <div v-for="(it, i) in ana.interferences.slice(0, 5)" :key="i" class="intf">{{ it.text }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--sp-4);
  align-items: start;
}
.viewer {
  overflow: hidden;
  position: sticky;
  top: 68px;
}
.canvas {
  height: calc(100vh - 170px);
  min-height: 420px;
}
.tab {
  height: 28px;
  padding: 0 var(--sp-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--c-sub);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition: all var(--t-fast);
}
.tab:hover {
  color: var(--c-text);
}
.tab.on {
  background: var(--c-accent-soft);
  color: var(--c-accent);
}
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  min-width: 0;
}
.fld {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  font-size: var(--fs-xs);
  color: var(--c-sub);
}
.fld-s {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: var(--fs-xs);
  color: var(--c-sub);
}
.seg-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.bend-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: var(--sp-1) 0 var(--sp-2) var(--sp-4);
  padding: var(--sp-3);
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
}
.hole-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
  padding: var(--sp-1) 0;
  border-bottom: 1px dashed var(--c-border);
}
.inp-num.sm {
  width: 58px;
  height: 26px;
}
.intf {
  font-size: var(--fs-xs);
  color: var(--c-danger);
  background: var(--c-danger-soft);
  border-radius: var(--radius-sm);
  padding: var(--sp-1) var(--sp-2);
}
@media (max-width: 1100px) {
  .editor-page {
    grid-template-columns: 1fr;
  }
  .viewer {
    position: static;
  }
}
</style>
