/**
 * HTTP 请求模块
 * 
 * 基于 Axios 封装的请求工具，提供：
 * - 统一的请求/响应拦截
 * - 自动重试机制
 * - Mock 数据支持（开发环境）
 * - 请求取消功能
 * 
 * @module api/request
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import { createLogger } from '@/utils/logger'

const log = createLogger('API')

/**
 * API 配置对象
 * 
 * Mock 模式说明：
 * - 当前版本为纯前端演示应用，默认启用 Mock 数据
 * - 生产环境接入后端时，设置环境变量 VITE_USE_MOCK=false 关闭 Mock
 * - Mock 数据仅用于功能演示，不代表真实业务数据
 * 
 * @constant {Object}
 */
const API_CONFIG = {
  /** API 基础路径 */
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  /** 请求超时时间（毫秒） */
  timeout: 30000,
  /** 失败重试次数 */
  retryCount: 3,
  /** 重试间隔（毫秒） */
  retryDelay: 1000,
  /** 
   * 是否使用 Mock 数据
   * ⚠️ 注意：当前为演示模式，所有 API 调用将返回模拟数据
   * 设置环境变量 VITE_USE_MOCK=false 可切换到真实 API
   */
  useMock: import.meta.env.VITE_USE_MOCK !== 'false'
}

const service = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 添加请求 ID 用于追踪
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    log.info('发起请求', { url: config.url, method: config.method })
    return config
  },
  error => {
    log.error('请求配置错误', { error: error.message })
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const { code, data, message } = response.data
    if (code === 200 || code === 0 || !code) {
      log.info('请求成功', { url: response.config.url })
      return data !== undefined ? data : response.data
    }
    log.warn('业务错误', { url: response.config.url, code, message })
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message))
  },
  error => {
    const msg = error.response?.data?.message || error.message || '网络异常'
    log.error('请求失败', { url: error.config?.url, status: error.response?.status, message: msg })
    
    // 不重复显示取消请求的错误
    if (!axios.isCancel(error)) {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  }
)

/**
 * 带重试的请求
 * @param {Object} config axios 配置
 * @param {number} retries 重试次数
 */
export async function requestWithRetry(config, retries = API_CONFIG.retryCount) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await service(config)
    } catch (error) {
      if (i === retries) throw error
      
      // 只对网络错误和 5xx 错误重试
      const shouldRetry = !error.response || error.response.status >= 500
      if (!shouldRetry) throw error
      
      log.warn(`请求失败，${API_CONFIG.retryDelay}ms 后重试 (${i + 1}/${retries})`, { url: config.url })
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (i + 1)))
    }
  }
}

/**
 * 检查是否使用 Mock 数据
 * 
 * ⚠️ Mock 模式提示：
 * 当返回 true 时，API 调用将返回模拟数据而非真实后端响应。
 * 这是为了支持纯前端演示，无需部署后端服务。
 * 
 * @returns {boolean} 是否启用 Mock 模式
 */
export function shouldUseMock() {
  return API_CONFIG.useMock
}

/**
 * 获取当前 API 模式描述
 * @returns {string} 模式描述文本
 */
export function getApiModeDescription() {
  return API_CONFIG.useMock 
    ? '演示模式（Mock 数据）' 
    : '生产模式（真实 API）'
}

/**
 * 创建带取消功能的请求
 */
export function createCancellableRequest() {
  const controller = new AbortController()
  return {
    signal: controller.signal,
    cancel: () => controller.abort()
  }
}

/**
 * 处理空数据状态
 * @param {any} data 数据
 * @param {any} fallback 默认值
 */
export function handleEmptyData(data, fallback = []) {
  if (data === null || data === undefined) return fallback
  if (Array.isArray(data) && data.length === 0) return fallback
  if (typeof data === 'object' && Object.keys(data).length === 0) return fallback
  return data
}

export default service
