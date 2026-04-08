/**
 * 语音指令处理模块
 * 
 * 提供语音指令的解析、匹配和执行功能，支持：
 * - 指令白名单与同义词匹配
 * - 模糊匹配（基于编辑距离）
 * - 冲突检测与二次确认
 * - 超时回退机制
 * 
 * @module utils/voiceCommands
 */

import { createLogger } from './logger'

const log = createLogger('VoiceCommands')

/**
 * 指令同义词映射表
 * 
 * 每个指令可以有多个同义词，用户说出任意同义词都会匹配到对应指令。
 * 同义词按使用频率排序，常用的放在前面。
 * 
 * @constant {Object.<string, string[]>}
 */
const COMMAND_SYNONYMS = {
  // 导航指令
  dashboard: ['驾驶舱', '首页', '主页', '仪表盘', '控制台', '回首页', '返回首页', '打开首页', '去首页', '回到首页'],
  videos: ['视频库', '视频列表', '视频管理', '打开视频库', '查看视频', '视频', '所有视频', '视频文件', '去视频库'],
  analysis: ['分析', '视频分析', '打开分析', '分析页', '分析视频', '开始分析', 'AI分析', '智能分析', '去分析'],
  settings: ['设置', '个人中心', '配置', '打开设置', '我的设置', '个人设置', '系统设置', '偏好设置', '去设置'],
  
  // 功能指令
  help: ['帮助', '怎么用', '使用帮助', '功能介绍', '你能做什么', '有什么功能', '使用说明', '操作指南', '教程'],
  report: ['报告', '生成报告', '导出报告', '分析报告', '创建报告', '下载报告', '报告导出', '出报告'],
  upload: ['上传', '上传视频', '添加视频', '导入视频', '新增视频', '传视频'],
  search: ['搜索', '查找', '找视频', '搜视频', '搜索视频', '查询'],
  
  // 控制指令
  play: ['播放', '开始播放', '继续播放', '播放视频', '开始', '继续'],
  pause: ['暂停', '停止播放', '暂停播放', '暂停一下'],
  stop: ['停止', '结束', '关闭', '退出'],
  cancel: ['取消', '算了', '不要了', '返回', '撤销'],
  
  // 新增：快捷操作指令
  refresh: ['刷新', '更新', '重新加载', '刷新页面'],
  back: ['返回', '后退', '上一页', '回去'],
  forward: ['前进', '下一页', '继续'],
  fullscreen: ['全屏', '全屏播放', '放大', '最大化'],
  exitFullscreen: ['退出全屏', '缩小', '还原'],
  
  // 新增：查询指令
  status: ['状态', '系统状态', '运行状态', '当前状态'],
  tasks: ['任务', '待办', '今日任务', '我的任务', '任务列表'],
  notifications: ['通知', '消息', '提醒', '未读消息', '新消息'],
  
  // 新增：AI交互指令
  chat: ['聊天', '对话', '说话', '交流'],
  clear: ['清空', '清除', '清空对话', '清除历史'],
  mute: ['静音', '关闭声音', '不要说话'],
  unmute: ['取消静音', '开启声音', '恢复声音']
}

/**
 * 指令优先级配置
 * 
 * 数字越小优先级越高。当多个指令匹配置信度相近时，
 * 优先执行优先级高的指令。
 * 
 * @constant {Object.<string, number>}
 */
const COMMAND_PRIORITY = {
  cancel: 1,
  stop: 2,
  dashboard: 3,
  videos: 3,
  analysis: 3,
  settings: 3,
  help: 4,
  report: 5,
  upload: 5,
  search: 5,
  play: 6,
  pause: 6,
  // 新增指令优先级
  refresh: 4,
  back: 4,
  forward: 4,
  fullscreen: 5,
  exitFullscreen: 5,
  status: 5,
  tasks: 5,
  notifications: 5,
  chat: 6,
  clear: 6,
  mute: 7,
  unmute: 7
}

/**
 * 冲突指令组配置
 * 
 * 同组内的指令在短时间内连续触发时需要二次确认，
 * 防止用户误操作导致频繁切换。
 * 
 * @constant {string[][]}
 */
const CONFLICT_GROUPS = [
  ['play', 'pause', 'stop'],
  ['dashboard', 'videos', 'analysis', 'settings']
]

