# 性能优化文档

## 概述

本文档描述视频分析AI应用采用的性能优化措施和最佳实践。

## 构建优化

### Vite 构建配置

```javascript
// vite.config.js
export default defineConfig({
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### 代码分割策略

| 分块 | 内容 | 大小估算 | 说明 |
|------|------|----------|------|
| vendor | Vue/Router/Pinia | ~80KB | 核心框架，缓存优先 |
| element-plus | UI组件库 | ~200KB | 按需加载 |
| views | 页面组件 | ~50KB | 路由懒加载 |
| utils | 工具函数 | ~10KB | 共享代码 |

## 运行时优化

### 路由懒加载

```javascript
// router/index.js
const routes = [
  {
    path: '/',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/videos',
    component: () => import('@/views/VideoLibrary.vue')
  },
  {
    path: '/analysis/:id',
    component: () => import('@/views/VideoAnalysis.vue')
  },
  {
    path: '/settings',
    component: () => import('@/views/Settings.vue')
  }
]
```

### 组件按需导入

```javascript
// Element Plus 按需导入
import { ElButton, ElInput, ElMessage, ElDialog } from 'element-plus'

// 图标按需导入
import { VideoCamera, Search, Upload } from '@element-plus/icons-vue'
```

### 虚拟滚动

视频库页面使用 CSS Grid 自动布局，配合 `overflow-y: auto` 实现高效滚动。对于超大列表（>1000项），建议使用虚拟滚动库如 `vue-virtual-scroller`。

## 资源优化

### 图片优化

| 策略 | 实现方式 | 效果 |
|------|----------|------|
| 格式优化 | 缩略图使用 WebP/JPEG | 减少 30-50% 体积 |
| 懒加载 | 视口内才加载图片 | 减少初始请求 |
| 尺寸适配 | 根据容器大小生成缩略图 | 避免加载过大图片 |
| 占位符 | 使用 CSS 渐变占位 | 改善加载体验 |

### CSS 优化

```scss
// 使用 CSS Variables 减少重复
:root {
  --color-accent: #00d4ff;
  --color-bg-card: rgba(12, 22, 42, 0.75);
  --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

// SCSS 模块化组织
@use '@/styles/variables' as *;

// 避免深层嵌套选择器（最多3层）
.card {
  &__header { ... }
  &__body { ... }
}
```

### 动画性能

```scss
// 使用 transform 和 opacity 实现动画（GPU加速）
.ai-bot__pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.5; 
  }
  50% { 
    transform: scale(1.5); 
    opacity: 0; 
  }
}

// 避免触发重排的属性
// ❌ 避免: width, height, top, left, margin, padding
// ✅ 推荐: transform, opacity, filter
```

## 网络优化

### 请求优化

| 策略 | 实现 | 说明 |
|------|------|------|
| 请求合并 | 批量获取数据 | 减少 HTTP 请求数 |
| 缓存策略 | Pinia 状态缓存 | 避免重复请求 |
| 请求取消 | AbortController | 取消过期请求 |
| 重试机制 | 指数退避重试 | 提高请求成功率 |
| 请求去重 | 相同请求复用 Promise | 避免并发重复请求 |

### 数据缓存

```javascript
// Store 中的数据缓存
const videoStore = useVideoStore()

// 首次加载后数据缓存在 Store 中
// 避免重复请求
if (!videoStore.videos.length) {
  await videoStore.fetchVideos()
}

// 使用 computed 缓存计算结果
const filteredVideos = computed(() => {
  return videos.filter(v => v.status === 'completed')
})
```

### API 请求配置

```javascript
// request.js 配置
const API_CONFIG = {
  baseURL: '/api',
  timeout: 30000,        // 30秒超时
  retryCount: 3,         // 失败重试3次
  retryDelay: 1000,      // 重试间隔1秒
}
```

## 渲染优化

### Vue 优化技巧

| 技巧 | 场景 | 示例 |
|------|------|------|
| v-show vs v-if | 频繁切换用 v-show | `<div v-show="visible">` |
| 唯一 key | 列表渲染 | `v-for="item in list" :key="item.id"` |
| v-memo | 大列表缓存 | `v-memo="[item.id, item.status]"` |
| computed | 复杂计算 | `computed(() => heavyCalculation())` |
| shallowRef | 大对象 | `shallowRef(largeObject)` |

### 组件优化

```vue
<!-- 使用 defineAsyncComponent 异步加载大组件 -->
<script setup>
import { defineAsyncComponent } from 'vue'

const ReportExporter = defineAsyncComponent(() => 
  import('@/components/ReportExporter.vue')
)
</script>

<!-- 使用 Suspense 处理异步组件 -->
<Suspense>
  <template #default>
    <ReportExporter />
  </template>
  <template #fallback>
    <div>加载中...</div>
  </template>
</Suspense>
```

## 性能指标

### 目标指标

| 指标 | 目标值 | 实际值 | 测量方法 |
|------|--------|--------|----------|
| 首屏加载 (FCP) | < 2s | ~1.5s | Lighthouse |
| 可交互时间 (TTI) | < 3s | ~2s | Lighthouse |
| 页面切换 | < 300ms | ~200ms | Performance API |
| 交互响应 | < 100ms | ~50ms | Performance API |
| 内存占用 | < 100MB | ~60MB | Chrome DevTools |
| 包体积 (gzip) | < 500KB | ~350KB | Build 输出 |

### 监控方式

```javascript
// 使用 Performance API 监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`)
  }
})
observer.observe({ entryTypes: ['measure', 'navigation'] })

// 自定义性能标记
performance.mark('component-mount-start')
// ... 组件挂载
performance.mark('component-mount-end')
performance.measure('component-mount', 'component-mount-start', 'component-mount-end')
```

### 监控工具

- Chrome DevTools Performance 面板
- Lighthouse 评分（目标 > 90）
- Vue DevTools 性能分析
- Web Vitals 指标监控

## 最佳实践清单

### 已实现

- [x] 路由懒加载
- [x] 组件按需导入
- [x] 图片懒加载
- [x] 请求缓存
- [x] 状态管理优化
- [x] CSS 动画使用 transform
- [x] 避免不必要的重渲染
- [x] 使用 CSS Variables
- [x] SCSS 模块化

### 待优化

- [ ] 虚拟滚动（大列表场景）
- [ ] Service Worker 缓存
- [ ] 图片 CDN 加速
- [ ] HTTP/2 推送
- [ ] 预加载关键资源

## 性能调优指南

### 1. 识别性能瓶颈

```bash
# 使用 Lighthouse 分析
npx lighthouse http://localhost:5173 --view

# 使用 webpack-bundle-analyzer 分析包体积
npm run build -- --report
```

### 2. 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 首屏慢 | 包体积大 | 代码分割、懒加载 |
| 滚动卡顿 | 重排重绘 | 使用 transform、虚拟滚动 |
| 内存泄漏 | 未清理监听器 | onUnmounted 清理 |
| 请求慢 | 无缓存 | 添加缓存策略 |

### 3. 持续优化

- 定期运行 Lighthouse 检查
- 监控 Core Web Vitals 指标
- 代码审查关注性能影响
- 建立性能预算，超出时告警
