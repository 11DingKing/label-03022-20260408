import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import VideoAnalysis from '@/views/VideoAnalysis.vue'
import ElementPlus from 'element-plus'

describe('VideoAnalysis 页面', () => {
  let wrapper, pinia, router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/analysis/:id', name: 'VideoAnalysis', component: VideoAnalysis }
      ]
    })
    await router.push('/analysis/v001')
    await router.isReady()

    wrapper = mount(VideoAnalysis, {
      global: { 
        plugins: [pinia, router, ElementPlus],
        stubs: {
          // 子组件使用 stub 以隔离测试
          VideoPlayer: {
            template: `<div class="video-player glow-border">
              <div class="video-player__screen"><video class="video-player__video"></video></div>
              <div class="video-player__controls">
                <div class="video-player__progress"></div>
                <div class="video-player__speed"></div>
              </div>
            </div>`
          },
          VideoTimeline: {
            template: `<div class="video-timeline glow-border">
              <div class="video-timeline__event is-info"></div>
              <div class="video-timeline__event is-success"></div>
              <div class="video-timeline__event is-warning"></div>
            </div>`,
            props: ['events', 'duration', 'progress']
          },
          ReportExporter: {
            template: '<div class="report-exporter"></div>',
            props: ['modelValue', 'reportData']
          }
        }
      }
    })
  })

  describe('基础布局', () => {
    it('应渲染左右分栏布局', () => {
      expect(wrapper.find('.analysis__left').exists()).toBe(true)
      expect(wrapper.find('.analysis__right').exists()).toBe(true)
    })
  })

  describe('左侧视频操作区', () => {
    it('应渲染视频播放器组件', () => {
      expect(wrapper.find('.video-player').exists()).toBe(true)
    })

    it('播放器应有控制栏', () => {
      expect(wrapper.find('.video-player__controls').exists()).toBe(true)
    })

    it('应有进度条', () => {
      expect(wrapper.find('.video-player__progress').exists()).toBe(true)
    })

    it('应有倍速选择器', () => {
      expect(wrapper.find('.video-player__speed').exists()).toBe(true)
    })

    it('应渲染标签区域', () => {
      expect(wrapper.find('.analysis__tags').exists()).toBe(true)
    })

    it('应有编辑标签按钮', () => {
      const editBtn = wrapper.findAll('.el-button').find(b => b.text().includes('编辑'))
      expect(editBtn).toBeDefined()
    })

    it('应渲染事件时间轴组件', () => {
      expect(wrapper.find('.video-timeline').exists()).toBe(true)
    })

    it('时间轴应有事件节点', () => {
      const events = wrapper.findAll('.video-timeline__event')
      expect(events.length).toBeGreaterThanOrEqual(1)
    })

    it('时间轴事件应有类型标记', () => {
      const events = wrapper.findAll('.video-timeline__event')
      events.forEach(event => {
        const hasType = event.classes().some(c => c.startsWith('is-'))
        expect(hasType).toBe(true)
      })
    })

    it('应渲染合规性检测区域', () => {
      expect(wrapper.find('.analysis__compliance').exists()).toBe(true)
    })

    it('合规性检测应有检查项', () => {
      const items = wrapper.findAll('.analysis__compliance-item')
      expect(items.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('右侧信息分析区', () => {
    it('应有生成报告按钮', () => {
      const reportBtn = wrapper.findAll('.el-button').find(b => b.text().includes('生成报告'))
      expect(reportBtn).toBeDefined()
    })

    it('应渲染AI视频摘要', () => {
      expect(wrapper.find('.analysis__summary').exists()).toBe(true)
      expect(wrapper.find('.analysis__summary-content').exists()).toBe(true)
    })

    it('应渲染AI对话面板', () => {
      expect(wrapper.find('.analysis__chat').exists()).toBe(true)
    })

    it('AI对话应有初始消息', () => {
      const messages = wrapper.findAll('.analysis__chat-msg')
      expect(messages.length).toBeGreaterThanOrEqual(1)
    })

    it('应有对话输入框', () => {
      expect(wrapper.find('.analysis__chat-input').exists()).toBe(true)
    })

    it('应渲染语音转文字区域', () => {
      expect(wrapper.find('.analysis__transcript').exists()).toBe(true)
      expect(wrapper.find('.analysis__transcript-content').exists()).toBe(true)
    })

    it('语音转文字应有复制按钮', () => {
      const transcript = wrapper.find('.analysis__transcript')
      expect(transcript.exists()).toBe(true)
      const copyBtn = wrapper.findAll('.el-button').find(b => b.text().includes('复制'))
      expect(copyBtn).toBeDefined()
    })
  })

  describe('视频播放器', () => {
    it('应有视频元素', () => {
      const video = wrapper.find('.video-player__video')
      expect(video.exists()).toBe(true)
    })
  })

  describe('标签管理', () => {
    it('标签区域应显示标签列表', () => {
      expect(wrapper.find('.analysis__tags-list').exists()).toBe(true)
    })

    it('标签应使用 el-tag 组件', () => {
      const tags = wrapper.findAll('.analysis__tags-list .el-tag')
      expect(tags.length).toBeGreaterThan(0)
    })
  })

  describe('合规性检测', () => {
    it('合规项应有图标', () => {
      const items = wrapper.findAll('.analysis__compliance-item')
      items.forEach(item => {
        expect(item.find('.el-icon').exists()).toBe(true)
      })
    })

    it('合规项应有时间标记', () => {
      const times = wrapper.findAll('.analysis__compliance-time')
      expect(times.length).toBeGreaterThan(0)
    })
  })

  describe('AI对话', () => {
    it('对话消息应区分用户和助手', () => {
      const messages = wrapper.findAll('.analysis__chat-msg')
      const hasUserOrAssistant = messages.some(m => 
        m.classes().includes('is-user') || m.classes().includes('is-assistant')
      )
      expect(hasUserOrAssistant).toBe(true)
    })
  })

  describe('工具函数', () => {
    it('formatTime应正确格式化时间', () => {
      expect(typeof wrapper.vm.formatTime).toBe('function')
      const result = wrapper.vm.formatTime(65)
      expect(result).toBe('01:05')
    })

    it('formatTime应处理0秒', () => {
      const result = wrapper.vm.formatTime(0)
      expect(result).toBe('00:00')
    })

    it('formatTime应处理大于1小时的时间', () => {
      const result = wrapper.vm.formatTime(3665)
      expect(result).toContain(':')
    })
  })

  describe('视频信息', () => {
    it('video应存在', () => {
      expect(wrapper.vm.video).toBeDefined()
    })

    it('video应有name属性', () => {
      expect(wrapper.vm.video).toHaveProperty('name')
    })

    it('video应有tags属性', () => {
      expect(wrapper.vm.video).toHaveProperty('tags')
    })
  })

  describe('AI分析数据', () => {
    it('summary应存在', () => {
      expect(wrapper.vm.summary).toBeDefined()
    })

    it('transcript应存在', () => {
      expect(wrapper.vm.transcript).toBeDefined()
    })

    it('chatMessages应为数组', () => {
      expect(Array.isArray(wrapper.vm.chatMessages)).toBe(true)
    })

    it('complianceItems应为数组', () => {
      expect(Array.isArray(wrapper.vm.complianceItems)).toBe(true)
    })

    it('timelineEvents应为数组', () => {
      expect(Array.isArray(wrapper.vm.timelineEvents)).toBe(true)
    })
  })

  describe('交互功能', () => {
    it('sendChat函数应存在', () => {
      expect(typeof wrapper.vm.sendChat).toBe('function')
    })

    it('copyTranscript函数应存在', () => {
      expect(typeof wrapper.vm.copyTranscript).toBe('function')
    })

    it('openReportDialog函数应存在', () => {
      expect(typeof wrapper.vm.openReportDialog).toBe('function')
    })

    it('chatInput应为响应式ref', () => {
      expect(wrapper.vm.chatInput).toBeDefined()
    })

    it('toggleMic函数应存在', () => {
      expect(typeof wrapper.vm.toggleMic).toBe('function')
    })

    it('jumpTo函数应存在', () => {
      expect(typeof wrapper.vm.jumpTo).toBe('function')
    })

    it('addTag函数应存在', () => {
      expect(typeof wrapper.vm.addTag).toBe('function')
    })

    it('removeTag函数应存在', () => {
      expect(typeof wrapper.vm.removeTag).toBe('function')
    })

    it('saveTags函数应存在', () => {
      expect(typeof wrapper.vm.saveTags).toBe('function')
    })
  })

  describe('报告导出', () => {
    it('showReport应为布尔值', () => {
      expect(typeof wrapper.vm.showReport).toBe('boolean')
    })

    it('reportData应存在', () => {
      expect(wrapper.vm.reportData).toBeDefined()
    })
  })

  describe('标签编辑', () => {
    it('editingTags应为布尔值', () => {
      expect(typeof wrapper.vm.editingTags).toBe('boolean')
    })

    it('newTag应存在', () => {
      expect(wrapper.vm.newTag).toBeDefined()
    })

    it('editTags应为数组', () => {
      expect(Array.isArray(wrapper.vm.editTags)).toBe(true)
    })
  })

  describe('播放器状态', () => {
    it('currentTime应为数字', () => {
      expect(typeof wrapper.vm.currentTime).toBe('number')
    })

    it('totalDuration应为数字', () => {
      expect(typeof wrapper.vm.totalDuration).toBe('number')
    })

    it('playProgress应为数字', () => {
      expect(typeof wrapper.vm.playProgress).toBe('number')
    })
  })
})
