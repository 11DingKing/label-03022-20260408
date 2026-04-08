/**
 * 视频分析 API 模块
 * 
 * 提供视频管理、AI 分析、仪表盘数据等接口
 * 
 * ⚠️ Mock 模式说明：
 * 当前版本为纯前端演示应用，所有 API 默认返回模拟数据。
 * 这是为了让用户无需后端服务即可体验完整功能。
 * 
 * 切换到真实 API：
 * 1. 设置环境变量 VITE_USE_MOCK=false
 * 2. 配置 VITE_API_BASE_URL 指向后端服务
 * 
 * @module api/video
 */

import request, { shouldUseMock, requestWithRetry, handleEmptyData } from './request'
import { createLogger } from '@/utils/logger'

const log = createLogger('VideoAPI')

/**
 * Mock 数据生成器
 * 用于在无后端服务时提供演示数据
 * @private
 */
const mockGenerators = {
  videoList: () => {
    log.info('使用 Mock 数据: videoList')
    return Promise.resolve([])  // 实际数据由 store 提供
  },
  videoDetail: (id) => {
    log.info('使用 Mock 数据: videoDetail', { id })
    return Promise.resolve(null)
  },
  dashboardStats: () => ({
    gpuUsage: 67,
    storageUsed: 2.4,
    tokensUsed: 156000,
    videosProcessed: 847,
    videosAnalyzing: 12,
    videosPending: 45,
    complianceRate: 94.2,
    alertsToday: 3
  }),
  tasks: () => [],
  notifications: () => []
}

/**
 * 创建带 Mock 回退的 API 调用
 */
function createApiCall(apiCall, mockGenerator, options = {}) {
  return async (...args) => {
    if (shouldUseMock()) {
      return mockGenerator(...args)
    }
    
    try {
      const result = options.retry 
        ? await requestWithRetry({ ...apiCall(...args) })
        : await apiCall(...args)
      return handleEmptyData(result, options.fallback)
    } catch (error) {
      log.warn('API 调用失败，使用 Mock 数据', { error: error.message })
      if (options.fallbackToMock !== false) {
        return mockGenerator(...args)
      }
      throw error
    }
  }
}

export const videoApi = {
  getList: createApiCall(
    (params) => request.get('/videos', { params }),
    mockGenerators.videoList,
    { fallback: [], retry: true }
  ),
  
  getDetail: createApiCall(
    (id) => request.get(`/videos/${id}`),
    mockGenerators.videoDetail,
    { fallback: null }
  ),
  
  upload: (formData, onProgress) => {
    if (shouldUseMock()) {
      log.info('Mock 上传视频')
      return new Promise(resolve => {
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          onProgress?.({ percent: progress })
          if (progress >= 100) {
            clearInterval(interval)
            resolve({ id: `v_${Date.now()}`, status: 'pending' })
          }
        }, 150)
      })
    }
    return request.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (e) => onProgress?.({ percent: Math.round(e.loaded / e.total * 100) })
    })
  },
  
  delete: (id) => {
    if (shouldUseMock()) {
      log.info('Mock 删除视频', { id })
      return Promise.resolve({ success: true })
    }
    return request.delete(`/videos/${id}`)
  },
  
  updateTags: (id, tags) => {
    if (shouldUseMock()) {
      log.info('Mock 更新标签', { id, tags })
      return Promise.resolve({ success: true })
    }
    return request.put(`/videos/${id}/tags`, { tags })
  },
  
  getAnalysis: createApiCall(
    (id) => request.get(`/videos/${id}/analysis`),
    () => ({ summary: '', compliance: [], timeline: [] }),
    { fallback: {} }
  ),
  
  startAnalysis: (id) => {
    if (shouldUseMock()) {
      log.info('Mock 开始分析', { id })
      return Promise.resolve({ taskId: `task_${Date.now()}`, status: 'processing' })
    }
    return request.post(`/videos/${id}/analyze`)
  },
  
  getTranscript: createApiCall(
    (id) => request.get(`/videos/${id}/transcript`),
    () => ({ text: '', segments: [] }),
    { fallback: {} }
  ),
  
  generateReport: (id, data) => {
    if (shouldUseMock()) {
      log.info('Mock 生成报告', { id })
      return Promise.resolve({ reportId: `report_${Date.now()}` })
    }
    return request.post(`/videos/${id}/report`, data)
  },
  
  exportReport: (id, format) => {
    if (shouldUseMock()) {
      log.info('Mock 导出报告', { id, format })
      return Promise.resolve(new Blob(['Mock Report'], { type: 'text/html' }))
    }
    return request.get(`/videos/${id}/report/export`, {
      params: { format },
      responseType: 'blob'
    })
  }
}

export const dashboardApi = {
  getStats: createApiCall(
    () => request.get('/dashboard/stats'),
    mockGenerators.dashboardStats,
    { fallback: {}, retry: true }
  ),
  
  getTasks: createApiCall(
    () => request.get('/dashboard/tasks'),
    mockGenerators.tasks,
    { fallback: [] }
  ),
  
  getNotifications: createApiCall(
    () => request.get('/dashboard/notifications'),
    mockGenerators.notifications,
    { fallback: [] }
  )
}

