# 错误处理文档

## 概述

本文档描述视频分析AI应用的错误处理策略、实现方式和最佳实践。

## 错误处理架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层                              │
│  • ElMessage 提示                                           │
│  • 空状态展示                                               │
│  • 加载状态指示                                             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层 (Store)                      │
│  • 状态回滚                                                 │
│  • 错误日志记录                                             │
│  • 默认值处理                                               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API 层 (Axios)                         │
│  • 请求拦截器                                               │
│  • 响应拦截器                                               │
│  • 自动重试机制                                             │
│  • Mock 数据回退                                            │
└─────────────────────────────────────────────────────────────┘
```

## API 层错误处理

### 请求拦截器
- 自动添加 Authorization Token
- 生成请求追踪 ID (X-Request-ID)
- 记录请求日志

### 响应拦截器
- 统一处理业务错误码
- 自动显示错误提示
- 记录错误日志

### 自动重试机制

```javascript
// request.js 中的重试配置
const API_CONFIG = {
  retryCount: 3,      // 最大重试次数
  retryDelay: 1000    // 重试间隔（毫秒）
}

// 重试条件：
// - 网络错误（无响应）
// - 5xx 服务器错误
// - 不重试 4xx 客户端错误
```

### Mock 数据回退

当 API 调用失败时，系统会自动回退到 Mock 数据：

```javascript
// 创建带 Mock 回退的 API 调用
function createApiCall(apiCall, mockGenerator, options = {}) {
  return async (...args) => {
    if (shouldUseMock()) {
      return mockGenerator(...args)
    }
    try {
      return await apiCall(...args)
    } catch (error) {
      log.warn('API 调用失败，使用 Mock 数据')
      if (options.fallbackToMock !== false) {
        return mockGenerator(...args)
      }
      throw error
    }
  }
}
```

## 错误类型与处理策略

| 错误类型 | HTTP状态码 | 处理策略 |
|----------|------------|----------|
| 网络错误 | - | 重试3次，显示"网络异常"提示 |
| 认证失败 | 401 | 清除Token，跳转登录页 |
| 权限不足 | 403 | 显示"禁止访问"提示 |
| 资源不存在 | 404 | 显示空状态或404页面 |
| 参数错误 | 400 | 显示具体错误信息 |
| 服务器错误 | 5xx | 重试，失败后回退Mock |

## 用户界面错误展示

### ElMessage 提示
```javascript
// 错误提示
ElMessage.error('请求失败，请稍后重试')

// 警告提示
ElMessage.warning('当前浏览器不支持语音识别')

// 信息提示
ElMessage.info('语音识别已启动')
```

### 空状态处理
```javascript
// handleEmptyData 工具函数
export function handleEmptyData(data, fallback = []) {
  if (data === null || data === undefined) return fallback
  if (Array.isArray(data) && data.length === 0) return fallback
  return data
}
```

## 语音识别错误处理

```javascript
const errorMessages = {
  'no-speech': '未检测到语音，请重试',
  'audio-capture': '无法访问麦克风，请检查权限',
  'not-allowed': '麦克风权限被拒绝',
  'network': '网络错误，请检查网络连接',
  'aborted': '语音识别已取消',
  'language-not-supported': '不支持当前语言',
  'service-not-allowed': '语音服务不可用'
}
```

## 日志记录

使用统一的 Logger 工具记录错误：

```javascript
import { createLogger } from '@/utils/logger'
const log = createLogger('ModuleName')

log.error('错误描述', { context: 'data' })
log.warn('警告描述', { context: 'data' })
log.info('信息描述', { context: 'data' })
```

## 最佳实践

1. 始终使用 try-catch 包裹异步操作
2. 提供有意义的错误提示信息
3. 记录错误日志便于排查
4. 设计合理的降级策略
5. 避免向用户暴露技术细节