/**
 * 解析语音输入，匹配指令
 * @param {string} input 语音输入文本
 * @returns {Object} 匹配结果
 */
export function parseVoiceCommand(input) {
  if (!input || typeof input !== 'string') {
    return { matched: false, command: null, confidence: 0 }
  }

  const normalizedInput = input.trim().toLowerCase()
  const matches = []

  // 遍历所有指令进行匹配
  for (const [command, synonyms] of Object.entries(COMMAND_SYNONYMS)) {
    for (const synonym of synonyms) {
      const normalizedSynonym = synonym.toLowerCase()
      
      // 精确匹配
      if (normalizedInput === normalizedSynonym) {
        matches.push({ command, confidence: 1.0, matchType: 'exact', synonym })
        continue
      }
      
      // 包含匹配
      if (normalizedInput.includes(normalizedSynonym)) {
        const confidence = normalizedSynonym.length / normalizedInput.length
        matches.push({ command, confidence: Math.min(0.9, confidence + 0.3), matchType: 'contains', synonym })
        continue
      }
      
      // 模糊匹配（编辑距离）
      const distance = levenshteinDistance(normalizedInput, normalizedSynonym)
      const maxLen = Math.max(normalizedInput.length, normalizedSynonym.length)
      const similarity = 1 - distance / maxLen
      
      if (similarity > 0.6) {
        matches.push({ command, confidence: similarity * 0.8, matchType: 'fuzzy', synonym })
      }
    }
  }

  if (matches.length === 0) {
    log.info('未匹配到指令', { input })
    return { matched: false, command: null, confidence: 0, input }
  }

  // 按置信度和优先级排序
  matches.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence
    }
    return (COMMAND_PRIORITY[a.command] || 99) - (COMMAND_PRIORITY[b.command] || 99)
  })

  const bestMatch = matches[0]
  log.info('指令匹配成功', { input, command: bestMatch.command, confidence: bestMatch.confidence })

  return {
    matched: true,
    command: bestMatch.command,
    confidence: bestMatch.confidence,
    matchType: bestMatch.matchType,
    synonym: bestMatch.synonym,
    input,
    alternatives: matches.slice(1, 3)
  }
}

/**
 * 检测指令冲突
 * @param {string} newCommand 新指令
 * @param {string} lastCommand 上一个指令
 * @returns {Object} 冲突检测结果
 */
export function detectConflict(newCommand, lastCommand) {
  if (!lastCommand) return { hasConflict: false }

  for (const group of CONFLICT_GROUPS) {
    if (group.includes(newCommand) && group.includes(lastCommand) && newCommand !== lastCommand) {
      return {
        hasConflict: true,
        conflictType: 'same-group',
        message: `您刚才选择了「${getCommandLabel(lastCommand)}」，现在要切换到「${getCommandLabel(newCommand)}」吗？`
      }
    }
  }

  return { hasConflict: false }
}

/**
 * 获取指令的中文标签
 */
export function getCommandLabel(command) {
  const labels = {
    dashboard: '驾驶舱',
    videos: '视频库',
    analysis: '视频分析',
    settings: '个人设置',
    help: '帮助',
    report: '生成报告',
    upload: '上传视频',
    search: '搜索',
    play: '播放',
    pause: '暂停',
    stop: '停止',
    cancel: '取消',
    // 新增标签
    refresh: '刷新',
    back: '返回',
    forward: '前进',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    status: '系统状态',
    tasks: '任务列表',
    notifications: '通知消息',
    chat: '开始对话',
    clear: '清空对话',
    mute: '静音',
    unmute: '取消静音'
  }
  return labels[command] || command
}

/**
 * 获取指令对应的路由
 */
export function getCommandRoute(command) {
  const routes = {
    dashboard: '/',
    videos: '/videos',
    analysis: '/analysis/v001',
    settings: '/settings'
  }
  return routes[command] || null
}

/**
 * 获取指令响应文本
 */
