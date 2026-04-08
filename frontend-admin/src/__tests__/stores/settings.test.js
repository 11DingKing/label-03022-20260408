import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('SettingsStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSettingsStore()
  })

  describe('初始化', () => {
    it('应有默认个人信息', () => {
      expect(store.profile.name).toBe('张明华')
      expect(store.profile.email).toContain('@')
      expect(store.profile.department).toBeTruthy()
      expect(store.profile.role).toBeTruthy()
    })

    it('默认主题应为 dark-blue', () => {
      expect(store.theme).toBe('dark-blue')
    })

    it('SOP合规检测默认开启', () => {
      expect(store.sopComplianceEnabled).toBe(true)
    })

    it('应有初始SOP列表', () => {
      expect(store.sopList.length).toBeGreaterThan(0)
    })

    it('应有一个默认SOP', () => {
      const defaults = store.sopList.filter(s => s.isDefault)
      expect(defaults).toHaveLength(1)
    })

    it('应有初始知识库文档', () => {
      expect(store.knowledgeBase.length).toBeGreaterThan(0)
    })

    it('应有3个主题选项', () => {
      expect(store.themeOptions).toHaveLength(3)
      store.themeOptions.forEach(opt => {
        expect(opt).toHaveProperty('value')
        expect(opt).toHaveProperty('label')
        expect(opt).toHaveProperty('primary')
        expect(opt).toHaveProperty('bg')
      })
    })
  })

  describe('updateProfile', () => {
    it('应正确更新个人信息', () => {
      store.updateProfile({ name: '李工', department: '技术部' })
      expect(store.profile.name).toBe('李工')
      expect(store.profile.department).toBe('技术部')
    })

    it('应保留未更新的字段', () => {
      const originalEmail = store.profile.email
      store.updateProfile({ name: '新名字' })
      expect(store.profile.email).toBe(originalEmail)
    })
  })

  describe('SOP管理', () => {
    it('addSop 应正确添加SOP', () => {
      const before = store.sopList.length
      store.addSop({ name: '新SOP', content: '内容' })
      expect(store.sopList).toHaveLength(before + 1)
      const added = store.sopList[store.sopList.length - 1]
      expect(added.name).toBe('新SOP')
      expect(added.content).toBe('内容')
      expect(added.id).toBeTruthy()
      expect(added.createdAt).toBeTruthy()
    })

    it('removeSop 应正确删除SOP', () => {
      const before = store.sopList.length
      const idToRemove = store.sopList[0].id
      store.removeSop(idToRemove)
      expect(store.sopList).toHaveLength(before - 1)
      expect(store.sopList.find(s => s.id === idToRemove)).toBeUndefined()
    })

    it('removeSop 对不存在的ID不应报错', () => {
      const before = store.sopList.length
      store.removeSop('nonexistent')
      expect(store.sopList).toHaveLength(before)
    })

    it('setDefaultSop 应正确设置默认SOP', () => {
      const targetId = store.sopList[1].id
      store.setDefaultSop(targetId)
      store.sopList.forEach(s => {
        expect(s.isDefault).toBe(s.id === targetId)
      })
    })

    it('setDefaultSop 应确保只有一个默认', () => {
      store.setDefaultSop(store.sopList[2].id)
      const defaults = store.sopList.filter(s => s.isDefault)
      expect(defaults).toHaveLength(1)
    })
  })

  describe('知识库管理', () => {
    it('addKnowledge 应正确添加文档', () => {
      const before = store.knowledgeBase.length
      store.addKnowledge({ name: '新文档.pdf', size: '3.0MB' })
      expect(store.knowledgeBase).toHaveLength(before + 1)
      const added = store.knowledgeBase[store.knowledgeBase.length - 1]
      expect(added.name).toBe('新文档.pdf')
      expect(added.size).toBe('3.0MB')
      expect(added.id).toBeTruthy()
      expect(added.uploadedAt).toBeTruthy()
    })

    it('removeKnowledge 应正确删除文档', () => {
      const before = store.knowledgeBase.length
      const idToRemove = store.knowledgeBase[0].id
      store.removeKnowledge(idToRemove)
      expect(store.knowledgeBase).toHaveLength(before - 1)
    })

    it('removeKnowledge 对不存在的ID不应报错', () => {
      const before = store.knowledgeBase.length
      store.removeKnowledge('nonexistent')
      expect(store.knowledgeBase).toHaveLength(before)
    })
  })

  describe('主题切换', () => {
    it('应可切换主题', () => {
      store.theme = 'dark-purple'
      expect(store.theme).toBe('dark-purple')
    })

    it('切换主题应写入localStorage', async () => {
      localStorage.setItem.mockClear()
      store.theme = 'dark-green'
      // watch 是异步的，需要等待 nextTick
      await new Promise(r => setTimeout(r, 0))
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark-green')
    })
  })
})
