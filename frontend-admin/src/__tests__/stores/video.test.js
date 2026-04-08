import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVideoStore } from '@/stores/video'

describe('VideoStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useVideoStore()
  })

  describe('初始化', () => {
    it('应生成模拟视频数据', () => {
      expect(store.videos.length).toBeGreaterThanOrEqual(1)
    })

    it('每条视频应包含完整字段', () => {
      const video = store.videos[0]
      expect(video).toHaveProperty('id')
      expect(video).toHaveProperty('name')
      expect(video).toHaveProperty('status')
      expect(video).toHaveProperty('tags')
      expect(video).toHaveProperty('duration')
      expect(video).toHaveProperty('size')
      expect(video).toHaveProperty('createdAt')
      expect(video).toHaveProperty('hasAIAnalysis')
    })

    it('视频ID格式应正确', () => {
      store.videos.forEach(v => {
        expect(v.id).toMatch(/^v\d{3}/)
      })
    })

    it('视频状态应为有效值', () => {
      const validStatuses = ['completed', 'pending', 'analyzing']
      store.videos.forEach(v => {
        expect(validStatuses).toContain(v.status)
      })
    })

    it('hasAIAnalysis 应与 completed 状态一致', () => {
      store.videos.forEach(v => {
        if (v.status === 'completed') {
          expect(v.hasAIAnalysis).toBe(true)
        } else {
          expect(v.hasAIAnalysis).toBe(false)
        }
      })
    })

    it('每个视频应有标签', () => {
      store.videos.forEach(v => {
        expect(v.tags.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('视频时长应在合理范围内', () => {
      store.videos.forEach(v => {
        expect(v.duration).toBeGreaterThanOrEqual(0)
      })
    })

    it('视频大小应在合理范围内', () => {
      store.videos.forEach(v => {
        expect(v.size).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('stats 计算属性', () => {
    it('total 应等于视频总数', () => {
      expect(store.stats.total).toBe(store.videos.length)
    })

    it('analyzed + pending 应等于 total', () => {
      expect(store.stats.analyzed + store.stats.pending).toBe(store.stats.total)
    })

    it('analyzed 应等于 hasAIAnalysis 为 true 的数量', () => {
      const count = store.videos.filter(v => v.hasAIAnalysis).length
      expect(store.stats.analyzed).toBe(count)
    })
  })

  describe('allTags 计算属性', () => {
    it('应返回去重后的标签列表', () => {
      const tags = store.allTags
      const unique = new Set(tags)
      expect(tags.length).toBe(unique.size)
    })

    it('应包含所有视频中出现的标签', () => {
      const allTagsFromVideos = new Set()
      store.videos.forEach(v => v.tags.forEach(t => allTagsFromVideos.add(t)))
      expect(store.allTags.length).toBe(allTagsFromVideos.size)
    })
  })

  describe('filteredVideos 筛选', () => {
    it('无筛选条件时应返回全部视频', () => {
      expect(store.filteredVideos).toHaveLength(store.videos.length)
    })

    it('按关键词筛选视频名称', () => {
      store.filters.keyword = '巡检'
      const result = store.filteredVideos
      result.forEach(v => {
        const matchName = v.name.includes('巡检')
        const matchTag = v.tags.some(t => t.includes('巡检'))
        expect(matchName || matchTag).toBe(true)
      })
    })

    it('按关键词筛选标签', () => {
      const firstVideo = store.videos[0]
      const tagToSearch = firstVideo.tags[0]
      store.filters.keyword = tagToSearch
      const result = store.filteredVideos
      expect(result.length).toBeGreaterThan(0)
      result.forEach(v => {
        const matchName = v.name.includes(tagToSearch)
        const matchTag = v.tags.some(t => t.includes(tagToSearch))
        expect(matchName || matchTag).toBe(true)
      })
    })

    it('按 completed 状态筛选', () => {
      store.filters.status = 'completed'
      store.filteredVideos.forEach(v => {
        expect(v.hasAIAnalysis).toBe(true)
      })
    })

    it('按 pending 状态筛选', () => {
      store.filters.status = 'pending'
      store.filteredVideos.forEach(v => {
        expect(v.hasAIAnalysis).toBe(false)
      })
    })

    it('按标签筛选', () => {
      store.filters.tags = ['安全培训']
      store.filteredVideos.forEach(v => {
        expect(v.tags).toContain('安全培训')
      })
    })

    it('按多个标签筛选（OR逻辑）', () => {
      store.filters.tags = ['安全培训', '设备检查']
      store.filteredVideos.forEach(v => {
        const hasMatch = v.tags.includes('安全培训') || v.tags.includes('设备检查')
        expect(hasMatch).toBe(true)
      })
    })

    it('按日期范围筛选', () => {
      const start = new Date(2026, 1, 1)
      const end = new Date(2026, 1, 10)
      store.filters.dateRange = [start, end]
      store.filteredVideos.forEach(v => {
        const d = new Date(v.createdAt)
        expect(d >= start && d <= end).toBe(true)
      })
    })

    it('不匹配的关键词应返回空数组', () => {
      store.filters.keyword = '不存在的关键词xyz'
      expect(store.filteredVideos).toHaveLength(0)
    })

    it('组合筛选应同时生效', () => {
      store.filters.status = 'completed'
      store.filters.keyword = '巡检'
      store.filteredVideos.forEach(v => {
        expect(v.hasAIAnalysis).toBe(true)
        const matchName = v.name.includes('巡检')
        const matchTag = v.tags.some(t => t.includes('巡检'))
        expect(matchName || matchTag).toBe(true)
      })
    })
  })

  describe('setCurrentVideo', () => {
    it('应正确设置当前视频', () => {
      store.setCurrentVideo('v001')
      expect(store.currentVideo).not.toBeNull()
      expect(store.currentVideo.id).toBe('v001')
    })

    it('不存在的ID应设置为null', () => {
      store.setCurrentVideo('nonexistent')
      expect(store.currentVideo).toBeNull()
    })

    it('空ID应设置为null', () => {
      store.setCurrentVideo('')
      expect(store.currentVideo).toBeNull()
    })
  })

  describe('updateVideoTags', () => {
    it('应正确更新视频标签', () => {
      const newTags = ['新标签1', '新标签2']
      store.updateVideoTags('v001', newTags)
      const video = store.videos.find(v => v.id === 'v001')
      expect(video.tags).toEqual(newTags)
    })

    it('不存在的视频ID不应报错', () => {
      expect(() => store.updateVideoTags('nonexistent', ['tag'])).not.toThrow()
    })

    it('更新标签后 allTags 应同步更新', () => {
      store.updateVideoTags('v001', ['全新标签'])
      expect(store.allTags).toContain('全新标签')
    })
  })

  describe('viewMode', () => {
    it('默认应为 grid', () => {
      expect(store.viewMode).toBe('grid')
    })

    it('应可切换为 list', () => {
      store.viewMode = 'list'
      expect(store.viewMode).toBe('list')
    })
  })

  describe('addVideo', () => {
    it('应正确添加新视频', () => {
      const initialCount = store.videos.length
      const newVideo = store.addVideo({
        name: '测试视频',
        size: 100,
        duration: 300,
        tags: ['测试']
      })
      expect(store.videos.length).toBe(initialCount + 1)
      expect(newVideo.name).toBe('测试视频')
      expect(newVideo.status).toBe('pending')
      expect(newVideo.hasAIAnalysis).toBe(false)
    })

    it('新视频应添加到列表开头', () => {
      store.addVideo({ name: '最新视频' })
      expect(store.videos[0].name).toBe('最新视频')
    })

    it('应生成唯一ID', () => {
      const v1 = store.addVideo({ name: '视频1' })
      const v2 = store.addVideo({ name: '视频2' })
      expect(v1.id).not.toBe(v2.id)
    })

    it('应处理空参数', () => {
      const newVideo = store.addVideo({})
      expect(newVideo.name).toBe('未命名视频')
      expect(newVideo.tags).toEqual([])
    })

    it('应设置正确的创建时间', () => {
      const newVideo = store.addVideo({ name: '时间测试' })
      expect(newVideo.createdAt).toBeDefined()
      expect(new Date(newVideo.createdAt).getTime()).not.toBeNaN()
    })
  })

  describe('updateVideoThumbnail', () => {
    it('应正确更新缩略图', () => {
      store.updateVideoThumbnail('v001', 'data:image/jpeg;base64,test')
      const video = store.videos.find(v => v.id === 'v001')
      expect(video.thumbnail).toBe('data:image/jpeg;base64,test')
    })

    it('不存在的视频ID不应报错', () => {
      expect(() => store.updateVideoThumbnail('nonexistent', 'test')).not.toThrow()
    })
  })
})
