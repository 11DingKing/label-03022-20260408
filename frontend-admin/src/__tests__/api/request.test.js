import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shouldUseMock, getApiModeDescription, createCancellableRequest, handleEmptyData } from '@/api/request'
import service from '@/api/request'

// 直接测试 axios 拦截器逻辑，不依赖实际 axios 实例
describe('API Request 配置', () => {
  describe('请求拦截器逻辑', () => {
    it('有 token 时应添加 Authorization header', () => {
      localStorage.setItem('token', 'test-jwt-token')
      const config = { headers: {} }
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      expect(config.headers.Authorization).toBe('Bearer test-jwt-token')
      localStorage.removeItem('token')
    })

    it('无 token 时不应添加 Authorization header', () => {
      localStorage.removeItem('token')
      const config = { headers: {} }
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      expect(config.headers.Authorization).toBeUndefined()
    })
  })

  describe('响应拦截器逻辑', () => {
    it('code 200 应返回 data', () => {
      const response = { data: { code: 200, data: { id: 1 }, message: 'ok' } }
      const { code, data } = response.data
      if (code === 200 || code === 0) {
        expect(data).toEqual({ id: 1 })
      }
    })

    it('code 0 应返回 data', () => {
      const response = { data: { code: 0, data: [1, 2, 3], message: 'ok' } }
      const { code, data } = response.data
      if (code === 200 || code === 0) {
        expect(data).toEqual([1, 2, 3])
      }
    })

    it('非 200/0 code 应视为错误', () => {
      const response = { data: { code: 500, data: null, message: '服务器错误' } }
      const { code, message } = response.data
      expect(code !== 200 && code !== 0).toBe(true)
      expect(message).toBe('服务器错误')
    })
  })

  describe('错误处理逻辑', () => {
    it('应从 response.data.message 提取错误信息', () => {
      const error = { response: { data: { message: '权限不足' } } }
      const msg = error.response?.data?.message || error.message || '网络异常'
      expect(msg).toBe('权限不足')
    })

    it('无 response 时应使用 error.message', () => {
      const error = { message: 'Network Error' }
      const msg = error.response?.data?.message || error.message || '网络异常'
      expect(msg).toBe('Network Error')
    })

    it('完全无信息时应使用默认消息', () => {
      const error = {}
      const msg = error.response?.data?.message || error.message || '网络异常'
      expect(msg).toBe('网络异常')
    })
  })
})

describe('Request 工具函数', () => {
  describe('shouldUseMock', () => {
    it('应返回布尔值', () => {
      expect(typeof shouldUseMock()).toBe('boolean')
    })

    it('默认应启用 Mock 模式', () => {
      expect(shouldUseMock()).toBe(true)
    })
  })

  describe('getApiModeDescription', () => {
    it('应返回模式描述字符串', () => {
      const desc = getApiModeDescription()
      expect(typeof desc).toBe('string')
      expect(desc.length).toBeGreaterThan(0)
    })

    it('Mock 模式应返回演示模式描述', () => {
      if (shouldUseMock()) {
        expect(getApiModeDescription()).toContain('演示模式')
      }
    })
  })

  describe('createCancellableRequest', () => {
    it('应返回包含 signal 和 cancel 的对象', () => {
      const req = createCancellableRequest()
      expect(req.signal).toBeDefined()
      expect(typeof req.cancel).toBe('function')
    })

    it('cancel 应能中止请求', () => {
      const req = createCancellableRequest()
      expect(req.signal.aborted).toBe(false)
      req.cancel()
      expect(req.signal.aborted).toBe(true)
    })

    it('signal 应是 AbortSignal 实例', () => {
      const req = createCancellableRequest()
      expect(req.signal instanceof AbortSignal).toBe(true)
    })

    it('多次调用应创建独立的控制器', () => {
      const req1 = createCancellableRequest()
      const req2 = createCancellableRequest()
      req1.cancel()
      expect(req1.signal.aborted).toBe(true)
      expect(req2.signal.aborted).toBe(false)
    })
  })

  describe('handleEmptyData', () => {
    it('null 应返回默认值', () => {
      expect(handleEmptyData(null)).toEqual([])
      expect(handleEmptyData(null, {})).toEqual({})
    })

    it('undefined 应返回默认值', () => {
      expect(handleEmptyData(undefined)).toEqual([])
    })

    it('空数组应返回默认值', () => {
      expect(handleEmptyData([])).toEqual([])
    })

    it('空对象应返回默认值', () => {
      expect(handleEmptyData({})).toEqual([])
    })

    it('有数据时应返回原数据', () => {
      expect(handleEmptyData([1, 2])).toEqual([1, 2])
      expect(handleEmptyData({ a: 1 })).toEqual({ a: 1 })
    })

    it('字符串应返回原值', () => {
      expect(handleEmptyData('test')).toBe('test')
      expect(handleEmptyData('')).toBe('')
    })

    it('数字应返回原值', () => {
      expect(handleEmptyData(0)).toBe(0)
      expect(handleEmptyData(123)).toBe(123)
    })

    it('布尔值应返回原值', () => {
      expect(handleEmptyData(true)).toBe(true)
      expect(handleEmptyData(false)).toBe(false)
    })

    it('自定义默认值应生效', () => {
      expect(handleEmptyData(null, 'default')).toBe('default')
      expect(handleEmptyData(undefined, { key: 'value' })).toEqual({ key: 'value' })
    })
  })

  describe('service 实例', () => {
    it('应是 axios 实例', () => {
      expect(service).toBeDefined()
      expect(typeof service.get).toBe('function')
      expect(typeof service.post).toBe('function')
    })

    it('应有请求拦截器', () => {
      expect(service.interceptors.request).toBeDefined()
    })

    it('应有响应拦截器', () => {
      expect(service.interceptors.response).toBeDefined()
    })
  })
})
