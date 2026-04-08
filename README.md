# 视频分析AI应用

基于 Vue 3 + Vite + Element Plus 构建的视频分析AI前端应用，采用深空科幻风格UI设计，支持移动端响应式布局。

## 系统架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           前端应用 (Vue 3 + Vite)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  驾驶舱首页  │  │   视频库页   │  │  视频分析页  │  │  个人中心页  │        │
│  │     /       │  │   /videos   │  │ /analysis/:id│  │  /settings  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                        │
│  ┌────────────────────────────────┴────────────────────────────────────┐   │
│  │                    AI机器人组件 (全局悬浮/语音导航)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Pinia 状态管理                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ VideoStore│  │ AIStore  │  │SettingsStore│ │DashboardStore│       │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      API 层 (Axios + Mock)                          │   │
│  │  • 环境变量控制 Mock 开关 (VITE_USE_MOCK)                            │   │
│  │  • 自动重试机制 (3次)                                                │   │
│  │  • 请求/响应拦截器                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      后端服务 (预留接口)       │
                    │   当前使用 Mock 数据演示      │
                    └───────────────────────────────┘
```

## 项目结构

```
├── docker-compose.yml              # Docker 编排配置
├── docs/                           # 技术文档
│   ├── api_reference.md            # API 接口文档
│   ├── deployment.md               # 部署文档
│   ├── error_handling.md           # 错误处理文档
│   ├── performance.md              # 性能优化文档
│   └── project_design.md           # 项目设计文档
├── test-files/                     # 测试用 SOP/知识库文件
│   ├── 测试SOP-安全操作规范.txt
│   ├── 测试SOP-设备维护流程.txt
│   └── ...
└── frontend-admin/                 # 前端应用主目录
    ├── Dockerfile                  # Docker 构建文件
    ├── nginx.conf                  # Nginx 配置
    ├── vite.config.js              # Vite 构建配置
    ├── vitest.config.js            # Vitest 测试配置
    ├── package.json
    └── src/
        ├── main.js                 # 应用入口
        ├── App.vue                 # 根组件
        ├── api/                    # API 层
        │   ├── request.js          # Axios 封装（拦截器、重试、Mock 开关）
        │   └── video.js            # 业务 API（视频、AI、仪表盘、设置）
        ├── components/             # 公共组件
        │   ├── AIBot.vue / .scss   # 全局悬浮 AI 机器人（拖拽、气泡菜单、对话）
        │   ├── ReportExporter.vue  # 报告编辑与导出（HTML/PDF/JSON/Markdown）
        │   ├── VideoPlayer.vue     # 视频播放器（播放控制、倍速、演示视频）
        │   └── VideoTimeline.vue   # 事件时间轴（关键事件标记、进度跳转）
        ├── router/
        │   └── index.js            # Vue Router 路由配置
        ├── stores/                 # Pinia 状态管理
        │   ├── ai.js               # AI 对话状态（消息、语音、位置）
        │   ├── dashboard.js        # 仪表盘数据（统计、任务、通知）
        │   ├── settings.js         # 用户设置（主题、SOP、知识库）
        │   └── video.js            # 视频管理（列表、筛选、标签）
        ├── styles/                 # 全局样式
        │   ├── variables.scss      # 设计令牌（色彩、间距、断点、Mixin）
        │   ├── global.scss         # 全局样式与 Element Plus 暗色覆盖
        │   └── element-theme.scss  # Element Plus 主题变量
        ├── utils/                  # 工具函数
        │   ├── complianceDetector.js # 合规性检测引擎（规则匹配、内容匹配度）
        │   ├── logger.js           # 日志工具（分级日志、操作追踪）
        │   ├── speech.js           # 语音识别封装（Web Speech API）
        │   └── voiceCommands.js    # 语音指令解析（导航、控制、模糊匹配）
        ├── views/                  # 页面视图
        │   ├── Dashboard.vue/.scss # 驾驶舱首页（仪表盘、任务、通知）
        │   ├── VideoLibrary.vue/.scss # 视频库（网格/列表、搜索筛选）
        │   ├── VideoAnalysis.vue/.scss # 视频分析（播放器、合规检测、AI 对话、报告）
        │   └── Settings.vue/.scss  # 个人中心（信息、主题、SOP、知识库）
        └── __tests__/              # 单元测试（Vitest + @vue/test-utils）
            ├── setup.js
            ├── api/                # API 层测试
            ├── components/         # 组件测试
            ├── stores/             # Store 测试
            ├── utils/              # 工具函数测试
            ├── views/              # 视图测试
            └── router/             # 路由测试