export const aiApi = {
  chat: (data) => {
    if (shouldUseMock()) {
      log.info('Mock AI 对话', { message: data.message?.slice(0, 20) })
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ reply: '这是 AI 的模拟回复，实际接入后端后将返回真实响应。' })
        }, 500)
      })
    }
    return request.post('/ai/chat', data)
  },
  
  chatAboutVideo: (videoId, data) => {
    if (shouldUseMock()) {
      return aiApi.chat(data)
    }
    return request.post(`/ai/chat/video/${videoId}`, data)
  },
  
  getHistory: createApiCall(
    () => request.get('/ai/history'),
    () => [],
    { fallback: [] }
  ),
  
  clearHistory: () => {
    if (shouldUseMock()) {
      return Promise.resolve({ success: true })
    }
    return request.delete('/ai/history')
  },

  /**
   * 根据视频分析结果生成 SOP
   * @param {string} videoId - 视频 ID
   * @param {Object} analysisData - 分析数据（合规检测结果、摘要等）
   * @returns {Promise<{name: string, content: string}>} 生成的 SOP
   */
  generateSopFromAnalysis: (videoId, analysisData) => {
    if (shouldUseMock()) {
      log.info('Mock 生成 SOP', { videoId })
      return new Promise(resolve => {
        setTimeout(() => {
          const { complianceResults = [], summary = '', videoName = '视频' } = analysisData
          const violations = complianceResults.filter(r => !r.pass)
          const passes = complianceResults.filter(r => r.pass)
          
          let sopContent = `# ${videoName} - 标准操作规程 (SOP)\n\n`
          sopContent += `## 生成时间\n${new Date().toLocaleString()}\n\n`
          sopContent += `## 视频摘要\n${summary}\n\n`
          
          sopContent += `## 合规要求\n`
          passes.forEach(item => {
            sopContent += `✅ ${item.label}：已符合规范\n`
          })
          sopContent += '\n'
          
          if (violations.length > 0) {
            sopContent += `## 需改进项\n`
            violations.forEach(item => {
              sopContent += `⚠️ ${item.label}（${item.time}）：需要修正\n`
            })
            sopContent += '\n'
            
            sopContent += `## 改进建议\n`
            violations.forEach((item, idx) => {
              sopContent += `${idx + 1}. 针对"${item.label}"问题，建议：\n`
              if (item.label.includes('话术')) {
                sopContent += `   - 避免使用"保本"、"保收益"等禁止性用语\n`
                sopContent += `   - 改用"历史业绩不代表未来表现"等合规表述\n`
              } else {
                sopContent += `   - 按照标准流程进行操作\n`
                sopContent += `   - 确保符合监管要求\n`
              }
            })
          }
          
          sopContent += `\n## 标准流程\n`
          sopContent += `1. 开场白：按规范进行自我介绍和风险提示\n`
          sopContent += `2. 内容讲解：确保信息准确、表述合规\n`
          sopContent += `3. 风险提示：完整告知投资风险\n`
          sopContent += `4. 结束语：规范收尾，提供联系方式\n`
          
          resolve({
            name: `${videoName}-SOP-${Date.now()}`,
            content: sopContent
          })
        }, 1000)
      })
    }
    return request.post(`/ai/sop/generate/${videoId}`, analysisData)
  }
}

export const settingsApi = {
  getProfile: createApiCall(
    () => request.get('/user/profile'),
    () => null,
    { fallback: null }
  ),
  
  updateProfile: (data) => {
    if (shouldUseMock()) {
      log.info('Mock 更新个人信息')
      return Promise.resolve({ success: true })
    }
    return request.put('/user/profile', data)
  },
  
  getSopList: createApiCall(
    () => request.get('/settings/sop'),
    () => [],
    { fallback: [] }
  ),
  
  createSop: (data) => {
    if (shouldUseMock()) {
      return Promise.resolve({ id: `sop_${Date.now()}`, ...data })
    }
    return request.post('/settings/sop', data)
  },
  
  updateSop: (id, data) => {
    if (shouldUseMock()) {
      return Promise.resolve({ success: true })
    }
    return request.put(`/settings/sop/${id}`, data)
  },
  
  deleteSop: (id) => {
    if (shouldUseMock()) {
      return Promise.resolve({ success: true })
    }
    return request.delete(`/settings/sop/${id}`)
  },
  
  importSop: (formData) => {
    if (shouldUseMock()) {
      return Promise.resolve({ id: `sop_${Date.now()}`, name: '导入的SOP' })
    }
    return request.post('/settings/sop/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getKnowledgeBase: createApiCall(
    () => request.get('/settings/knowledge-base'),
    () => [],
    { fallback: [] }
  ),
  
  uploadKnowledge: (formData) => {
    if (shouldUseMock()) {
      return Promise.resolve({ id: `kb_${Date.now()}`, name: '上传的文档' })
    }
    return request.post('/settings/knowledge-base/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  deleteKnowledge: (id) => {
    if (shouldUseMock()) {
      return Promise.resolve({ success: true })
    }
    return request.delete(`/settings/knowledge-base/${id}`)
  }
}
