import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock request module with all exports
vi.mock('@/api/request', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({})
  },
  shouldUseMock: vi.fn().mockReturnValue(false),
  requestWithRetry: vi.fn().mockResolvedValue({}),
  handleEmptyData: vi.fn((data, fallback) => data ?? fallback)
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    action: vi.fn()
  })
}))

import { videoApi, dashboardApi, aiApi, settingsApi } from '@/api/video'
import request, { shouldUseMock } from '@/api/request'

describe('Video API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldUseMock.mockReturnValue(false)
  })

  describe('真实 API 模式', () => {
    it('getList 应调用 GET /videos', async () => {
      await videoApi.getList({ page: 1 })
      expect(request.get).toHaveBeenCalledWith('/videos', { params: { page: 1 } })
    })

    it('getDetail 应调用 GET /videos/:id', async () => {
      await videoApi.getDetail('v001')
      expect(request.get).toHaveBeenCalledWith('/videos/v001')
    })

    it('upload 应调用 POST /videos/upload', async () => {
      const formData = new FormData()
      await videoApi.upload(formData)
      expect(request.post).toHaveBeenCalledWith('/videos/upload', formData, expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' }
      }))
    })

    it('delete 应调用 DELETE /videos/:id', async () => {
      await videoApi.delete('v001')
      expect(request.delete).toHaveBeenCalledWith('/videos/v001')
    })

    it('updateTags 应调用 PUT /videos/:id/tags', async () => {
      await videoApi.updateTags('v001', ['tag1', 'tag2'])
      expect(request.put).toHaveBeenCalledWith('/videos/v001/tags', { tags: ['tag1', 'tag2'] })
    })

    it('startAnalysis 应调用 POST /videos/:id/analyze', async () => {
      await videoApi.startAnalysis('v001')
      expect(request.post).toHaveBeenCalledWith('/videos/v001/analyze')
    })

    it('generateReport 应调用 POST /videos/:id/report', async () => {
      await videoApi.generateReport('v001', { content: 'report' })
      expect(request.post).toHaveBeenCalledWith('/videos/v001/report', { content: 'report' })
    })
  })

  describe('Mock 模式', () => {
    beforeEach(() => {
      shouldUseMock.mockReturnValue(true)
    })

    it('getList 应返回 Mock 数据', async () => {
      const result = await videoApi.getList()
      expect(result).toBeDefined()
    })

    it('getDetail 应返回 Mock 数据', async () => {
      const result = await videoApi.getDetail('v001')
      expect(result).toBeDefined()
    })

    it('upload 应返回 Mock 成功响应', async () => {
      const formData = new FormData()
      const result = await videoApi.upload(formData)
      expect(result).toBeDefined()
    })

    it('delete 应返回 Mock 成功响应', async () => {
      const result = await videoApi.delete('v001')
      expect(result).toBeDefined()
    })

    it('updateTags 应返回 Mock 成功响应', async () => {
      const result = await videoApi.updateTags('v001', ['tag1'])
      expect(result).toBeDefined()
    })

    it('startAnalysis 应返回 Mock 成功响应', async () => {
      const result = await videoApi.startAnalysis('v001')
      expect(result).toBeDefined()
    })

    it('generateReport 应返回 Mock 成功响应', async () => {
      const result = await videoApi.generateReport('v001', {})
      expect(result).toBeDefined()
    })
  })
})

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldUseMock.mockReturnValue(false)
  })

  describe('真实 API 模式', () => {
    it('getStats 应调用 GET /dashboard/stats', async () => {
      await dashboardApi.getStats()
      expect(request.get).toHaveBeenCalledWith('/dashboard/stats')
    })

    it('getTasks 应调用 GET /dashboard/tasks', async () => {
      await dashboardApi.getTasks()
      expect(request.get).toHaveBeenCalledWith('/dashboard/tasks')
    })

    it('getNotifications 应调用 GET /dashboard/notifications', async () => {
      await dashboardApi.getNotifications()
      expect(request.get).toHaveBeenCalledWith('/dashboard/notifications')
    })
  })

  describe('Mock 模式', () => {
    beforeEach(() => {
      shouldUseMock.mockReturnValue(true)
    })

    it('getStats 应返回 Mock 数据', async () => {
      const result = await dashboardApi.getStats()
      expect(result).toBeDefined()
    })

    it('getTasks 应返回 Mock 数据', async () => {
      const result = await dashboardApi.getTasks()
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('getNotifications 应返回 Mock 数据', async () => {
      const result = await dashboardApi.getNotifications()
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})

describe('AI API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldUseMock.mockReturnValue(false)
  })

  describe('真实 API 模式', () => {
    it('chat 应调用 POST /ai/chat', async () => {
      await aiApi.chat({ message: '你好' })
      expect(request.post).toHaveBeenCalledWith('/ai/chat', { message: '你好' })
    })

    it('chatAboutVideo 应调用 POST /ai/chat/video/:id', async () => {
      await aiApi.chatAboutVideo('v001', { message: '分析' })
      expect(request.post).toHaveBeenCalledWith('/ai/chat/video/v001', { message: '分析' })
    })

    it('getHistory 应调用 GET /ai/history', async () => {
      await aiApi.getHistory()
      expect(request.get).toHaveBeenCalledWith('/ai/history')
    })

    it('clearHistory 应调用 DELETE /ai/history', async () => {
      await aiApi.clearHistory()
      expect(request.delete).toHaveBeenCalledWith('/ai/history')
    })
  })

  describe('Mock 模式', () => {
    beforeEach(() => {
      shouldUseMock.mockReturnValue(true)
    })

    it('chat 应返回 Mock 响应', async () => {
      const result = await aiApi.chat({ message: '你好' })
      expect(result).toBeDefined()
      expect(result.reply).toBeDefined()
    })

    it('chatAboutVideo 应返回 Mock 响应', async () => {
      const result = await aiApi.chatAboutVideo('v001', { message: '分析' })
      expect(result).toBeDefined()
      expect(result.reply).toBeDefined()
    })

    it('getHistory 应返回 Mock 数据', async () => {
      const result = await aiApi.getHistory()
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('clearHistory 应返回 Mock 成功响应', async () => {
      const result = await aiApi.clearHistory()
      expect(result).toBeDefined()
    })
  })
})

describe('Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldUseMock.mockReturnValue(false)
  })

  describe('真实 API 模式', () => {
    it('getProfile 应调用 GET /user/profile', async () => {
      await settingsApi.getProfile()
      expect(request.get).toHaveBeenCalledWith('/user/profile')
    })

    it('updateProfile 应调用 PUT /user/profile', async () => {
      await settingsApi.updateProfile({ name: '张工' })
      expect(request.put).toHaveBeenCalledWith('/user/profile', { name: '张工' })
    })

    it('getSopList 应调用 GET /settings/sop', async () => {
      await settingsApi.getSopList()
      expect(request.get).toHaveBeenCalledWith('/settings/sop')
    })

    it('createSop 应调用 POST /settings/sop', async () => {
      await settingsApi.createSop({ name: 'SOP1' })
      expect(request.post).toHaveBeenCalledWith('/settings/sop', { name: 'SOP1' })
    })

    it('deleteSop 应调用 DELETE /settings/sop/:id', async () => {
      await settingsApi.deleteSop('s1')
      expect(request.delete).toHaveBeenCalledWith('/settings/sop/s1')
    })

    it('getKnowledgeBase 应调用 GET /settings/knowledge-base', async () => {
      await settingsApi.getKnowledgeBase()
      expect(request.get).toHaveBeenCalledWith('/settings/knowledge-base')
    })

    it('deleteKnowledge 应调用 DELETE /settings/knowledge-base/:id', async () => {
      await settingsApi.deleteKnowledge('k1')
      expect(request.delete).toHaveBeenCalledWith('/settings/knowledge-base/k1')
    })
  })

  describe('Mock 模式', () => {
    beforeEach(() => {
      shouldUseMock.mockReturnValue(true)
    })

    it('getProfile 应返回 Mock 数据', async () => {
      const result = await settingsApi.getProfile()
      expect(result).toBeDefined()
    })

    it('updateProfile 应返回 Mock 成功响应', async () => {
      const result = await settingsApi.updateProfile({ name: '张工' })
      expect(result).toBeDefined()
    })

    it('getSopList 应返回 Mock 数据', async () => {
      const result = await settingsApi.getSopList()
      expect(result).toBeDefined()
    })

    it('createSop 应返回 Mock 成功响应', async () => {
      const result = await settingsApi.createSop({ name: 'SOP1' })
      expect(result).toBeDefined()
    })

    it('deleteSop 应返回 Mock 成功响应', async () => {
      const result = await settingsApi.deleteSop('s1')
      expect(result).toBeDefined()
    })

    it('getKnowledgeBase 应返回 Mock 数据', async () => {
      const result = await settingsApi.getKnowledgeBase()
      expect(result).toBeDefined()
    })

    it('deleteKnowledge 应返回 Mock 成功响应', async () => {
      const result = await settingsApi.deleteKnowledge('k1')
      expect(result).toBeDefined()
    })

    it('uploadKnowledge 应返回 Mock 成功响应', async () => {
      const formData = new FormData()
      const result = await settingsApi.uploadKnowledge(formData)
      expect(result).toBeDefined()
    })

    it('updateSop 应返回 Mock 成功响应', async () => {
      const result = await settingsApi.updateSop('s1', { name: 'Updated SOP' })
      expect(result).toBeDefined()
    })
  })
})
