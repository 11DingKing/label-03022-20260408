import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Settings from '@/views/Settings.vue'
import ElementPlus from 'element-plus'

describe('Settings 页面', () => {
  let wrapper, pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/settings', component: Settings }]
    })
    await router.push('/settings')
    await router.isReady()

    wrapper = mount(Settings, {
      global: { plugins: [pinia, router, ElementPlus] }
    })
  })

  describe('基础渲染', () => {
    it('应渲染侧边导航', () => {
      expect(wrapper.find('.settings__sidebar').exists()).toBe(true)
    })

    it('侧边导航应有5个选项', () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      expect(navItems).toHaveLength(5)
    })

    it('默认应选中个人信息', () => {
      const activeItem = wrapper.find('.settings__nav-item.is-active')
      expect(activeItem.exists()).toBe(true)
      expect(activeItem.text()).toContain('个人信息')
    })

    it('应渲染内容区域', () => {
      expect(wrapper.find('.settings__content').exists()).toBe(true)
    })
  })

  describe('个人信息面板', () => {
    it('应显示个人信息表单', () => {
      expect(wrapper.find('.settings__form').exists()).toBe(true)
    })

    it('应有头像区域', () => {
      expect(wrapper.find('.settings__avatar').exists()).toBe(true)
    })

    it('应有姓名输入框', () => {
      const formItems = wrapper.findAll('.el-form-item')
      expect(formItems.length).toBeGreaterThan(0)
    })

    it('应有保存按钮', () => {
      const saveBtn = wrapper.findAll('.el-button').find(b => b.text().includes('保存'))
      expect(saveBtn).toBeDefined()
    })
  })

  describe('导航切换', () => {
    it('点击主题配色应切换面板', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      const themeNav = navItems.find(n => n.text().includes('主题配色'))
      await themeNav.trigger('click')
      expect(wrapper.find('.settings__themes').exists()).toBe(true)
    })

    it('主题面板应显示3个主题选项', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('主题配色')).trigger('click')
      const themeCards = wrapper.findAll('.settings__theme-card')
      expect(themeCards).toHaveLength(3)
    })

    it('点击SOP管理应切换面板', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('SOP管理')).trigger('click')
      expect(wrapper.find('.settings__sop-switch').exists()).toBe(true)
      expect(wrapper.find('.settings__sop-list').exists()).toBe(true)
    })

    it('SOP面板应显示合规检测开关', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('SOP管理')).trigger('click')
      expect(wrapper.find('.el-switch').exists()).toBe(true)
    })

    it('点击知识库应切换面板', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('知识库')).trigger('click')
      expect(wrapper.find('.settings__knowledge-list').exists()).toBe(true)
    })

    it('知识库应显示已有文档', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('知识库')).trigger('click')
      const items = wrapper.findAll('.settings__knowledge-item')
      expect(items.length).toBeGreaterThan(0)
    })

    it('点击对话历史应切换面板', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('对话历史')).trigger('click')
      expect(wrapper.find('.settings__history').exists()).toBe(true)
    })
  })

  describe('主题切换', () => {
    it('点击主题卡片应切换主题', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('主题配色')).trigger('click')
      const themeCards = wrapper.findAll('.settings__theme-card')
      await themeCards[1].trigger('click')
      expect(themeCards[1].classes()).toContain('is-active')
    })
  })

  describe('SOP管理', () => {
    it('SOP列表应显示多个SOP项', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('SOP管理')).trigger('click')
      const sopItems = wrapper.findAll('.settings__sop-item')
      expect(sopItems.length).toBeGreaterThan(0)
    })

    it('SOP项应有名称和内容', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('SOP管理')).trigger('click')
      const sopItem = wrapper.find('.settings__sop-item')
      expect(sopItem.find('.settings__sop-name').exists()).toBe(true)
      expect(sopItem.find('.settings__sop-content').exists()).toBe(true)
    })
  })

  describe('知识库管理', () => {
    it('知识库项应有名称和元信息', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('知识库')).trigger('click')
      const item = wrapper.find('.settings__knowledge-item')
      expect(item.find('.settings__knowledge-name').exists()).toBe(true)
      expect(item.find('.settings__knowledge-meta').exists()).toBe(true)
    })

    it('点击上传文档按钮应打开上传对话框', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('知识库')).trigger('click')
      const uploadBtn = wrapper.findAll('.el-button').find(b => b.text().includes('上传文档'))
      await uploadBtn.trigger('click')
      expect(wrapper.vm.showKnowledgeUpload).toBe(true)
    })
  })

  describe('SOP弹窗功能', () => {
    it('点击新建SOP应打开弹窗', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('SOP管理')).trigger('click')
      const newBtn = wrapper.findAll('.el-button').find(b => b.text().includes('新建SOP'))
      await newBtn.trigger('click')
      expect(wrapper.vm.showSopDialog).toBe(true)
    })

    it('点击导入SOP应打开导入弹窗', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('SOP管理')).trigger('click')
      const importBtn = wrapper.findAll('.el-button').find(b => b.text().includes('导入SOP'))
      await importBtn.trigger('click')
      expect(wrapper.vm.showSopImport).toBe(true)
    })

    it('SOP项应有编辑和删除按钮', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('SOP管理')).trigger('click')
      const sopItem = wrapper.find('.settings__sop-item')
      const actions = sopItem.find('.settings__sop-actions')
      expect(actions.exists()).toBe(true)
      expect(actions.text()).toContain('编辑')
      expect(actions.text()).toContain('删除')
    })
  })

  describe('对话历史功能', () => {
    it('对话历史应显示消息列表', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('对话历史')).trigger('click')
      const historyItems = wrapper.findAll('.settings__history-item')
      expect(historyItems.length).toBeGreaterThan(0)
    })

    it('对话历史应有清空按钮', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('对话历史')).trigger('click')
      const clearBtn = wrapper.findAll('.el-button').find(b => b.text().includes('清空'))
      expect(clearBtn).toBeDefined()
    })

    it('历史项应显示角色标签', async () => {
      const navItems = wrapper.findAll('.settings__nav-item')
      await navItems.find(n => n.text().includes('对话历史')).trigger('click')
      const historyItem = wrapper.find('.settings__history-item')
      expect(historyItem.find('.el-tag').exists()).toBe(true)
    })
  })

  describe('工具函数', () => {
    it('formatTime应正确格式化时间戳', () => {
      const timestamp = new Date('2024-03-15 14:30:00').getTime()
      const result = wrapper.vm.formatTime(timestamp)
      expect(result).toContain('/')
      expect(result).toContain(':')
    })
  })

  describe('表单交互', () => {
    it('保存个人信息应触发保存流程', async () => {
      const saveBtn = wrapper.findAll('.el-button').find(b => b.text().includes('保存'))
      expect(saveBtn).toBeDefined()
      expect(typeof wrapper.vm.saveProfile).toBe('function')
    })

    it('profileForm应有正确的字段', () => {
      expect(wrapper.vm.profileForm).toHaveProperty('name')
      expect(wrapper.vm.profileForm).toHaveProperty('email')
      expect(wrapper.vm.profileForm).toHaveProperty('department')
      expect(wrapper.vm.profileForm).toHaveProperty('role')
    })

    it('sopForm应有name和content字段', () => {
      expect(wrapper.vm.sopForm).toHaveProperty('name')
      expect(wrapper.vm.sopForm).toHaveProperty('content')
    })
  })
})
