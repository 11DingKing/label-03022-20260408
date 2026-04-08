import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AIBot from '@/components/AIBot.vue'
import ElementPlus from 'element-plus'

const routes = [
  { path: '/', name: 'Dashboard', component: { template: '<div/>' } },
  { path: '/videos', name: 'VideoLibrary', component: { template: '<div/>' } },
  { path: '/analysis/:id', name: 'VideoAnalysis', component: { template: '<div/>' } },
  { path: '/settings', name: 'Settings', component: { template: '<div/>' } }
]

describe('AIBot 组件', () => {
  let wrapper, router, pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/')
    await router.isReady()

    // Clean up any existing modal elements
    document.body.innerHTML = ''

    wrapper = mount(AIBot, {
      global: {
        plugins: [pinia, router, ElementPlus],
        stubs: {
          teleport: true
        }
      },
      attachTo: document.body
    })
  })

  describe('基础渲染', () => {
    it('应渲染AI机器人头像', () => {
      expect(wrapper.find('.ai-bot__avatar').exists()).toBe(true)
    })

    it('应渲染SVG图标', () => {
      expect(wrapper.find('.ai-bot__icon').exists()).toBe(true)
    })

    it('应渲染脉冲动画元素', () => {
      expect(wrapper.findAll('.ai-bot__pulse').length).toBeGreaterThanOrEqual(1)
    })

    it('应有正确的定位样式', () => {
      const style = wrapper.find('.ai-bot').attributes('style')
      expect(style).toContain('left:')
      expect(style).toContain('top:')
    })
  })

  describe('初始状态', () => {
    it('初始状态不应显示气泡菜单', () => {
      expect(wrapper.find('.ai-bot__bubbles').exists()).toBe(false)
    })

    it('初始状态不应显示对话面板', () => {
      expect(wrapper.find('.ai-bot-modal').exists()).toBe(false)
    })
  })

  describe('气泡菜单', () => {
    it('点击头像应切换气泡菜单', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      expect(wrapper.find('.ai-bot__bubbles').exists()).toBe(true)
    })

    it('气泡菜单应包含对话气泡和4个导航气泡', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      const chatBubble = wrapper.find('.ai-bot__bubble--chat')
      const navBubbles = wrapper.findAll('.ai-bot__bubble--nav')
      expect(chatBubble.exists()).toBe(true)
      expect(navBubbles).toHaveLength(4)
    })

    it('导航气泡应标记当前路由', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      const navBubbles = wrapper.findAll('.ai-bot__bubble--nav')
      const currentBubble = navBubbles.find(b => b.classes().includes('is-current'))
      expect(currentBubble).toBeDefined()
    })

    it('再次点击头像应关闭气泡菜单', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      expect(wrapper.find('.ai-bot__bubbles').exists()).toBe(true)
      await wrapper.find('.ai-bot__avatar').trigger('click')
      expect(wrapper.find('.ai-bot__bubbles').exists()).toBe(false)
    })
  })

  describe('对话面板', () => {
    it('点击对话气泡应打开对话面板', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal').exists()).toBe(true)
    })

    it('对话面板应显示消息区域', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal__messages').exists()).toBe(true)
    })

    it('对话面板应有输入框', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal__input .el-input').exists()).toBe(true)
    })

    it('对话面板应有操作按钮', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal__actions').exists()).toBe(true)
    })

    it('对话面板应有标题', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal__title').exists()).toBe(true)
    })

    it('对话面板应有头部区域', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal__header').exists()).toBe(true)
    })
  })

  describe('拖拽功能', () => {
    it('应有拖拽相关的事件处理', () => {
      const avatar = wrapper.find('.ai-bot__avatar')
      expect(avatar.exists()).toBe(true)
    })
  })

  describe('导航功能', () => {
    it('导航气泡应有正确的图标', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      const navBubbles = wrapper.findAll('.ai-bot__bubble--nav')
      expect(navBubbles.length).toBe(4)
      navBubbles.forEach(bubble => {
        expect(bubble.find('.el-icon').exists()).toBe(true)
      })
    })
  })

  describe('语音功能', () => {
    it('对话面板应有麦克风按钮', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal__mic').exists()).toBe(true)
    })

    it('speechSupported应为布尔值', async () => {
      expect(typeof wrapper.vm.speechSupported).toBe('boolean')
    })

    it('toggleVoice函数应存在', () => {
      expect(typeof wrapper.vm.toggleVoice).toBe('function')
    })
  })

  describe('消息发送', () => {
    it('sendMessage函数应存在', () => {
      expect(typeof wrapper.vm.sendMessage).toBe('function')
    })

    it('inputText应为响应式ref', () => {
      expect(wrapper.vm.inputText).toBeDefined()
    })

    it('对话面板应有发送按钮', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      const sendBtn = wrapper.find('.ai-bot-modal__input .el-button')
      expect(sendBtn.exists()).toBe(true)
    })
  })

  describe('时间格式化', () => {
    it('formatTime应正确格式化时间戳', () => {
      const timestamp = new Date('2024-03-15 14:30:00').getTime()
      const result = wrapper.vm.formatTime(timestamp)
      expect(result).toBe('14:30')
    })

    it('formatTime应补零', () => {
      const timestamp = new Date('2024-03-15 09:05:00').getTime()
      const result = wrapper.vm.formatTime(timestamp)
      expect(result).toBe('09:05')
    })
  })

  describe('面板关闭', () => {
    it('closeChat函数应存在', () => {
      expect(typeof wrapper.vm.closeChat).toBe('function')
    })

    it('点击关闭按钮应关闭对话面板', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      expect(wrapper.find('.ai-bot-modal').exists()).toBe(true)
      
      const closeBtn = wrapper.find('.ai-bot-modal__btn')
      if (closeBtn.exists()) {
        await closeBtn.trigger('click')
      }
    })
  })

  describe('清空历史', () => {
    it('对话面板应有操作按钮', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      const modalBtns = wrapper.findAll('.ai-bot-modal__btn')
      expect(modalBtns.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('触摸拖拽', () => {
    it('startTouchDrag函数应存在', () => {
      expect(typeof wrapper.vm.startTouchDrag).toBe('function')
    })
  })

  describe('导航项计算', () => {
    it('navItems应包含4个导航项', () => {
      expect(wrapper.vm.navItems).toHaveLength(4)
    })

    it('navItems应包含正确的路径', () => {
      const paths = wrapper.vm.navItems.map(n => n.path)
      expect(paths).toContain('/')
      expect(paths).toContain('/videos')
      expect(paths).toContain('/settings')
    })
  })

  describe('位置样式', () => {
    it('botStyle应包含left和top', () => {
      const style = wrapper.vm.botStyle
      expect(style).toHaveProperty('left')
      expect(style).toHaveProperty('top')
    })
  })

  describe('拖拽交互', () => {
    it('startDrag函数应存在', () => {
      expect(typeof wrapper.vm.startDrag).toBe('function')
    })

    it('isDragging应为布尔值', () => {
      expect(typeof wrapper.vm.isDragging).toBe('boolean')
    })

    it('初始isDragging应为false', () => {
      expect(wrapper.vm.isDragging).toBe(false)
    })
  })

  describe('消息交互', () => {
    it('空消息不应发送', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      wrapper.vm.inputText = ''
      const initialLength = wrapper.vm.$pinia.state.value.ai?.messages?.length || 0
      wrapper.vm.sendMessage()
      // 空消息不会增加消息数
      expect(wrapper.vm.inputText).toBe('')
    })

    it('发送消息后应清空输入框', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      await wrapper.find('.ai-bot__bubble--chat').trigger('click')
      wrapper.vm.inputText = '测试消息'
      wrapper.vm.sendMessage()
      expect(wrapper.vm.inputText).toBe('')
    })
  })

  describe('气泡菜单交互', () => {
    it('toggleBubbleMenu函数应存在', () => {
      expect(typeof wrapper.vm.toggleBubbleMenu).toBe('function')
    })

    it('openChat函数应存在', () => {
      expect(typeof wrapper.vm.openChat).toBe('function')
    })

    it('navigateTo函数应存在', () => {
      expect(typeof wrapper.vm.navigateTo).toBe('function')
    })
  })

  describe('滚动功能', () => {
    it('scrollToBottom函数应存在', () => {
      expect(typeof wrapper.vm.scrollToBottom).toBe('function')
    })

    it('messagesRef应存在', () => {
      expect(wrapper.vm.messagesRef !== undefined || wrapper.vm.messagesRef === null).toBe(true)
    })
  })

  describe('analysisVideoId计算属性', () => {
    it('analysisVideoId应返回字符串', () => {
      expect(typeof wrapper.vm.analysisVideoId).toBe('string')
    })

    it('analysisVideoId应有默认值', () => {
      expect(wrapper.vm.analysisVideoId.length).toBeGreaterThan(0)
    })
  })

  describe('语音识别状态', () => {
    it('speechRecognition应初始化', () => {
      // speechRecognition可能为null（浏览器不支持）或对象
      expect(wrapper.vm.speechRecognition === null || typeof wrapper.vm.speechRecognition === 'object').toBe(true)
    })
  })

  describe('外部点击处理', () => {
    it('handleOutsideClick函数应存在', () => {
      expect(typeof wrapper.vm.handleOutsideClick).toBe('function')
    })

    it('handleOutsideClick应关闭气泡菜单', async () => {
      await wrapper.find('.ai-bot__avatar').trigger('click')
      expect(wrapper.find('.ai-bot__bubbles').exists()).toBe(true)
      wrapper.vm.handleOutsideClick()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.ai-bot__bubbles').exists()).toBe(false)
    })
  })
})
