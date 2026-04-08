import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('AIStore', () => {
  let store
  let useAIStore

  beforeEach(async () => {
    // 清空 localStorage
    localStorage.clear()
    // 重置模块缓存
    vi.resetModules()
    // 动态导入 store
    const module = await import('@/stores/ai')
    useAIStore = module.useAIStore
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    // 获取 store
    store = useAIStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('初始化', () => {
    it('应有一条初始欢迎消息', () => {
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].role).toBe('assistant')
      expect(store.messages[0].content).toContain('AI助手')
    })

    it('初始状态应正确', () => {
      expect(store.isExpanded).toBe(false)
      expect(store.isBubbleMenuOpen).toBe(false)
      expect(store.isListening).toBe(false)
      expect(store.isProcessing).toBe(false)
    })

    it('位置应有有效坐标', () => {
      expect(store.position.x).toBeGreaterThanOrEqual(0)
      expect(store.position.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('addMessage', () => {
    it('应正确添加用户消息', () => {
      store.addMessage('user', '测试消息')
      expect(store.messages).toHaveLength(2)
      expect(store.messages[1].role).toBe('user')
      expect(store.messages[1].content).toBe('测试消息')
    })

    it('应正确添加助手消息', () => {
      store.addMessage('assistant', 'AI回复')
      expect(store.messages).toHaveLength(2)
      expect(store.messages[1].role).toBe('assistant')
    })

    it('消息应包含时间戳', () => {
      store.addMessage('user', '测试')
      const msg = store.messages[1]
      expect(msg.timestamp).toBeDefined()
      expect(new Date(msg.timestamp).getTime()).not.toBeNaN()
    })

    it('消息应有唯一ID', () => {
      store.addMessage('user', '消息1')
      store.addMessage('user', '消息2')
      expect(store.messages[1].id).not.toBe(store.messages[2].id)
    })
  })

  describe('sendMessage', () => {
    it('应添加用户消息并触发AI回复', () => {
      store.sendMessage('你好')
      expect(store.messages).toHaveLength(2)
      expect(store.messages[1].role).toBe('user')
      expect(store.messages[1].content).toBe('你好')
      expect(store.isProcessing).toBe(true)
    })

    it('AI应在延迟后回复', () => {
      store.sendMessage('你好')
      vi.advanceTimersByTime(2000)
      expect(store.messages.length).toBeGreaterThanOrEqual(3)
      expect(store.messages[2].role).toBe('assistant')
      expect(store.isProcessing).toBe(false)
    })

    it('发送"驾驶舱"应回复导航相关内容', () => {
      store.sendMessage('打开驾驶舱')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('驾驶舱')
    })

    it('发送"视频库"应回复导航相关内容', () => {
      store.sendMessage('打开视频库')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('视频库')
    })

    it('发送"设置"应回复导航相关内容', () => {
      store.sendMessage('打开设置')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('个人中心')
    })

    it('发送"帮助"应回复功能列表', () => {
      store.sendMessage('帮助')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('导航')
    })

    it('发送"报告"应回复报告相关内容', () => {
      store.sendMessage('生成报告')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('报告')
    })
  })

  describe('clearHistory', () => {
    it('应保留初始欢迎消息', () => {
      store.sendMessage('消息1')
      store.sendMessage('消息2')
      store.clearHistory()
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].role).toBe('assistant')
    })
  })

  describe('position', () => {
    it('应能更新位置', () => {
      store.position.x = 100
      store.position.y = 200
      expect(store.position.x).toBe(100)
      expect(store.position.y).toBe(200)
    })
  })

  describe('状态切换', () => {
    it('应能切换 isExpanded', () => {
      store.isExpanded = true
      expect(store.isExpanded).toBe(true)
      store.isExpanded = false
      expect(store.isExpanded).toBe(false)
    })

    it('应能切换 isBubbleMenuOpen', () => {
      store.isBubbleMenuOpen = true
      expect(store.isBubbleMenuOpen).toBe(true)
    })

    it('应能切换 isListening', () => {
      store.isListening = true
      expect(store.isListening).toBe(true)
    })
  })

  describe('消息内容', () => {
    it('发送"分析"应回复分析相关内容', () => {
      store.sendMessage('分析视频')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('分析')
    })

    it('发送未知命令应回复默认内容', () => {
      store.sendMessage('随机内容xyz')
      vi.advanceTimersByTime(2000)
      expect(store.messages.length).toBeGreaterThanOrEqual(3)
    })

    it('发送"上传"应回复上传相关内容', () => {
      store.sendMessage('上传视频')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('上传')
    })

    it('发送"搜索"应回复搜索相关内容', () => {
      store.sendMessage('搜索视频')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('搜索')
    })

    it('发送"任务"应回复任务相关内容', () => {
      store.sendMessage('查看任务')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('任务')
    })

    it('发送"通知"应回复通知相关内容', () => {
      store.sendMessage('查看通知')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('通知')
    })

    it('发送"你好"应回复问候', () => {
      store.sendMessage('你好')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('你好')
    })

    it('发送"谢谢"应回复感谢', () => {
      store.sendMessage('谢谢')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('不客气')
    })

    it('发送"首页"应回复驾驶舱相关内容', () => {
      store.sendMessage('首页')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('驾驶舱')
    })

    it('发送"所有视频"应回复视频库相关内容', () => {
      store.sendMessage('所有视频')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('视频库')
    })

    it('发送"导出"应回复报告相关内容', () => {
      store.sendMessage('导出报告')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('报告')
    })

    it('发送"添加视频"应回复上传相关内容', () => {
      store.sendMessage('添加视频')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('上传')
    })

    it('发送"查找"应回复搜索相关内容', () => {
      store.sendMessage('查找视频')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('搜索')
    })

    it('发送"待办"应回复任务相关内容', () => {
      store.sendMessage('待办事项')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('任务')
    })

    it('发送"消息"应回复通知相关内容', () => {
      store.sendMessage('查看消息')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('通知')
    })

    it('发送"hi"应回复问候', () => {
      store.sendMessage('hi')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('你好')
    })

    it('发送"感谢你"应回复感谢', () => {
      store.sendMessage('感谢你')
      vi.advanceTimersByTime(2000)
      const reply = store.messages[2].content
      expect(reply).toContain('不客气')
    })
  })
})
