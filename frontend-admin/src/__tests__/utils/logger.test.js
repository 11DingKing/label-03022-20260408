import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createLogger, getAllLogs } from '@/utils/logger'

describe('Logger', () => {
  let logger

  beforeEach(() => {
    logger = createLogger('TestModule')
    logger.clear()
  })

  describe('基本日志功能', () => {
    it('应正确记录 debug 日志', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.debug('调试信息')
      expect(logger.getLogs()).toHaveLength(1)
      expect(logger.getLogs()[0].level).toBe('DEBUG')
      expect(logger.getLogs()[0].message).toBe('调试信息')
      spy.mockRestore()
    })

    it('应正确记录 info 日志', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.info('信息日志')
      expect(logger.getLogs()).toHaveLength(1)
      expect(logger.getLogs()[0].level).toBe('INFO')
      spy.mockRestore()
    })

    it('应正确记录 warn 日志', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logger.warn('警告信息')
      expect(logger.getLogs()).toHaveLength(1)
      expect(logger.getLogs()[0].level).toBe('WARN')
      spy.mockRestore()
    })

    it('应正确记录 error 日志', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.error('错误信息')
      expect(logger.getLogs()).toHaveLength(1)
      expect(logger.getLogs()[0].level).toBe('ERROR')
      spy.mockRestore()
    })
  })

  describe('日志条目格式', () => {
    it('应包含时间戳', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.info('测试')
      const entry = logger.getLogs()[0]
      expect(entry.timestamp).toBeDefined()
      expect(new Date(entry.timestamp).getTime()).not.toBeNaN()
      spy.mockRestore()
    })

    it('应包含模块名', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.info('测试')
      expect(logger.getLogs()[0].module).toBe('TestModule')
      spy.mockRestore()
    })

    it('应支持附加数据', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.info('测试', { key: 'value' })
      expect(logger.getLogs()[0].data).toEqual({ key: 'value' })
      spy.mockRestore()
    })
  })

  describe('action 审计日志', () => {
    it('应记录操作审计日志', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.action('删除视频', { videoId: 'v001' })
      const entry = logger.getLogs()[0]
      expect(entry.message).toContain('[ACTION]')
      expect(entry.message).toContain('删除视频')
      expect(entry.data).toEqual({ videoId: 'v001' })
      spy.mockRestore()
    })
  })

  describe('日志管理', () => {
    it('clear 应清空日志', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.info('日志1')
      logger.info('日志2')
      expect(logger.getLogs()).toHaveLength(2)
      logger.clear()
      expect(logger.getLogs()).toHaveLength(0)
      spy.mockRestore()
    })

    it('getLogs 应返回副本', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.info('测试')
      const logs = logger.getLogs()
      logs.push({ fake: true })
      expect(logger.getLogs()).toHaveLength(1)
      spy.mockRestore()
    })
  })

  describe('createLogger 工厂', () => {
    it('相同模块名应返回同一实例', () => {
      const logger1 = createLogger('SameModule')
      const logger2 = createLogger('SameModule')
      expect(logger1).toBe(logger2)
    })

    it('不同模块名应返回不同实例', () => {
      const logger1 = createLogger('Module1')
      const logger2 = createLogger('Module2')
      expect(logger1).not.toBe(logger2)
    })
  })

  describe('getAllLogs 全局收集', () => {
    it('应收集所有模块的日志', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const loggerA = createLogger('ModuleA')
      const loggerB = createLogger('ModuleB')
      loggerA.clear()
      loggerB.clear()
      loggerA.info('来自A')
      loggerB.info('来自B')
      const all = getAllLogs()
      const modules = all.map(l => l.module)
      expect(modules).toContain('ModuleA')
      expect(modules).toContain('ModuleB')
      spy.mockRestore()
    })
  })

  describe('日志级别', () => {
    it('debug级别应正确标记', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.debug('调试')
      expect(logger.getLogs()[0].level).toBe('DEBUG')
      spy.mockRestore()
    })

    it('info级别应正确标记', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.info('信息')
      expect(logger.getLogs()[0].level).toBe('INFO')
      spy.mockRestore()
    })

    it('warn级别应正确标记', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logger.warn('警告')
      expect(logger.getLogs()[0].level).toBe('WARN')
      spy.mockRestore()
    })

    it('error级别应正确标记', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.error('错误')
      expect(logger.getLogs()[0].level).toBe('ERROR')
      spy.mockRestore()
    })
  })

  describe('多条日志', () => {
    it('应按顺序记录多条日志', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      logger.info('第一条')
      logger.warn('第二条')
      logger.error('第三条')
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(3)
      expect(logs[0].message).toBe('第一条')
      expect(logs[1].message).toBe('第二条')
      expect(logs[2].message).toBe('第三条')
      
      logSpy.mockRestore()
      warnSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })
})
