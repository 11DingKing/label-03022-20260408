import { createRouter, createWebHistory } from 'vue-router'
import { createLogger } from '@/utils/logger'

const log = createLogger('Router')

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '驾驶舱' }
  },
  {
    path: '/videos',
    name: 'VideoLibrary',
    component: () => import('@/views/VideoLibrary.vue'),
    meta: { title: '视频库' }
  },
  {
    path: '/analysis/:id',
    name: 'VideoAnalysis',
    component: () => import('@/views/VideoAnalysis.vue'),
    meta: { title: '视频分析' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '个人中心' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  log.info('路由跳转', { from: from.path, to: to.path, name: to.name })
  document.title = `${to.meta.title || '视频分析AI'} - Video Analysis AI`
  next()
})

export default router
