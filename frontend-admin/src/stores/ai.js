import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { createLogger } from '@/utils/logger'

const log = createLogger('AIStore')

// 默认欢迎消息
const defaultMessages = [
  { id: 'm0', role: 'assistant', content: '你好，张明华！我是视频分析AI助手小智。我可以帮你：\n\n• 导航到任意页面（说"打开视频库"）\n• 分析视频内容并识别安全隐患\n• 生成合规检测报告\n• 管理SOP标准操作规程\n\n今天有3条未读通知，2个待处理任务。需要我帮你处理什么？', timestamp: new Date().toISOString() }
]

/**
 * 从 localStorage 加载数据
 */
function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (e) {
    log.warn('加载存储数据失败', { key, error: e.message })
    return defaultValue
  }
}

/**
 * 保存数据到 localStorage
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    log.warn('保存存储数据失败', { key, error: e.message })
  }
}

export const useAIStore = defineStore('ai', () => {
  let _msgIdCounter = 0
  const messages = ref(loadFromStorage('ai_messages', defaultMessages))
  const isExpanded = ref(loadFromStorage('ai_isExpanded', false))
  const isBubbleMenuOpen = ref(false)
  const isListening = ref(false)
  const isProcessing = ref(false)
  const position = ref(loadFromStorage('ai_position', { x: 60, y: typeof window !== 'undefined' ? window.innerHeight - 160 : 600 }))

  // 监听变化并持久化
  watch(messages, (val) => saveToStorage('ai_messages', val), { deep: true })
  watch(isExpanded, (val) => saveToStorage('ai_isExpanded', val))
  watch(position, (val) => saveToStorage('ai_position', val), { deep: true })

  function addMessage(role, content) {
    _msgIdCounter++
    messages.value.push({
      id: `m${Date.now()}_${_msgIdCounter}`,
      role,
      content,
      timestamp: new Date().toISOString()
    })
    log.info('添加消息', { role, contentLength: content.length })
  }

  // 模拟AI回复 - 增强版，支持更多上下文理解
  function simulateReply(userMsg) {
    isProcessing.value = true
    const lowerMsg = userMsg.toLowerCase()

    setTimeout(() => {
      let reply = '我理解了你的问题，让我为你处理。'

      // 导航相关
      if (lowerMsg.includes('驾驶舱') || lowerMsg.includes('首页') || lowerMsg.includes('主页')) {
        reply = '好的，正在为你跳转到驾驶舱首页。这里可以查看系统概览、任务进度和通知信息。'
      } else if (lowerMsg.includes('视频库') || lowerMsg.includes('视频列表') || lowerMsg.includes('所有视频')) {
        reply = '好的，正在为你打开视频库。你可以在这里浏览、搜索和管理所有上传的视频文件。'
      } else if (lowerMsg.includes('分析') || lowerMsg.includes('检测')) {
        reply = '好的，正在为你打开视频分析页面。选择一个视频后，AI将自动进行合规性检测和内容分析。'
      } else if (lowerMsg.includes('设置') || lowerMsg.includes('个人中心') || lowerMsg.includes('配置')) {
        reply = '好的，正在为你打开个人中心设置页。你可以在这里修改个人信息、系统偏好和通知设置。'
      }
      // 功能相关
      else if (lowerMsg.includes('报告') || lowerMsg.includes('导出')) {
        reply = '我可以帮你生成视频分析报告。报告支持HTML、PDF和JSON三种格式导出。请先选择一个已分析完成的视频，然后点击"生成报告"按钮。'
      } else if (lowerMsg.includes('上传') || lowerMsg.includes('添加视频')) {
        reply = '要上传新视频，请前往视频库页面，点击右上角的"上传视频"按钮。支持MP4、AVI、MOV等常见格式，单个文件最大支持2GB。'
      } else if (lowerMsg.includes('搜索') || lowerMsg.includes('查找')) {
        reply = '你可以在视频库页面使用搜索功能。支持按视频名称、上传日期、分析状态等条件进行筛选。'
      }
      // 帮助相关
      else if (lowerMsg.includes('帮助') || lowerMsg.includes('你能做什么') || lowerMsg.includes('功能')) {
        reply = '我是视频分析AI助手小智，可以帮你：\n\n🚀 导航控制\n• 说"打开视频库"跳转到视频管理\n• 说"去分析页面"开始视频分析\n\n📊 视频分析\n• 自动识别视频中的安全隐患\n• 检测SOP合规性问题\n• 生成详细分析报告\n\n📝 报告管理\n• 支持HTML/PDF/JSON格式导出\n• 可编辑报告内容和备注\n\n还有什么我可以帮你的吗？'
      } else if (lowerMsg.includes('语音') || lowerMsg.includes('声音')) {
        reply = '语音功能说明：\n• 点击麦克风图标开始语音输入\n• 支持自然语言导航指令\n• 说"打开XX"可快速跳转页面\n• 语音识别需要浏览器授权麦克风权限'
      }
      // 状态查询
      else if (lowerMsg.includes('任务') || lowerMsg.includes('待办')) {
        reply = '让我查看一下你的任务情况...\n\n📋 今日任务概览：\n• 2个待处理任务\n• 1个进行中任务\n• 3个已完成任务\n\n需要我帮你查看具体任务详情吗？'
      } else if (lowerMsg.includes('通知') || lowerMsg.includes('消息')) {
        reply = '你有3条未读通知：\n\n1. 系统更新提醒\n2. 视频分析完成通知\n3. 新功能上线公告\n\n点击右上角通知区域可查看详情。'
      }
      // 问候
      else if (lowerMsg.includes('你好') || lowerMsg.includes('嗨') || lowerMsg.includes('hi')) {
        reply = '你好！我是小智，很高兴为你服务。今天有什么我可以帮你的吗？'
      } else if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢')) {
        reply = '不客气！如果还有其他问题，随时告诉我。祝你工作顺利！'
      }
      // 默认回复
      else {
        reply = `我理解你想了解"${userMsg}"相关的内容。\n\n目前我可以帮你：\n• 导航到任意页面\n• 分析视频内容\n• 生成分析报告\n• 查看任务和通知\n\n请告诉我具体需要什么帮助？`
      }

      addMessage('assistant', reply)
      isProcessing.value = false
    }, 600 + Math.random() * 600)
  }

  function sendMessage(content) {
    log.action('发送消息', { content })
    addMessage('user', content)
    simulateReply(content)
  }

  function clearHistory() {
    log.action('清空对话历史', { messageCount: messages.value.length })
    // 清空并重新添加欢迎消息，使用新数组触发响应式更新
    messages.value = [{
      id: `m0_${Date.now()}`,
      role: 'assistant',
      content: defaultMessages[0].content,
      timestamp: new Date().toISOString()
    }]
  }

  return { messages, isExpanded, isBubbleMenuOpen, isListening, isProcessing, position, addMessage, sendMessage, clearHistory }
})