```

### 核心模块说明

| 模块 | 说明 |
|------|------|
| `api/` | 统一 API 层，支持 Mock/真实 API 自动切换，内置重试和错误回退 |
| `stores/` | Pinia 状态管理，数据自动持久化到 localStorage |
| `components/` | 可复用组件，AIBot 全局悬浮，ReportExporter 支持多格式导出 |
| `views/` | 4 个核心页面，每个页面配套独立 SCSS 文件 |
| `utils/` | 合规性检测引擎、语音识别、指令解析、日志追踪等工具函数 |
| `styles/` | 设计令牌系统，响应式断点 Mixin，Element Plus 深色主题覆盖 |

## 环境配置

### 环境变量说明

在项目根目录创建 `.env` 文件配置环境变量：

```bash
# API 基础地址（默认 /api）
VITE_API_BASE_URL=/api

# Mock 数据开关（true=使用模拟数据，false=调用真实API）
# ⚠️ 当前版本默认启用 Mock，生产环境请设置为 false
VITE_USE_MOCK=true
```

### 环境文件

| 文件 | 用途 |
|------|------|
| `.env` | 所有环境通用配置 |
| `.env.development` | 开发环境配置 |
| `.env.production` | 生产环境配置 |

## How to Run

### 方式一：Docker 一键部署（推荐）

```bash
# 构建并启动服务
docker-compose up --build -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f frontend-admin

# 停止服务
docker-compose down
```

启动成功后访问：**http://localhost:8081**

### 方式二：本地开发环境

```bash
# 进入前端目录
cd frontend-admin

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

开发服务器地址：**http://localhost:5173**

### 运行测试

