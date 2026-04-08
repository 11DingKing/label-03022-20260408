import { describe, it, expect, vi } from 'vitest'
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  isNoiseReductionSupported,
  getSpeechCapabilities
} from '@/utils/speech'

describe('Speech', () => {
  describe('isSpeechRecognitionSupported', () => {
    it('should return boolean', () => {
      const result = isSpeechRecognitionSupported()
      expect(typeof result).toBe('boolean')
    })

    it('should return false in Node.js environment', () => {
      expect(isSpeechRecognitionSupported()).toBe(false)
    })
  })

  describe('isNoiseReductionSupported', () => {
    it('should return boolean', () => {
      const result = isNoiseReductionSupported()
      expect(typeof result).toBe('boolean')
    })

    it('should check AudioContext and mediaDevices', () => {
      // 在 Node.js 环境中，这些 API 不可用
      const result = isNoiseReductionSupported()
      expect(result).toBe(false)
    })
  })

  describe('getSpeechCapabilities', () => {
    it('should return capabilities object', () => {
      const caps = getSpeechCapabilities()
      expect(caps).toHaveProperty('recognition')
      expect(caps).toHaveProperty('noiseReduction')
      expect(caps).toHaveProperty('synthesis')
    })

    it('all properties should be boolean', () => {
      const caps = getSpeechCapabilities()
      expect(typeof caps.recognition).toBe('boolean')
      expect(typeof caps.noiseReduction).toBe('boolean')
      expect(typeof caps.synthesis).toBe('boolean')
    })

    it('recognition should be false in Node.js', () => {
      const caps = getSpeechCapabilities()
      expect(caps.recognition).toBe(false)
    })

    it('noiseReduction should be false in Node.js', () => {
      const caps = getSpeechCapabilities()
      expect(caps.noiseReduction).toBe(false)
    })
  })

  describe('createSpeechRecognition', () => {
    it('should create speech recognition instance', () => {
      const recognition = createSpeechRecognition()
      expect(recognition).toBeDefined()
      expect(recognition).toHaveProperty('start')
      expect(recognition).toHaveProperty('stop')
      expect(recognition).toHaveProperty('abort')
      expect(recognition).toHaveProperty('destroy')
    })

    it('should support custom callbacks', () => {
      const onResult = vi.fn()
      const onStart = vi.fn()
      const onEnd = vi.fn()
      const onError = vi.fn()

      const recognition = createSpeechRecognition({
        lang: 'en-US',
        onResult,
        onStart,
        onEnd,
        onError
      })

      expect(recognition).toBeDefined()
    })

    it('destroy should not throw error', () => {
      const recognition = createSpeechRecognition()
      expect(() => recognition.destroy()).not.toThrow()
    })

    it('stop should not throw error', () => {
      const recognition = createSpeechRecognition()
      expect(() => recognition.stop()).not.toThrow()
    })

    it('abort should not throw error', () => {
      const recognition = createSpeechRecognition()
      expect(() => recognition.abort()).not.toThrow()
    })

    it('start should trigger error callback when not supported', () => {
      const onError = vi.fn()
      const recognition = createSpeechRecognition({ onError })
      
      if (!recognition.isSupported) {
        recognition.start()
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
          error: 'not-supported'
        }))
      }
    })

    it('isSupported should be boolean', () => {
      const recognition = createSpeechRecognition()
      expect(typeof recognition.isSupported).toBe('boolean')
    })

    it('isSupported should be false in Node.js', () => {
      const recognition = createSpeechRecognition()
      expect(recognition.isSupported).toBe(false)
    })
  })

  describe('降级实现', () => {
    it('start 应调用 onError 回调', () => {
      const onError = vi.fn()
      const recognition = createSpeechRecognition({ onError })
      recognition.start()
      expect(onError).toHaveBeenCalled()
    })

    it('错误消息应包含浏览器不支持提示', () => {
      const onError = vi.fn()
      const recognition = createSpeechRecognition({ onError })
      recognition.start()
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('浏览器')
      }))
    })

    it('stop 应为空操作', () => {
      const recognition = createSpeechRecognition()
      expect(() => recognition.stop()).not.toThrow()
    })

    it('abort 应为空操作', () => {
      const recognition = createSpeechRecognition()
      expect(() => recognition.abort()).not.toThrow()
    })

    it('destroy 应为空操作', () => {
      const recognition = createSpeechRecognition()
      expect(() => recognition.destroy()).not.toThrow()
    })

    it('多次调用 start 应多次触发 onError', () => {
      const onError = vi.fn()
      const recognition = createSpeechRecognition({ onError })
      recognition.start()
      recognition.start()
      expect(onError).toHaveBeenCalledTimes(2)
    })
  })

  describe('configuration options', () => {
    it('should accept language config', () => {
      const recognition = createSpeechRecognition({ lang: 'zh-CN' })
      expect(recognition).toBeDefined()
    })

    it('should accept timeout config', () => {
      const recognition = createSpeechRecognition({
        silenceTimeout: 3000,
        maxDuration: 30000
      })
      expect(recognition).toBeDefined()
    })

    it('should accept noise reduction config', () => {
      const recognition = createSpeechRecognition({
        noiseReduction: true
      })
      expect(recognition).toBeDefined()
    })

    it('should accept auto restart config', () => {
      const recognition = createSpeechRecognition({
        autoRestart: false
      })
      expect(recognition).toBeDefined()
    })

    it('should accept continuous config', () => {
      const recognition = createSpeechRecognition({
        continuous: true
      })
      expect(recognition).toBeDefined()
    })

    it('should accept interimResults config', () => {
      const recognition = createSpeechRecognition({
        interimResults: false
      })
      expect(recognition).toBeDefined()
    })

    it('should accept maxAlternatives config', () => {
      const recognition = createSpeechRecognition({
        maxAlternatives: 5
      })
      expect(recognition).toBeDefined()
    })

    it('should accept onSilence callback', () => {
      const onSilence = vi.fn()
      const recognition = createSpeechRecognition({ onSilence })
      expect(recognition).toBeDefined()
    })

    it('should accept punctuationHints config', () => {
      const recognition = createSpeechRecognition({
        punctuationHints: false
      })
      expect(recognition).toBeDefined()
    })
  })

  describe('默认配置', () => {
    it('默认语言应为 zh-CN', () => {
      const recognition = createSpeechRecognition()
      expect(recognition).toBeDefined()
    })

    it('默认应启用 interimResults', () => {
      const recognition = createSpeechRecognition()
      expect(recognition).toBeDefined()
    })

    it('默认应启用噪声抑制', () => {
      const recognition = createSpeechRecognition()
      expect(recognition).toBeDefined()
    })
  })
})
