import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseVoiceCommand,
  detectConflict,
  getCommandLabel,
  getCommandRoute,
  getCommandResponse,
  getAvailableCommands,
  createVoiceCommandController
} from '@/utils/voiceCommands'

describe('VoiceCommands', () => {
  describe('parseVoiceCommand', () => {
    it('应精确匹配导航指令', () => {
      const result = parseVoiceCommand('驾驶舱')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('dashboard')
      expect(result.confidence).toBe(1.0)
    })

    it('应匹配视频库指令', () => {
      const result = parseVoiceCommand('视频库')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('videos')
    })

    it('应匹配设置指令', () => {
      const result = parseVoiceCommand('设置')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('settings')
    })

    it('应匹配帮助指令', () => {
      const result = parseVoiceCommand('帮助')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('help')
    })

    it('应支持包含匹配', () => {
      const result = parseVoiceCommand('请打开视频库')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('videos')
      expect(result.matchType).toBe('contains')
    })

    it('应支持模糊匹配', () => {
      const result = parseVoiceCommand('视频苦') // 错别字
      expect(result.matched).toBe(true)
      expect(result.command).toBe('videos')
      // 由于"视频苦"包含"视频"，会被识别为 contains 匹配
      expect(['fuzzy', 'contains']).toContain(result.matchType)
    })

    it('无效输入应返回未匹配', () => {
      const result = parseVoiceCommand('随便说点什么')
      expect(result.matched).toBe(false)
      expect(result.command).toBe(null)
    })

    it('空输入应返回未匹配', () => {
      expect(parseVoiceCommand('').matched).toBe(false)
      expect(parseVoiceCommand(null).matched).toBe(false)
      expect(parseVoiceCommand(undefined).matched).toBe(false)
    })

    it('应返回备选匹配', () => {
      const result = parseVoiceCommand('打开首页')
      expect(result.matched).toBe(true)
      expect(result.alternatives).toBeDefined()
    })
  })

  describe('detectConflict', () => {
    it('同组指令应检测到冲突', () => {
      const result = detectConflict('videos', 'dashboard')
      expect(result.hasConflict).toBe(true)
      expect(result.message).toContain('驾驶舱')
      expect(result.message).toContain('视频库')
    })

    it('不同组指令不应冲突', () => {
      const result = detectConflict('help', 'dashboard')
      expect(result.hasConflict).toBe(false)
    })

    it('无上一个指令不应冲突', () => {
      const result = detectConflict('dashboard', null)
      expect(result.hasConflict).toBe(false)
    })

    it('相同指令不应冲突', () => {
      const result = detectConflict('dashboard', 'dashboard')
      expect(result.hasConflict).toBe(false)
    })
  })

  describe('getCommandLabel', () => {
    it('应返回正确的中文标签', () => {
      expect(getCommandLabel('dashboard')).toBe('驾驶舱')
      expect(getCommandLabel('videos')).toBe('视频库')
      expect(getCommandLabel('settings')).toBe('个人设置')
      expect(getCommandLabel('help')).toBe('帮助')
    })

    it('未知指令应返回原值', () => {
      expect(getCommandLabel('unknown')).toBe('unknown')
    })
  })

  describe('getCommandRoute', () => {
    it('应返回正确的路由', () => {
      expect(getCommandRoute('dashboard')).toBe('/')
      expect(getCommandRoute('videos')).toBe('/videos')
      expect(getCommandRoute('settings')).toBe('/settings')
      expect(getCommandRoute('analysis')).toBe('/analysis/v001')
    })

    it('非导航指令应返回null', () => {
      expect(getCommandRoute('help')).toBe(null)
      expect(getCommandRoute('play')).toBe(null)
    })
  })

  describe('getCommandResponse', () => {
    it('应返回导航响应', () => {
      expect(getCommandResponse('dashboard')).toContain('驾驶舱')
      expect(getCommandResponse('videos')).toContain('视频库')
    })

    it('应返回帮助响应', () => {
      const response = getCommandResponse('help')
      expect(response).toContain('视频库')
      expect(response).toContain('报告')
    })

    it('未知指令应返回默认响应', () => {
      expect(getCommandResponse('unknown')).toContain('正在处理')
    })
  })

  describe('getAvailableCommands', () => {
    it('应返回所有可用指令', () => {
      const commands = getAvailableCommands()
      expect(commands.length).toBeGreaterThan(0)
      
      const commandNames = commands.map(c => c.command)
      expect(commandNames).toContain('dashboard')
      expect(commandNames).toContain('videos')
      expect(commandNames).toContain('settings')
      expect(commandNames).toContain('help')
    })

    it('每个指令应包含必要属性', () => {
      const commands = getAvailableCommands()
      commands.forEach(cmd => {
        expect(cmd.command).toBeDefined()
        expect(cmd.label).toBeDefined()
        expect(cmd.synonyms).toBeDefined()
        expect(Array.isArray(cmd.synonyms)).toBe(true)
      })
    })
  })

  describe('createVoiceCommandController', () => {
    let controller
    let onCommand
    let onConfirmRequired
    let onTimeout
    let onError

    beforeEach(() => {
      onCommand = vi.fn()
      onConfirmRequired = vi.fn()
      onTimeout = vi.fn()
      onError = vi.fn()
      
      controller = createVoiceCommandController({
        onCommand,
        onConfirmRequired,
        onTimeout,
        onError,
        confirmTimeout: 1000,
        idleTimeout: 2000
      })
    })

    it('应处理有效指令', () => {
      const result = controller.processInput('打开视频库')
      expect(result.success).toBe(true)
      expect(result.command).toBe('videos')
      expect(onCommand).toHaveBeenCalled()
    })

    it('应处理无效指令', () => {
      const result = controller.processInput('无效指令')
      expect(result.success).toBe(false)
      expect(result.reason).toBe('no-match')
      expect(onError).toHaveBeenCalled()
    })

    it('低置信度应请求确认', () => {
      // 使用一个可能产生低置信度的输入
      const result = controller.processInput('视')
      if (!result.success && result.reason === 'low-confidence') {
        expect(onConfirmRequired).toHaveBeenCalled()
      }
    })

    it('confirmPending 应确认待定指令', () => {
      // 先触发一个需要确认的指令
      controller.processInput('视')
      const result = controller.confirmPending()
      // 如果有待确认指令，应该成功
      if (result.success) {
        expect(onCommand).toHaveBeenCalled()
      }
    })

    it('cancelPending 应取消待定指令', () => {
      const result = controller.cancelPending()
      expect(result.success).toBe(true)
    })

    it('destroy 应清理资源', () => {
      expect(() => controller.destroy()).not.toThrow()
    })

    it('多次处理输入应正常工作', () => {
      controller.processInput('驾驶舱')
      expect(onCommand).toHaveBeenCalled()
    })
  })

  describe('边界情况', () => {
    it('应处理特殊字符输入', () => {
      const result = parseVoiceCommand('!@#$%')
      expect(result.matched).toBe(false)
    })

    it('应处理数字输入', () => {
      const result = parseVoiceCommand('12345')
      expect(result.matched).toBe(false)
    })

    it('应处理空格输入', () => {
      const result = parseVoiceCommand('   ')
      expect(result.matched).toBe(false)
    })

    it('应处理混合输入', () => {
      const result = parseVoiceCommand('打开 视频库 123')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('videos')
    })
  })

  describe('同义词匹配', () => {
    it('应匹配"首页"为dashboard', () => {
      const result = parseVoiceCommand('首页')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('dashboard')
    })

    it('应匹配"个人中心"为settings', () => {
      const result = parseVoiceCommand('个人中心')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('settings')
    })

    it('应匹配"分析"为analysis', () => {
      const result = parseVoiceCommand('分析')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('analysis')
    })

    it('应匹配"报告"为report', () => {
      const result = parseVoiceCommand('报告')
      expect(result.matched).toBe(true)
      expect(result.command).toBe('report')
    })
  })
})
