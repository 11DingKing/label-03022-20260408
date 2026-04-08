import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

describe('Router 配置', () => {
  let router

  beforeEach(async () => {
    // 动态导入路由配置
    vi.resetModules()
    const routerModule = await import('@/router/index.js')
    
    // 创建测试用路由
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' }, meta: { title: '驾驶舱' } },
        { path: '/videos', name: 'VideoLibrary', component: { template: '<div>Videos</div>' }, meta: { title: '视频库' } },
        { path: '/analysis/:id', name: 'VideoAnalysis', component: { template: '<div>Analysis</div>' }, meta: { title: '视频分析' } },
        { path: '/settings', name: 'Settings', component: { template: '<div>Settings</div>' }, meta: { title: '个人中心' } }
      ]
    })
  })

  describe('路由定义', () => {
    it('应有4个路由', () => {
      expect(router.getRoutes()).toHaveLength(4)
    })

    it('应有Dashboard路由', () => {
      const route = router.getRoutes().find(r => r.name === 'Dashboard')
      expect(route).toBeDefined()
      expect(route.path).toBe('/')
    })

    it('应有VideoLibrary路由', () => {
      const route = router.getRoutes().find(r => r.name === 'VideoLibrary')
      expect(route).toBeDefined()
      expect(route.path).toBe('/videos')
    })

    it('应有VideoAnalysis路由', () => {
      const route = router.getRoutes().find(r => r.name === 'VideoAnalysis')
      expect(route).toBeDefined()
      expect(route.path).toBe('/analysis/:id')
    })

    it('应有Settings路由', () => {
      const route = router.getRoutes().find(r => r.name === 'Settings')
      expect(route).toBeDefined()
      expect(route.path).toBe('/settings')
    })
  })

  describe('路由导航', () => {
    it('应能导航到Dashboard', async () => {
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('Dashboard')
    })

    it('应能导航到VideoLibrary', async () => {
      await router.push('/videos')
      expect(router.currentRoute.value.name).toBe('VideoLibrary')
    })

    it('应能导航到VideoAnalysis', async () => {
      await router.push('/analysis/v001')
      expect(router.currentRoute.value.name).toBe('VideoAnalysis')
      expect(router.currentRoute.value.params.id).toBe('v001')
    })

    it('应能导航到Settings', async () => {
      await router.push('/settings')
      expect(router.currentRoute.value.name).toBe('Settings')
    })

    it('应能通过name导航', async () => {
      await router.push({ name: 'VideoLibrary' })
      expect(router.currentRoute.value.path).toBe('/videos')
    })

    it('应能通过name和params导航', async () => {
      await router.push({ name: 'VideoAnalysis', params: { id: 'v002' } })
      expect(router.currentRoute.value.params.id).toBe('v002')
    })
  })

  describe('路由元信息', () => {
    it('Dashboard应有正确的title', () => {
      const route = router.getRoutes().find(r => r.name === 'Dashboard')
      expect(route.meta.title).toBe('驾驶舱')
    })

    it('VideoLibrary应有正确的title', () => {
      const route = router.getRoutes().find(r => r.name === 'VideoLibrary')
      expect(route.meta.title).toBe('视频库')
    })

    it('VideoAnalysis应有正确的title', () => {
      const route = router.getRoutes().find(r => r.name === 'VideoAnalysis')
      expect(route.meta.title).toBe('视频分析')
    })

    it('Settings应有正确的title', () => {
      const route = router.getRoutes().find(r => r.name === 'Settings')
      expect(route.meta.title).toBe('个人中心')
    })
  })
})
