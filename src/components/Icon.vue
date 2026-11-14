<script setup lang="ts">
// 统一线性图标: 线宽 1.6, 圆角端点
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 })

const paths: Record<string, string> = {
  undo: 'M9 14 4 9l5-5M4 9h11a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a6 6 0 0 0 0 12h3',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
  flip: 'M8 7h13M18 4l3 3-3 3M16 17H3M6 14l-3 3 3 3',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M4 20h16',
  upload: 'M12 15V4m0 0L8 8m4-4 4 4M4 20h16',
  save: 'M5 4h11l3 3v13H5V4zM8 4v5h7V4M8 20v-6h8v6',
  copy: 'M9 9h11v11H9V9zM5 15V5h10',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12L4 7.5M12 12v9',
  ruler: 'M3 17 17 3l4 4L7 21l-4-4zM8.5 12.5l2 2M11.5 9.5l2 2M14.5 6.5l2 2',
  reset: 'M4 10a8 8 0 1 1 2 6M4 10V4m0 6h6',
  warn: 'M12 4 2 20h20L12 4zM12 10v5M12 18h.01',
}
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[props.name]" />
  </svg>
</template>
