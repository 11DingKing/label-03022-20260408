# API 接口文档

## 概述

本文档定义了视频分析AI应用的前后端接口规范。当前版本使用 Mock 数据，后端接口为预留设计。

## 基础配置

### 请求基础URL
```
开发环境: http://localhost:5173/api
生产环境: 由 VITE_API_BASE_URL 环境变量配置
```

### 请求头
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>",
  "X-Request-ID": "req_<timestamp>_<random>"
}
```

### 响应格式
```json
{
  "code": 200,
  "data": {},
  "message": "success"
}
```

## 视频接口 (videoApi)

### 获取视频列表
```
GET /videos
```

**请求参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选: pending/analyzing/completed |
| tags | string[] | 否 | 标签筛选 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**响应数据**
```json
{
  "code": 200,
  "data": [
    {
      "id": "v001",
      "name": "2026年1月安全巡检记录",
      "thumbnail": "/thumbnails/v001.jpg",
      "url": "/videos/v001.mp4",
      "status": "completed",
      "createdAt": "2026-01-15T08:30:00Z",
      "analyzedAt": "2026-01-15T09:15:00Z",
      "tags": ["安全巡检", "生产流程"],
      "hasAIAnalysis": true,
      "duration": 1847
    }
  ],
  "total": 24
}
```

### 获取视频详情
```
GET /videos/:id
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "id": "v001",
    "name": "2026年1月安全巡检记录",
    "thumbnail": "/thumbnails/v001.jpg",
    "url": "/videos/v001.mp4",
    "status": "completed",
    "createdAt": "2026-01-15T08:30:00Z",
    "analyzedAt": "2026-01-15T09:15:00Z",
    "tags": ["安全巡检", "生产流程"],
    "hasAIAnalysis": true,
    "duration": 1847,
    "fileSize": 524288000,
    "resolution": "1920x1080",
    "frameRate": 30
  }
}
```

### 上传视频
```
POST /videos/upload
Content-Type: multipart/form-data
```

**请求参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 视频文件 |
| name | string | 否 | 视频名称 |
| tags | string[] | 否 | 初始标签 |

**响应数据**
```json
{
  "code": 200,
  "data": {
    "id": "v_1234567890",
    "status": "pending"
  }
}
```

### 删除视频
```
DELETE /videos/:id
```

### 更新视频标签
```
PUT /videos/:id/tags
```

**请求体**
```json
{
  "tags": ["标签1", "标签2"]
}
```

### 获取视频分析结果
```
GET /videos/:id/analysis
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "summary": "AI分析摘要内容...",
    "compliance": [
      {
        "id": "c1",
        "item": "安全帽佩戴",
        "status": "pass",
        "confidence": 0.95
      }
    ],
    "timeline": [
      {
        "id": "e1",
        "time": 120,
        "type": "warning",
        "description": "检测到未佩戴安全帽"
      }
    ]
  }
}
```

### 启动视频分析
```
POST /videos/:id/analyze
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "taskId": "task_1234567890",
    "status": "processing"
  }
}
```

### 获取语音转文字
```
GET /videos/:id/transcript
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "text": "完整转写文本...",
    "segments": [
      {
        "start": 0,
        "end": 5.2,
        "text": "分段文本内容"
      }
    ]
  }
}
```

### 生成报告
```
POST /videos/:id/report
```

**请求体**
```json
{
  "title": "报告标题",
  "includeTranscript": true,
  "includeCompliance": true
}
```

### 导出报告
```
GET /videos/:id/report/export
```

**请求参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| format | string | 是 | 导出格式: pdf/html/docx |

## 仪表盘接口 (dashboardApi)

### 获取统计数据
```
GET /dashboard/stats
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "gpuUsage": 67,
    "storageUsed": 2.4,
    "tokensUsed": 156000,
    "videosProcessed": 847,
    "videosAnalyzing": 12,
    "videosPending": 45,
    "complianceRate": 94.2,
    "alertsToday": 3
  }
}
```

### 获取任务列表
```
GET /dashboard/tasks
```

**响应数据**
```json
{
  "code": 200,
  "data": [
    {
      "id": "t1",
      "title": "审核安全巡检视频",
      "status": "pending",
      "dueDate": "2026-02-15T18:00:00Z"
    }
  ]
}
```

### 获取通知列表
```
GET /dashboard/notifications
```

**响应数据**
```json
{
  "code": 200,
  "data": [
    {
      "id": "n1",
      "title": "新视频上传完成",
      "content": "视频 xxx 已上传成功",
      "isRead": false,
      "createdAt": "2026-02-15T10:30:00Z"
    }
  ]
}
```

## AI 接口 (aiApi)

### AI 对话
```
POST /ai/chat
```

**请求体**
```json
{
  "message": "用户消息内容",
  "context": {
    "page": "analysis",
    "videoId": "v001"
  }
}
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "reply": "AI回复内容..."
  }
}
```

### 视频相关对话
```
POST /ai/chat/video/:videoId
```

### 获取对话历史
```
GET /ai/history
```

### 清空对话历史
```
DELETE /ai/history
```

### 根据视频分析生成 SOP
```
POST /ai/sop/generate/:videoId
```

**请求体**
```json
{
  "videoName": "视频名称",
  "complianceResults": [
    { "label": "开场白规范", "pass": true, "time": "00:15" },
    { "label": "禁止性话术检测", "pass": false, "time": "02:00" }
  ],
  "summary": "视频分析摘要内容..."
}
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "name": "视频名称-SOP-1234567890",
    "content": "# 标准操作规程 (SOP)\n\n## 合规要求\n..."
  }
}
```

**功能说明**
- 根据视频分析结果自动生成标准操作规程
- 包含合规检测结果、改进建议和标准流程
- 生成的 SOP 可直接保存到 SOP 管理列表

## 设置接口 (settingsApi)

### 获取个人信息
```
GET /user/profile
```

**响应数据**
```json
{
  "code": 200,
  "data": {
    "id": "u001",
    "name": "张明华",
    "avatar": "/avatars/default.png",
    "department": "安全监管部",
    "position": "高级分析师",
    "email": "zhangmh@example.com",
    "phone": "138****8888"
  }
}
```

### 更新个人信息
```
PUT /user/profile
```

### SOP 管理

```
GET /settings/sop              # 获取SOP列表
POST /settings/sop             # 创建SOP
PUT /settings/sop/:id          # 更新SOP
DELETE /settings/sop/:id       # 删除SOP
POST /settings/sop/import      # 导入SOP
```

### 知识库管理

```
GET /settings/knowledge-base           # 获取知识库列表
POST /settings/knowledge-base/upload   # 上传文档
DELETE /settings/knowledge-base/:id    # 删除文档
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

