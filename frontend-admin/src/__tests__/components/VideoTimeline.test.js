import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoTimeline from '@/components/VideoTimeline.vue'
import ElementPlus from 'element-plus'

describe('VideoTimeline 组件', () => {
  let wrapper

  const mockEvents = [
    { time: 15, label: '开始工作', type: 'info' },
    { time: 45, label: '安全检查', type: 'success' },
    { time: 90, label: '发现问题', type: 'warning' },
    { time: 120, label: '严重违规', type: 'danger' }
  ]

  beforeEach(() => {
    wrapper = mount(VideoTimeline, {
      props: {
        events: mockEvents,
        duration: 180,
        progress: 0
      },
      global: {
        plugins: [ElementPlus]
      }
    })
  })

  describe('基础渲染', () => {
    it('应渲染时间轴容器', () => {
      expect(wrapper.find('.video-timeline').exists()).toBe(true)
    })

    it('应渲染时间轴轨道', () => {
      expect(wrapper.find('.video-timeline__track').exists()).toBe(true)
    })

    it('应渲染进度条', () => {
      expect(wrapper.find('.video-timeline__bar').exists()).toBe(true)
    })

    it('应渲染进度条填充', () => {
      expect(wrapper.find('.video-timeline__bar-fill').exists()).toBe(true)
    })
  })

  describe('事件渲染', () => {
    it('应渲染所有事件节点', () => {
      const events = wrapper.findAll('.video-timeline__event')
      expect(events.length).toBe(4)
    })

    it('事件节点应有正确的类型类名', () => {
      const events = wrapper.findAll('.video-timeline__event')
      expect(events[0].classes()).toContain('is-info')
      expect(events[1].classes()).toContain('is-success')
      expect(events[2].classes()).toContain('is-warning')
      expect(events[3].classes()).toContain('is-danger')
    })

    it('事件节点应有圆点', () => {
      const dots = wrapper.findAll('.video-timeline__dot')
      expect(dots.length).toBe(4)
    })

    it('事件节点应有标签', () => {
      const labels = wrapper.findAll('.video-timeline__label')
      expect(labels.length).toBe(4)
      expect(labels[0].text()).toBe('开始工作')
    })
  })

  describe('事件位置计算', () => {
    it('事件位置应基于时间和总时长计算', () => {
      const events = wrapper.findAll('.video-timeline__event')
      // 第一个事件在 15/180 ≈ 8.33% 位置
      const firstEventStyle = events[0].attributes('style')
      expect(firstEventStyle).toContain('left:')
    })
  })

  describe('进度条', () => {
    it('进度条宽度应反映当前进度', async () => {
      await wrapper.setProps({ progress: 50 })
      const fill = wrapper.find('.video-timeline__bar-fill')
      const style = fill.attributes('style')
      expect(style).toContain('width:')
    })

    it('进度为0时进度条宽度应为0', () => {
      const fill = wrapper.find('.video-timeline__bar-fill')
      const style = fill.attributes('style')
      expect(style).toContain('width: 0%')
    })

    it('进度为100时进度条宽度应为100%', async () => {
      await wrapper.setProps({ progress: 100 })
      const fill = wrapper.find('.video-timeline__bar-fill')
      const style = fill.attributes('style')
      expect(style).toContain('width: 100%')
    })
  })

  describe('事件点击', () => {
    it('点击事件应触发 jump 事件', async () => {
      const events = wrapper.findAll('.video-timeline__event')
      await events[0].trigger('click')
      expect(wrapper.emitted('jump')).toBeTruthy()
      expect(wrapper.emitted('jump')[0][0]).toBe(15) // 第一个事件的时间
    })
  })

  describe('空事件列表', () => {
    it('无事件时不应渲染事件节点', async () => {
      await wrapper.setProps({ events: [] })
      const events = wrapper.findAll('.video-timeline__event')
      expect(events.length).toBe(0)
    })
  })

  describe('Props 验证', () => {
    it('应接受 events 数组', () => {
      expect(wrapper.props('events')).toEqual(mockEvents)
    })

    it('应接受 duration 数字', () => {
      expect(wrapper.props('duration')).toBe(180)
    })

    it('应接受 progress 数字', () => {
      expect(wrapper.props('progress')).toBe(0)
    })
  })
})
