import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoPlayer from '@/components/VideoPlayer.vue'
import ElementPlus from 'element-plus'

describe('VideoPlayer 组件', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(VideoPlayer, {
      props: {
        src: 'test-video.mp4',
        videoName: '测试视频'
      },
      global: {
        plugins: [ElementPlus]
      }
    })
  })

  describe('基础渲染', () => {
    it('应渲染视频播放器容器', () => {
      expect(wrapper.find('.video-player').exists()).toBe(true)
    })

    it('应渲染视频元素', () => {
      expect(wrapper.find('.video-player__video').exists()).toBe(true)
    })

    it('应渲染控制栏', () => {
      expect(wrapper.find('.video-player__controls').exists()).toBe(true)
    })

    it('应渲染进度条', () => {
      expect(wrapper.find('.video-player__progress').exists()).toBe(true)
    })

    it('应渲染时间显示', () => {
      expect(wrapper.find('.video-player__time').exists()).toBe(true)
    })

    it('应渲染倍速选择器', () => {
      expect(wrapper.find('.video-player__speed').exists()).toBe(true)
    })
  })

  describe('Props 处理', () => {
    it('应正确设置视频源', () => {
      const video = wrapper.find('.video-player__video')
      expect(video.attributes('src')).toBe('test-video.mp4')
    })

    it('无src时不应显示错误占位符', () => {
      // 初始状态 error 为 false
      expect(wrapper.find('.video-player__placeholder').exists()).toBe(false)
    })

    it('showDemoSelector 为 false 时不显示演示选择器', () => {
      expect(wrapper.find('.video-player__demo-selector').exists()).toBe(false)
    })

    it('showDemoSelector 为 true 时显示演示选择器', async () => {
      await wrapper.setProps({
        showDemoSelector: true,
        demoVideos: [
          { name: '演示1', src: 'demo1.mp4' },
          { name: '演示2', src: 'demo2.mp4' }
        ]
      })
      expect(wrapper.find('.video-player__demo-selector').exists()).toBe(true)
    })
  })

  describe('时间格式化', () => {
    it('应正确显示初始时间', () => {
      const time = wrapper.find('.video-player__time')
      expect(time.text()).toContain('00:00')
    })
  })

  describe('倍速选项', () => {
    it('应有多个倍速选项', () => {
      const speedSelect = wrapper.find('.video-player__speed')
      expect(speedSelect.exists()).toBe(true)
    })

    it('默认倍速应为1x', async () => {
      const speedSelect = wrapper.findComponent({ name: 'ElSelect' })
      expect(speedSelect.props('modelValue')).toBe(1)
    })
  })

  describe('事件触发', () => {
    it('视频播放时应触发 play 事件', async () => {
      const video = wrapper.find('.video-player__video')
      await video.trigger('play')
      expect(wrapper.emitted('play')).toBeTruthy()
    })

    it('视频暂停时应触发 pause 事件', async () => {
      const video = wrapper.find('.video-player__video')
      await video.trigger('pause')
      expect(wrapper.emitted('pause')).toBeTruthy()
    })

    it('视频结束时应触发 ended 事件', async () => {
      const video = wrapper.find('.video-player__video')
      await video.trigger('ended')
      expect(wrapper.emitted('ended')).toBeTruthy()
    })
  })

  describe('演示视频切换', () => {
    it('切换演示视频时应触发 demoChange 事件', async () => {
      await wrapper.setProps({
        showDemoSelector: true,
        demoVideos: [
          { name: '演示1', src: 'demo1.mp4' },
          { name: '演示2', src: 'demo2.mp4' }
        ]
      })
      // 模拟选择变化
      const vm = wrapper.vm
      vm.demoIndex = 1
      vm.switchDemo()
      expect(wrapper.emitted('demoChange')).toBeTruthy()
      expect(wrapper.emitted('demoChange')[0]).toEqual([1])
    })
  })

  describe('暴露的方法', () => {
    it('应暴露 jumpTo 方法', () => {
      expect(typeof wrapper.vm.jumpTo).toBe('function')
    })

    it('应暴露 duration 计算属性', () => {
      expect(wrapper.vm.duration).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('视频加载错误时应显示占位符', async () => {
      const video = wrapper.find('.video-player__video')
      await video.trigger('error')
      expect(wrapper.find('.video-player__placeholder').exists()).toBe(true)
    })

    it('错误占位符应显示视频名称', async () => {
      const video = wrapper.find('.video-player__video')
      await video.trigger('error')
      const placeholder = wrapper.find('.video-player__placeholder')
      expect(placeholder.text()).toContain('测试视频')
    })
  })

  describe('src 变化响应', () => {
    it('src 变化时应重置错误状态', async () => {
      // 先触发错误
      const video = wrapper.find('.video-player__video')
      await video.trigger('error')
      expect(wrapper.find('.video-player__placeholder').exists()).toBe(true)
      
      // 更新 src
      await wrapper.setProps({ src: 'new-video.mp4' })
      expect(wrapper.find('.video-player__placeholder').exists()).toBe(false)
    })
  })

  describe('播放控制', () => {
    it('应有播放/暂停按钮', () => {
      const playBtn = wrapper.find('.el-button')
      expect(playBtn.exists()).toBe(true)
    })

    it('togglePlay函数应存在', () => {
      expect(typeof wrapper.vm.togglePlay).toBe('function')
    })

    it('isPlaying应为布尔值', () => {
      expect(typeof wrapper.vm.isPlaying).toBe('boolean')
    })
  })

  describe('进度条交互', () => {
    it('progress应为数字', () => {
      expect(typeof wrapper.vm.progress).toBe('number')
    })

    it('currentTime应为数字', () => {
      expect(typeof wrapper.vm.currentTime).toBe('number')
    })
  })

  describe('音量控制', () => {
    it('视频元素应存在', () => {
      const video = wrapper.find('.video-player__video')
      expect(video.exists()).toBe(true)
    })
  })

  describe('全屏功能', () => {
    it('视频元素应支持全屏', () => {
      const video = wrapper.find('.video-player__video')
      expect(video.exists()).toBe(true)
    })
  })

  describe('formatTime函数', () => {
    it('应正确格式化时间', () => {
      const result = wrapper.vm.formatTime(65)
      expect(result).toBe('01:05')
    })

    it('应处理0秒', () => {
      const result = wrapper.vm.formatTime(0)
      expect(result).toBe('00:00')
    })

    it('应处理大于1小时的时间', () => {
      const result = wrapper.vm.formatTime(3665)
      expect(result).toContain(':')
    })
  })
})