export function getCommandResponse(command, context = {}) {
  const responses = {
    dashboard: '好的，正在为您打开驾驶舱...',
    videos: '正在跳转到视频库...',
    analysis: '正在打开视频分析页面...',
    settings: '正在进入个人设置...',
    help: '我可以帮您：\n• 说"打开视频库"浏览视频\n• 说"生成报告"导出分析报告\n• 说"设置"进入个人中心\n• 说"任务"查看待办事项\n• 说"帮助"查看更多功能',
    report: '正在为您生成分析报告，请稍候...',
    upload: '请点击上传按钮选择视频文件',
    search: '请告诉我您要搜索的内容',
    play: '开始播放视频',
    pause: '视频已暂停',
    stop: '已停止',
    cancel: '好的，已取消',
    // 新增响应
    refresh: '正在刷新页面...',
    back: '正在返回上一页...',
    forward: '正在前进到下一页...',
    fullscreen: '已进入全屏模式',
    exitFullscreen: '已退出全屏模式',
    status: '系统运行正常，所有服务在线',
    tasks: '正在查看您的任务列表...',
    notifications: '您有3条未读通知',
    chat: '好的，我在听，请说...',
    clear: '对话历史已清空',
    mute: '已静音',
    unmute: '已取消静音'
  }
  return responses[command] || '收到您的指令，正在处理...'
}

/**
 * 创建语音指令控制器
 */
export function createVoiceCommandController(options = {}) {
  const {
    onCommand = () => {},
    onConfirmRequired = () => {},
    onTimeout = () => {},
    onError = () => {},
    confirmTimeout = 5000,
    idleTimeout = 10000
  } = options

  let lastCommand = null
  let lastCommandTime = 0
  let pendingConfirm = null
  let idleTimer = null

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      onTimeout({ message: '语音识别已超时，请重新点击麦克风' })
    }, idleTimeout)
  }

  const clearPendingConfirm = () => {
    pendingConfirm = null
  }

  return {
    /**
     * 处理语音输入
     */
    processInput(input) {
      resetIdleTimer()
      
      const result = parseVoiceCommand(input)
      
      if (!result.matched) {
        onError({ 
          type: 'no-match', 
          message: `未识别到有效指令「${input}」，请尝试说"帮助"查看可用指令`,
          input 
        })
        return { success: false, reason: 'no-match' }
      }

      // 低置信度警告
      if (result.confidence < 0.7) {
        onConfirmRequired({
          type: 'low-confidence',
          message: `您是想说「${getCommandLabel(result.command)}」吗？`,
          command: result.command,
          confidence: result.confidence
        })
        pendingConfirm = result.command
        return { success: false, reason: 'low-confidence', pendingCommand: result.command }
      }

      // 冲突检测
      const conflict = detectConflict(result.command, lastCommand)
      if (conflict.hasConflict && Date.now() - lastCommandTime < confirmTimeout) {
        onConfirmRequired({
          type: 'conflict',
          message: conflict.message,
          command: result.command,
          lastCommand
        })
        pendingConfirm = result.command
        return { success: false, reason: 'conflict', pendingCommand: result.command }
      }

      // 执行指令
      lastCommand = result.command
      lastCommandTime = Date.now()
      
      const response = getCommandResponse(result.command)
      const route = getCommandRoute(result.command)
      
      onCommand({
        command: result.command,
        response,
        route,
        confidence: result.confidence
      })

      return { success: true, command: result.command, route, response }
    },

    /**
     * 确认待定指令
     */
    confirmPending() {
      if (!pendingConfirm) return { success: false, reason: 'no-pending' }
      
      const command = pendingConfirm
      clearPendingConfirm()
      
      lastCommand = command
      lastCommandTime = Date.now()
      
      const response = getCommandResponse(command)
      const route = getCommandRoute(command)
      
      onCommand({ command, response, route, confirmed: true })
      
      return { success: true, command, route, response }
    },

    /**
     * 取消待定指令
     */
    cancelPending() {
      clearPendingConfirm()
      return { success: true }
    },

    /**
     * 清理资源
     */
    destroy() {
      if (idleTimer) clearTimeout(idleTimer)
      clearPendingConfirm()
    }
  }
}

/**
 * 计算编辑距离（Levenshtein Distance）
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length
  const n = str2.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
      }
    }
  }

  return dp[m][n]
}

/**
 * 获取所有可用指令列表
 */
export function getAvailableCommands() {
  return Object.entries(COMMAND_SYNONYMS).map(([command, synonyms]) => ({
    command,
    label: getCommandLabel(command),
    synonyms,
    route: getCommandRoute(command)
  }))
}