## Mock 数据说明

当 `VITE_USE_MOCK=true` 时，所有 API 调用将返回预设的模拟数据：

- 视频列表返回 24 条模拟视频数据
- 仪表盘返回固定的统计数据
- AI 对话返回预设的回复模板
- 上传/删除等操作返回成功状态

Mock 模式下会在控制台输出日志提示，便于开发调试。

## 后端 API 集成指南

### 切换到真实 API

1. 设置环境变量：
```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api-server.com/api
```

2. 确保后端服务实现了上述所有接口

3. 配置 CORS 允许前端域名访问

### API 调用机制

前端使用 `createApiCall` 工厂函数创建 API 调用，具有以下特性：

1. **自动 Mock 回退**：当 `VITE_USE_MOCK=true` 时自动返回模拟数据
2. **错误回退**：真实 API 调用失败时可选择回退到 Mock 数据
3. **自动重试**：网络错误或 5xx 错误时自动重试（最多3次）
4. **空数据处理**：自动处理空响应，返回默认值

### 后端实现要求

1. **视频分析服务**
   - 支持视频上传和存储
   - 集成 AI 模型进行内容分析
   - 支持语音转文字（ASR）
   - 合规性检测算法

2. **AI 对话服务**
   - 集成大语言模型（如 GPT、Claude 等）
   - 支持上下文对话
   - 视频内容理解能力

3. **SOP 生成服务**
   - 根据分析结果生成结构化 SOP
   - 支持模板定制
   - 合规建议生成

### 数据库设计建议

```sql
-- 视频表
CREATE TABLE videos (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT,
  thumbnail TEXT,
  status ENUM('pending', 'analyzing', 'completed'),
  duration INT,
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analyzed_at TIMESTAMP
);

-- 视频标签关联表
CREATE TABLE video_tags (
  video_id VARCHAR(36),
  tag VARCHAR(100),
  PRIMARY KEY (video_id, tag)
);

-- SOP 表
CREATE TABLE sops (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 对话历史表
CREATE TABLE ai_chat_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  role ENUM('user', 'assistant'),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
