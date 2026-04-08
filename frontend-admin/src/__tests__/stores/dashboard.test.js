import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

describe('DashboardStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDashboardStore()
  })

  describe('stats 数据', () => {
    it('应包含8项统计指标', () => {
      const keys = Object.keys(store.stats)
      expect(keys).toHaveLength(8)
    })

    it('每项指标应包含完整字段', () => {
      Object.values(store.stats).forEach(stat => {
        expect(stat).toHaveProperty('value')
        expect(stat).toHaveProperty('unit')
        expect(stat).toHaveProperty('label')
        expect(stat).toHaveProperty('trend')
        expect(typeof stat.value).toBe('number')
        expect(typeof stat.trend).toBe('number')
      })
    })

    it('应包含必需的指标类型', () => {
      const keys = Object.keys(store.stats)
      expect(keys).toContain('bandwidth')
      expect(keys).toContain('storage')
      expect(keys).toContain('tokens')
      expect(keys).toContain('analyzed')
      expect(keys).toContain('pending')
      expect(keys).toContain('compliance')
      expect(keys).toContain('todayVideos')
      expect(keys).toContain('reports')
    })

    it('合规率应在0-100之间', () => {
      expect(store.stats.compliance.value).toBeGreaterThanOrEqual(0)
      expect(store.stats.compliance.value).toBeLessThanOrEqual(100)
    })

    it('所有数值应为正数', () => {
      Object.values(store.stats).forEach(stat => {
        expect(stat.value).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('tasks 数据', () => {
    it('应有任务列表', () => {
      expect(store.tasks.length).toBeGreaterThan(0)
    })

    it('每个任务应包含完整字段', () => {
      store.tasks.forEach(task => {
        expect(task).toHaveProperty('id')
        expect(task).toHaveProperty('title')
        expect(task).toHaveProperty('status')
        expect(task).toHaveProperty('dueDate')
      })
    })

    it('任务状态应为有效值', () => {
      const validStatuses = ['pending', 'in_progress', 'completed']
      store.tasks.forEach(task => {
        expect(validStatuses).toContain(task.status)
      })
    })

    it('任务ID应唯一', () => {
      const ids = store.tasks.map(t => t.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('notifications 数据', () => {
    it('应有通知列表', () => {
      expect(store.notifications.length).toBeGreaterThan(0)
    })

    it('每个通知应包含完整字段', () => {
      store.notifications.forEach(n => {
        expect(n).toHaveProperty('id')
        expect(n).toHaveProperty('title')
        expect(n).toHaveProperty('content')
        expect(n).toHaveProperty('isRead')
        expect(n).toHaveProperty('createdAt')
        expect(typeof n.isRead).toBe('boolean')
      })
    })

    it('应有未读通知', () => {
      const unread = store.notifications.filter(n => !n.isRead)
      expect(unread.length).toBeGreaterThan(0)
    })

    it('通知ID应唯一', () => {
      const ids = store.notifications.map(n => n.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('通知时间应为有效日期', () => {
      store.notifications.forEach(n => {
        expect(new Date(n.createdAt).getTime()).not.toBeNaN()
      })
    })
  })

  describe('统计指标详情', () => {
    it('bandwidth应有正确的单位', () => {
      expect(store.stats.bandwidth.unit).toBe('GB')
    })

    it('storage应有正确的单位', () => {
      expect(store.stats.storage.unit).toBe('PB')
    })

    it('tokens应有正确的单位', () => {
      expect(store.stats.tokens.unit).toBe('K')
    })

    it('analyzed应有正确的标签', () => {
      expect(store.stats.analyzed.label).toBe('已分析视频')
    })

    it('pending应有正确的标签', () => {
      expect(store.stats.pending.label).toBe('待处理视频')
    })

    it('compliance应有正确的单位', () => {
      expect(store.stats.compliance.unit).toBe('%')
    })

    it('todayVideos应有正确的标签', () => {
      expect(store.stats.todayVideos.label).toBe('今日视频')
    })

    it('reports应有正确的标签', () => {
      expect(store.stats.reports.label).toBe('生成报告')
    })
  })

  describe('趋势数据', () => {
    it('趋势值应为数字', () => {
      Object.values(store.stats).forEach(stat => {
        expect(typeof stat.trend).toBe('number')
      })
    })
  })
})
