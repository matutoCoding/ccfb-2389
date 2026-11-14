<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { store, openProject, newProject, removeFromLibrary, duplicateProject } from '../store'
import { createBuiltin } from '../lib/builtin'
import { fmtTime } from '../lib/dayjs'
import Icon from '../components/Icon.vue'

const router = useRouter()

const builtin = computed(() => createBuiltin())

const open = (p: Parameters<typeof openProject>[0]) => {
  openProject(p)
  router.push('/editor')
}

const openBuiltin = () => open(createBuiltin())

const create = () => {
  newProject()
  router.push('/editor')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="page-title">工程库</div>
        <div class="lbl">存档保存在浏览器本地, 打开即可修改板厚与 K 因子</div>
      </div>
      <button class="btn btn-primary" @click="create">
        <Icon name="plus" :size="14" />新建工程
      </button>
    </div>

    <div class="grid-cards">
      <!-- 内置工程 -->
      <div class="card proj-card builtin">
        <div class="flex items-center justify-between">
          <span class="sec-title">{{ builtin.name }}</span>
          <span class="badge badge-info">内置</span>
        </div>
        <div class="lbl">双折弯槽件 · 两弯 90° · 含跨弯孔示例</div>
        <div class="meta">
          <span>板厚 {{ builtin.thickness }}mm</span>
          <span>K {{ builtin.kFactor }}</span>
          <span>板宽 {{ builtin.width }}mm</span>
        </div>
        <div class="flex gap-2 mt-auto">
          <button class="btn btn-primary btn-sm" @click="openBuiltin">
            <Icon name="folder" :size="14" />打开
          </button>
        </div>
      </div>

      <!-- 存档工程 -->
      <div v-for="p in store.library" :key="p.id" class="card proj-card">
        <div class="flex items-center justify-between">
          <span class="sec-title">{{ p.name }}</span>
          <span class="badge badge-ok">存档</span>
        </div>
        <div class="lbl">{{ p.segments.length }} 段 · {{ p.bends.length }} 弯 · {{ p.holes.length }} 孔槽</div>
        <div class="meta">
          <span>板厚 {{ p.thickness }}mm</span>
          <span>K {{ p.kFactor }}</span>
          <span>板宽 {{ p.width }}mm</span>
        </div>
        <div class="lbl">更新于 {{ fmtTime(p.updatedAt) }}</div>
        <div class="flex gap-2 mt-auto">
          <button class="btn btn-primary btn-sm" @click="open(p)">
            <Icon name="folder" :size="14" />打开
          </button>
          <button class="btn btn-sm" @click="duplicateProject(p)">
            <Icon name="copy" :size="14" />复制
          </button>
          <button class="btn btn-sm btn-danger" @click="removeFromLibrary(p.id)">
            <Icon name="trash" :size="14" />删除
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!store.library.length" class="card empty">
        <Icon name="folder" :size="28" />
        <div class="sec-title">还没有存档</div>
        <div class="lbl">在出件页点击「存入工程库」, 工程会保存在浏览器本地</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: var(--fs-xl);
  font-weight: var(--fw-semibold);
}
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--sp-4);
}
.proj-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-4);
}
.proj-card.builtin {
  border-color: var(--c-accent);
}
.meta {
  display: flex;
  gap: var(--sp-3);
  font-size: var(--fs-xs);
  color: var(--c-sub);
  font-variant-numeric: tabular-nums;
}
.empty {
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  color: var(--c-faint);
  text-align: center;
}
</style>
