import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { createLogger } from '@/utils/logger'

const log = createLogger('VideoStore')

// 默认视频数据（单个演示视频，与分析页内容一致）
const generateMockVideos = () => {
  return [{
    id: 'v001',
    name: '华东工厂A车间日常巡检记录',
    thumbnail: '',
    // Mixkit 免费工厂视频（食品工厂工人操作画面）
    url: 'https://assets.mixkit.co/videos/21795/21795-720.mp4',
    status: 'completed',
    hasAIAnalysis: true,
    createdAt: new Date(2026, 1, 14).toISOString(),
    analyzedAt: new Date(2026, 1, 15).toISOString(),
    tags: ['安全巡检', '生产流程'],
    duration: 15,
    size: 158
  }]
}

/**
 * 从 localStorage 加载数据
 */
function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (e) {
    log.warn('加载存储数据失败', { key, error: e.message })
    return defaultValue
  }
}

/**
 * 保存数据到 localStorage
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    log.warn('保存存储数据失败', { key, error: e.message })
  }
}

export const useVideoStore = defineStore('video', () => {
  // 清除旧版缓存：多视频 或 包含已弃用的占位视频链接
  const storedVideos = loadFromStorage('video_list', null)
  if (storedVideos && (storedVideos.length > 1 || storedVideos.some(v => v.url?.includes('googleapis.com')))) {
    saveToStorage('video_list', null)
  }
  const videos = ref(loadFromStorage('video_list', null) || generateMockVideos())
  const loading = ref(false)
  const currentVideo = ref(null)
  const viewMode = ref(loadFromStorage('video_viewMode', 'grid')) // 'grid' | 'list'
  const filters = ref(loadFromStorage('video_filters', {
    keyword: '',
    status: '',
    dateRange: [],
    tags: []
  }))

  // 监听变化并持久化
  watch(videos, (val) => saveToStorage('video_list', val), { deep: true })
  watch(viewMode, (val) => saveToStorage('video_viewMode', val))
  watch(filters, (val) => saveToStorage('video_filters', val), { deep: true })

  const filteredVideos = computed(() => {
    return videos.value.filter(v => {
      if (filters.value.keyword && !v.name.includes(filters.value.keyword) && !v.tags.some(t => t.includes(filters.value.keyword))) return false
      if (filters.value.status === 'completed' && !v.hasAIAnalysis) return false
      if (filters.value.status === 'pending' && v.hasAIAnalysis) return false
      if (filters.value.tags.length && !filters.value.tags.some(t => v.tags.includes(t))) return false
      if (filters.value.dateRange?.length === 2) {
        const d = new Date(v.createdAt)
        if (d < filters.value.dateRange[0] || d > filters.value.dateRange[1]) return false
      }
      return true
    })
  })

  const allTags = computed(() => {
    const set = new Set()
    videos.value.forEach(v => v.tags.forEach(t => set.add(t)))
    return [...set]
  })

  const stats = computed(() => ({
    total: videos.value.length,
    analyzed: videos.value.filter(v => v.hasAIAnalysis).length,
    pending: videos.value.filter(v => !v.hasAIAnalysis).length
  }))

  function setCurrentVideo(id) {
    currentVideo.value = videos.value.find(v => v.id === id) || null
    log.info('设置当前视频', { id, found: !!currentVideo.value })
  }

  function updateVideoTags(id, tags) {
    const v = videos.value.find(v => v.id === id)
    if (v) {
      const oldTags = [...v.tags]
      v.tags = tags
      log.action('更新视频标签', { id, oldTags, newTags: tags })
    } else {
      log.warn('更新标签失败：视频不存在', { id })
    }
  }

  function addVideo(fileInfo) {
    const newId = `v${String(videos.value.length + 1).padStart(3, '0')}`
    const newVideo = {
      id: newId,
      name: fileInfo.name || '未命名视频',
      thumbnail: fileInfo.thumbnail || '',
      url: fileInfo.url || '',
      status: 'pending',
      hasAIAnalysis: false,
      createdAt: new Date().toISOString(),
      analyzedAt: null,
      tags: fileInfo.tags || [],
      duration: fileInfo.duration || 0,
      size: fileInfo.size || 0
    }
    videos.value.unshift(newVideo)
    log.action('添加新视频', { id: newId, name: newVideo.name, size: newVideo.size })
    return newVideo
  }

  // 更新视频缩略图
  function updateVideoThumbnail(id, thumbnail) {
    const v = videos.value.find(v => v.id === id)
    if (v) {
      v.thumbnail = thumbnail
      log.info('更新视频缩略图', { id })
    }
  }

  return { videos, loading, currentVideo, viewMode, filters, filteredVideos, allTags, stats, setCurrentVideo, updateVideoTags, addVideo, updateVideoThumbnail }
})
