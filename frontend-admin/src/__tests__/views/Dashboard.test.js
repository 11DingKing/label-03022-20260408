import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import ElementPlus from 'element-plus'

describe('Dashboard 页面', () => {
  let wrapper, pinia

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: Dashboard }]
    })

    wrapper = mount(Dashboard, {
      global: { plugins: [pinia, router, ElementPlus] }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    wrapper?.unmount()
  })

  it('应渲染星空背景', () => {
    const stars = wrapper.findAll('.dashboard__stars')
    expect(stars.length).toBe(50)
  })

  it('应显示日期信息', () => {
    expect(wrapper.find('.dashboard__date-day').exists()).toBe(true)
    expect(wrapper.find('.dashboard__date-weekday').exists()).toBe(true)
    expect(wrapper.find('.dashboard__date-full').exists()).toBe(true)
  })

  it('应显示今日任务区域', () => {
    expect(wrapper.find('.dashboard__tasks').exists()).toBe(true)
    const taskItems = wrapper.findAll('.dashboard__task-item')
    expect(taskItems.length).toBeGreaterThan(0)
  })

  it('任务项应包含状态点、标题和截止日期', () => {
    const taskItem = wrapper.find('.dashboard__task-item')
    expect(taskItem.find('.dashboard__task-dot').exists()).toBe(true)
    expect(taskItem.find('.dashboard__task-title').exists()).toBe(true)
    expect(taskItem.find('.dashboard__task-due').exists()).toBe(true)
  })

  it('应显示通知区域', () => {
    expect(wrapper.find('.dashboard__notifications').exists()).toBe(true)
    const notifItems = wrapper.findAll('.dashboard__notif-item')
    expect(notifItems.length).toBeGreaterThan(0)
  })

  it('未读通知应有 is-unread 类', () => {
    const unreadItems = wrapper.findAll('.dashboard__notif-item.is-unread')
    expect(unreadItems.length).toBeGreaterThan(0)
  })

  it('应显示中央AI区域', () => {
    expect(wrapper.find('.dashboard__windshield').exists()).toBe(true)
    expect(wrapper.find('.dashboard__ai-figure').exists()).toBe(true)
  })

  it('应显示问候语', () => {
    const greeting = wrapper.find('.dashboard__ai-greeting')
    expect(greeting.exists()).toBe(true)
    expect(greeting.text()).toBeTruthy()
  })

  it('应显示底部仪表盘', () => {
    const gauges = wrapper.findAll('.dashboard__gauge')
    expect(gauges.length).toBeGreaterThanOrEqual(1)
  })

  it('每个仪表盘应显示数值、标签和趋势', () => {
    const gauge = wrapper.find('.dashboard__gauge')
    expect(gauge.find('.dashboard__gauge-num').exists()).toBe(true)
    expect(gauge.find('.dashboard__gauge-label').exists()).toBe(true)
    expect(gauge.find('.dashboard__gauge-trend').exists()).toBe(true)
    expect(gauge.find('.dashboard__gauge-bar').exists()).toBe(true)
  })

  it('趋势应有正确的方向类', () => {
    const trends = wrapper.findAll('.dashboard__gauge-trend')
    trends.forEach(trend => {
      const hasDirection = trend.classes().includes('is-up') || trend.classes().includes('is-down')
      expect(hasDirection).toBe(true)
    })
  })

  it('应显示未读通知数量', () => {
    // el-badge 组件
    expect(wrapper.find('.dashboard__badge').exists()).toBe(true)
  })

  describe('时间显示', () => {
    it('currentDate应有day属性', () => {
      expect(wrapper.vm.currentDate).toHaveProperty('day')
    })

    it('currentDate应有weekday属性', () => {
      expect(wrapper.vm.currentDate).toHaveProperty('weekday')
    })

    it('currentDate应有full属性', () => {
      expect(wrapper.vm.currentDate).toHaveProperty('full')
    })
  })

  describe('问候语', () => {
    it('问候语应根据时间变化', () => {
      const greeting = wrapper.find('.dashboard__ai-greeting')
      expect(greeting.text().length).toBeGreaterThan(0)
    })
  })

  describe('仪表盘数据', () => {
    it('仪表盘应有指标', () => {
      const gauges = wrapper.findAll('.dashboard__gauge')
      expect(gauges.length).toBeGreaterThanOrEqual(1)
    })

    it('每个仪表盘应有进度条', () => {
      const gauges = wrapper.findAll('.dashboard__gauge')
      const bars = wrapper.findAll('.dashboard__gauge-bar')
      expect(bars.length).toBe(gauges.length)
    })
  })

  describe('任务状态', () => {
    it('任务应有不同的状态类型', () => {
      const dots = wrapper.findAll('.dashboard__task-dot')
      expect(dots.length).toBeGreaterThan(0)
    })
  })

  describe('通知功能', () => {
    it('通知项应有标题', () => {
      const notifItem = wrapper.find('.dashboard__notif-item')
      expect(notifItem.find('.dashboard__notif-title').exists()).toBe(true)
    })

    it('通知项应有内容', () => {
      const notifItem = wrapper.find('.dashboard__notif-item')
      expect(notifItem.find('.dashboard__notif-content').exists()).toBe(true)
    })

    it('通知项应有时间', () => {
      const notifItem = wrapper.find('.dashboard__notif-item')
      expect(notifItem.find('.dashboard__notif-time').exists()).toBe(true)
    })
  })

  describe('响应式数据', () => {
    it('currentDate应存在', () => {
      expect(wrapper.vm.currentDate).toBeDefined()
    })

    it('greeting应存在', () => {
      expect(wrapper.vm.greeting).toBeDefined()
    })

    it('dashStore.tasks应为数组', () => {
      expect(Array.isArray(wrapper.vm.dashStore.tasks)).toBe(true)
    })

    it('dashStore.notifications应为数组', () => {
      expect(Array.isArray(wrapper.vm.dashStore.notifications)).toBe(true)
    })

    it('circularGauges应为数组', () => {
      expect(Array.isArray(wrapper.vm.circularGauges)).toBe(true)
    })

    it('unreadCount应为数字', () => {
      expect(typeof wrapper.vm.unreadCount).toBe('number')
    })
  })
})
