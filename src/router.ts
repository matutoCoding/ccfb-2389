import { createRouter, createWebHashHistory } from 'vue-router'

import LibraryPage from './pages/LibraryPage.vue'
import EditorPage from './pages/EditorPage.vue'
import UnfoldPage from './pages/UnfoldPage.vue'
import ExportPage from './pages/ExportPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/library' },
    { path: '/library', component: LibraryPage },
    { path: '/editor', component: EditorPage },
    { path: '/unfold', component: UnfoldPage },
    { path: '/export', component: ExportPage },
  ],
})
