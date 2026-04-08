import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import ElementPlus from 'element-plus'

describe('App 组件', () => {
  let wrapper, pinia, router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Dashboard', component: { template: '<div class="dashboard">Dashboard</div>' } },
        { path: '/videos', name: 'VideoLibrary', component: { template: '<div class="video-lib">Videos</div>' } },
        { path: '/analysis/:id', name: 'VideoAnalysis', component: { template: '<div class="analysis">Analysis</div>' } },
        { path: '/settings', name: 'Settings', component: { template: '<div class="settings">Settings</div>' } }
      ]
    })
    
    await router.push('/')
    await router.isReady()

    wrapper = mount(App, {
      global: {
        plugins: [pinia, router, ElementPlus],
        stubs: {
          AIBot: {
            template: '<div class="ai-bot-stub"></div>'
          }
        }
      }
    })
  })

  describe('基础渲染', () => {
    it('应渲染应用容器', () => {
      expect(wrapper.find('.app-container').exists()).toBe(true)
    })

    it('应渲染 AIBot 组件', () => {
      expect(wrapper.find('.ai-bot-stub').exists()).toBe(true)
    })

    it('应渲染 router-view', () => {
      expect(wrapper.find('.dashboard').exists()).toBe(true)
    })
  })

  describe('路由切换', () => {
    it('切换到视频库页面', async () => {
      await router.push('/videos')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.video-lib').exists()).toBe(true)
    })

    it('切换到视频分析页面', async () => {
      await router.push('/analysis/v001')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.analysis').exists()).toBe(true)
    })

    it('切换到设置页面', async () => {
      await router.push('/settings')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.settings').exists()).toBe(true)
    })
  })

  describe('布局结构', () => {
    it('应用容器应占满全屏', () => {
      const container = wrapper.find('.app-container')
      expect(container.exists()).toBe(true)
    })

    it('AIBot 应始终存在于所有页面', async () => {
      // 检查首页
      expect(wrapper.find('.ai-bot-stub').exists()).toBe(true)
      
      // 切换页面后仍存在
      await router.push('/videos')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.ai-bot-stub').exists()).toBe(true)
      
      await router.push('/settings')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.ai-bot-stub').exists()).toBe(true)
    })
  })
})
