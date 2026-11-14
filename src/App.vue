<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

import { store, undo, redo } from './store'
import Icon from './components/Icon.vue'

const onKey = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    redo()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <header class="topbar">
    <div class="flex items-center gap-2">
      <span class="logo">
        <Icon name="cube" :size="18" />
      </span>
      <span class="app-name">折弯放样台</span>
      <span class="proj-name">{{ store.project.name }}</span>
    </div>
    <nav class="flex items-center gap-1">
      <router-link class="nav-link" to="/library">工程库</router-link>
      <router-link class="nav-link" to="/editor">折弯编辑</router-link>
      <router-link class="nav-link" to="/unfold">展开核算</router-link>
      <router-link class="nav-link" to="/export">出件</router-link>
    </nav>
    <div class="flex items-center gap-2">
      <button class="btn btn-sm" :disabled="!store.past.length" title="撤销 (Ctrl+Z)" @click="undo">
        <Icon name="undo" :size="14" />撤销
      </button>
      <button class="btn btn-sm" :disabled="!store.future.length" title="重做 (Ctrl+Y)" @click="redo">
        <Icon name="redo" :size="14" />重做
      </button>
    </div>
  </header>
  <main class="main">
    <router-view />
  </main>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  height: 52px;
  padding: 0 var(--sp-4);
  background: var(--c-panel);
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius);
  background: var(--c-accent);
  color: #fff;
}
.app-name {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
}
.proj-name {
  font-size: var(--fs-xs);
  color: var(--c-sub);
  padding-left: var(--sp-3);
  border-left: 1px solid var(--c-border);
}
.main {
  flex: 1;
  padding: var(--sp-4);
  max-width: 1560px;
  width: 100%;
  margin: 0 auto;
}
</style>