```bash
cd frontend-admin

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 测试报告

### 测试覆盖率摘要

| 指标 | 覆盖率 | 阈值 |
|------|--------|------|
| 语句覆盖 | 42.08% | 35% |
| 分支覆盖 | 35.08% | 30% |
| 函数覆盖 | 38.52% | 35% |
| 行覆盖 | 42.65% | 35% |

### 测试统计

| 指标 | 数值 |
|------|------|
| 测试文件 | 20 个 |
| 测试用例 | 586 个 |
| 通过率 | 100% |

### 测试文件清单

| 测试文件 | 测试数 | 状态 |
|----------|--------|------|    
| stores/video.test.js | 38 | ✅ |
| stores/ai.test.js | 36 | ✅ |
| stores/settings.test.js | 19 | ✅ |
| stores/dashboard.test.js | 23 | ✅ |
| api/request.test.js | 28 | ✅ |
| api/video-api.test.js | 44 | ✅ |
| router/router.test.js | 8 | ✅ |
| router/index.test.js | 15 | ✅ |
| components/AIBot.test.js | 48 | ✅ |
| components/ReportExporter.test.js | 28 | ✅ |
| components/VideoPlayer.test.js | 32 | ✅ |
| components/VideoTimeline.test.js | 17 | ✅ |
| views/Dashboard.test.js | 28 | ✅ |
| views/VideoLibrary.test.js | 42 | ✅ |
| views/VideoAnalysis.test.js | 53 | ✅ |
| views/Settings.test.js | 30 | ✅ |
| utils/logger.test.js | 18 | ✅ |
| utils/voiceCommands.test.js | 37 | ✅ |
| utils/speech.test.js | 34 | ✅ |
| App.test.js | 8 | ✅ |

## Services

| 服务 | 端口 | 说明 | 访问地址 |
|------|------|------|----------|
| frontend-admin | 8081 | 视频分析AI管理后台 | http://localhost:8081 |

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 完整权限 |
| 分析师 | zhangmh | zhang123 | 视频分析权限 |

> **⚠️ Mock 数据说明**：当前版本为纯前端演示应用，默认启用 Mock 数据模式。所有 API 调用将返回模拟数据，无需后端服务即可体验全部功能。生产部署时请配置 `VITE_USE_MOCK=false` 并确保后端服务可用。

## 质检测试指南

### 功能测试清单

#### 1. 驾驶舱首页 (/)
- [x] 页面加载正常，显示深空科幻风格UI
- [x] 左上角显示当前日期和今日任务列表（自动滚动）
- [x] 右上角显示系统通知（自动滚动，未读通知有蓝色标记）
- [x] 中央AI机器人有呼吸动画效果
- [x] 底部8个仪表盘数据正确显示，有进度条和趋势箭头
- [x] 点击AI机器人弹出气泡菜单

#### 2. 视频库页 (/videos)
- [x] 显示视频卡片，支持网格/列表视图切换
- [x] 搜索框可按名称、标签搜索
- [x] 状态筛选（已完成/未完成）功能正常
- [x] 日期范围筛选功能正常
- [x] 标签多选筛选功能正常
- [x] 已分析视频右上角显示"AI"徽章
- [x] 点击视频卡片跳转到分析页
- [x] 上传按钮弹出上传对话框

#### 3. 视频分析页 (/analysis/v001)
- [x] 左侧显示视频播放器（Mixkit 免费工厂/工业视频素材）
- [x] 播放控制栏：播放/暂停、进度条、倍速选择
- [x] 标签区域显示视频标签，可编辑
- [x] 事件时间轴显示5个关键事件节点
- [x] 点击时间轴节点，进度条跳转
- [x] SOP合规性检测显示检查结果（基于合规检测引擎实时检测）
- [x] 右侧AI摘要内容完整显示
- [x] AI对话可发送消息并收到回复
- [x] 语音转文字区域可复制内容
- [x] 生成报告按钮弹出报告预览

#### 4. 个人中心/设置页 (/settings)
- [x] 左侧导航5个选项可切换
- [x] 个人信息：显示张明华的信息，可编辑保存
- [x] 主题配色：3个主题卡片可选择
- [x] 对话历史：显示AI对话记录，可清空
- [x] SOP管理：显示4个SOP，可新建/编辑/删除/设为默认
- [x] 合规性检测开关功能正常
- [x] 知识库：显示6个文档，可上传/删除

#### 5. AI机器人交互
- [x] 所有页面右下角显示AI机器人
- [x] 可拖拽移动位置
- [x] 点击弹出气泡菜单（对话+4个导航）
- [x] 点击导航气泡可跳转对应页面
- [x] 点击对话气泡打开聊天面板
- [x] 发送"打开视频库"等指令有正确回复
- [x] 语音按钮点击有状态变化（需Chrome/Edge）

### 性能测试
- [x] 首页加载时间 < 3秒
- [x] 页面切换流畅，无卡顿
- [x] 滚动列表流畅

### 兼容性测试
- [x] Chrome 最新版
- [x] Firefox 最新版
- [x] Safari 最新版
- [x] Edge 最新版

## 技术文档

详细技术文档请参阅 `docs/` 目录：

- [项目设计文档](docs/project_design.md) - 系统架构、数据模型、UI规范
- [API 接口文档](docs/api_reference.md) - 前后端接口定义
- [错误处理文档](docs/error_handling.md) - 错误处理策略与实现
- [性能优化文档](docs/performance.md) - 性能优化措施

## 题目内容

### 视频分析AI应用前端页面开发需求规格说明

开发一个功能完整、交互友好的视频分析AI应用前端界面，包含四个核心页面，采用语音指令与AI交互作为主要导航方式，实现视频管理、智能分析及个性化设置等功能。

#### 页面架构与导航设计

1. **核心页面组成**：驾驶舱首页、视频库页、视频分析页、个人中心/设置页
2. **导航机制**：
   - 无传统导航栏设计
   - 支持两种页面跳转方式：语音指令触发或点击AI机器人提供的导航选项
   - AI机器人在所有页面保持悬浮状态，支持拖拽移动操作

#### 详细页面设计规范

**1. 驾驶舱首页**
- 视觉设计：采用酷炫飞船驾驶舱视觉风格，营造科技感界面氛围
- 顶部信息区：左上角日期+任务卡片，右上角通知面板
- 中央交互区：挡风玻璃区域悬浮人形AI机器人
- 底部仪表盘区：G消耗流量、P消耗存储、T消耗Tokens、视频处理状态等

**2. 视频库页**
- 响应式网格/列表布局
- 支持搜索、筛选（状态/日期/标签）
- 视频卡片包含：名称、缩略图、AI分析状态、日期、标签

**3. 视频分析页**
- 左右分栏布局
- 左侧：视频播放器、标签、事件时间轴、合规性检测
- 右侧：AI摘要、AI对话、语音转文字、报告生成

**4. 个人中心/设置页**
- 个人信息编辑
- 主题配色选择
- AI对话历史管理
- SOP管理与合规检测开关
- AI知识库配置

#### 技术栈

- **前端框架**：Vue 3 + Vite
- **UI组件库**：Element Plus（深色主题定制）
- **状态管理**：Pinia
- **样式**：SCSS + CSS Variables
- **测试**：Vitest + @vue/test-utils

---

**项目标签**：label-03022
