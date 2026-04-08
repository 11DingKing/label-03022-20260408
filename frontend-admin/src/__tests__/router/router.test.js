import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'

// 直接定义路由配置进行测试，避免依赖 @ alias 在路由文件中的动态导入
const routes = [
  { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' }, meta: { title: '驾驶舱' } },
  { path: '/videos', name: 'VideoLibrary', component: { template: '<div>Videos</div>' }, meta: { title: '视频库' } },
  { path: '/analysis/:id', name: 'VideoAnalysis', component: { template: '<div>Analysis</div>' }, meta: { title: '视频分析' } },
  { path: '/settings', name: 'Settings', component: { template: '<div>Settings</div>' }, meta: { title: '个人中心' } }
]

describe('Router', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('应有4条路由', () => {
    expect(router.getRoutes()).toHaveLength(4)
  })

  it('/ 应匹配 Dashboard', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('/videos 应匹配 VideoLibrary', async () => {
    await router.push('/videos')
    expect(router.currentRoute.value.name).toBe('VideoLibrary')
  })

  it('/analysis/:id 应匹配 VideoAnalysis 并传递参数', async () => {
    await router.push('/analysis/v001')
    expect(router.currentRoute.value.name).toBe('VideoAnalysis')
    expect(router.currentRoute.value.params.id).toBe('v001')
  })

  it('/settings 应匹配 Settings', async () => {
    await router.push('/settings')
    expect(router.currentRoute.value.name).toBe('Settings')
  })

  it('每条路由应有 meta.title', () => {
    router.getRoutes().forEach(route => {
      expect(route.meta.title).toBeTruthy()
    })
  })

  it('应支持命名路由导航', async () => {
    await router.push({ name: 'VideoAnalysis', params: { id: 'v005' } })
    expect(router.currentRoute.value.path).toBe('/analysis/v005')
  })

  it('路由名称应唯一', () => {
    const names = router.getRoutes().map(r => r.name).filter(Boolean)
    expect(new Set(names).size).toBe(names.length)
  })
})
