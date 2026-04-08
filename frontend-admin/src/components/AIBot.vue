<template>
  <div class="ai-bot" :style="botStyle">
    <!-- 悬浮机器人 -->
    <div
      class="ai-bot__avatar"
      :class="{ 'is-active': aiStore.isBubbleMenuOpen || aiStore.isExpanded, 'is-processing': aiStore.isProcessing }"
      @mousedown="startDrag"
      @touchstart.passive="startTouchDrag"
      @click.stop="toggleBubbleMenu"
    >
      <div class="ai-bot__avatar-inner">
        <svg viewBox="0 0 64 64" class="ai-bot__icon">
          <circle cx="32" cy="28" r="16" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="26" cy="25" r="2.5" fill="currentColor"/>
          <circle cx="38" cy="25" r="2.5" fill="currentColor"/>
          <path d="M25 32 Q32 38 39 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="32" y1="12" x2="32" y2="6" stroke="currentColor" stroke-width="2"/>
          <circle cx="32" cy="4" r="2" fill="currentColor"/>
          <rect x="20" y="44" rx="4" width="24" height="12" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="14" y1="28" x2="8" y2="28" stroke="currentColor" stroke-width="2"/>
          <line x1="56" y1="28" x2="50" y2="28" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <div class="ai-bot__pulse"></div>
      <div class="ai-bot__pulse ai-bot__pulse--delay"></div>
    </div>

    <!-- 气泡菜单 -->
    <transition name="bubble-pop">
      <div v-if="aiStore.isBubbleMenuOpen && !aiStore.isExpanded" class="ai-bot__bubbles">
        <div class="ai-bot__bubble ai-bot__bubble--chat" @click.stop="openChat" title="对话">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div
          v-for="nav in navItems"
          :key="nav.path"
          class="ai-bot__bubble ai-bot__bubble--nav"
          :class="{ 'is-current': route.path === nav.path }"
          @click.stop="navigateTo(nav.path)"
          :title="nav.label"
        >
          <el-icon><component :is="nav.icon" /></el-icon>
        </div>
      </div>
    </transition>
  </div>

  <!-- 模态框对话面板 -->
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="aiStore.isExpanded" class="ai-bot-modal" @click.self="closeChat">
        <div class="ai-bot-modal__content" @click.stop>
          <div class="ai-bot-modal__header">
            <div class="ai-bot-modal__title">
              <svg viewBox="0 0 64 64" class="ai-bot-modal__icon">
                <circle cx="32" cy="28" r="16" fill="none" stroke="currentColor" stroke-width="2"/>
                <circle cx="26" cy="25" r="2.5" fill="currentColor"/>
                <circle cx="38" cy="25" r="2.5" fill="currentColor"/>
                <path d="M25 32 Q32 38 39 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>AI 助手</span>
            </div>
            <div class="ai-bot-modal__actions">
              <el-icon class="ai-bot-modal__btn" @click="closeChat" title="关闭"><Close /></el-icon>
            </div>
          </div>
          <div class="ai-bot-modal__messages" ref="messagesRef">
            <div v-for="msg in aiStore.messages" :key="msg.id" class="ai-bot-modal__message" :class="`ai-bot-modal__message--${msg.role}`">
              <div class="ai-bot-modal__message-content">{{ msg.content }}</div>
              <div class="ai-bot-modal__message-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
            <div v-if="aiStore.isProcessing" class="ai-bot-modal__message ai-bot-modal__message--assistant">
              <div class="ai-bot-modal__typing"><span></span><span></span><span></span></div>
            </div>
          </div>
          <div class="ai-bot-modal__input">
            <el-input
              v-model="inputText"
              :placeholder="aiStore.isListening ? '正在聆听...' : '输入消息或点击麦克风语音输入'"
              @keyup.enter="sendMessage"
              :disabled="aiStore.isProcessing || aiStore.isListening"
              size="large"
            >
              <template #suffix>
                <el-icon 
                  class="ai-bot-modal__mic" 
                  :class="{ 'is-listening': aiStore.isListening, 'is-unsupported': !speechSupported }" 
                  @click="toggleVoice"
                  :title="speechSupported ? '语音输入' : '浏览器不支持语音识别'"
                >
                  <Microphone />
                </el-icon>
              </template>
            </el-input>
            <el-button type="primary" :icon="Promotion" @click="sendMessage" :loading="aiStore.isProcessing">发送</el-button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAIStore } from '@/stores/ai'
import { useVideoStore } from '@/stores/video'
import { createSpeechRecognition, isSpeechRecognitionSupported } from '@/utils/speech'
import { parseVoiceCommand, getCommandRoute, getCommandResponse } from '@/utils/voiceCommands'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Promotion, Microphone, Close, Odometer, VideoCamera, DataAnalysis, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const aiStore = useAIStore()
const videoStore = useVideoStore()

const messagesRef = ref(null)
const inputText = ref('')
const isDragging = ref(false)
const speechRecognition = ref(null)
const speechSupported = ref(false)

const analysisVideoId = computed(() => {
  const analyzed = videoStore.videos.find(v => v.hasAIAnalysis)
  return analyzed?.id || videoStore.videos[0]?.id || 'v001'
})

const navItems = computed(() => [
  { path: '/', label: '驾驶舱', icon: Odometer },
  { path: '/videos', label: '视频库', icon: VideoCamera },
  { path: `/analysis/${analysisVideoId.value}`, label: '视频分析', icon: DataAnalysis },
  { path: '/settings', label: '个人中心', icon: Setting }
])

const botStyle = computed(() => {
  // 在小屏幕上不使用 JS 定位，由 CSS 控制
  if (typeof window !== 'undefined' && window.innerWidth <= 640) {
    return {}
  }
  return {
    left: `${aiStore.position.x}px`,
    top: `${aiStore.position.y}px`
  }
})

// 确保 bot 位置在视口内
function clampPosition() {
  if (typeof window === 'undefined') return
  const maxX = window.innerWidth - 70
  const maxY = window.innerHeight - 70
  if (aiStore.position.x > maxX) aiStore.position.x = Math.max(0, maxX)
  if (aiStore.position.y > maxY) aiStore.position.y = Math.max(0, maxY)
}

onMounted(() => {
  speechSupported.value = isSpeechRecognitionSupported()
  if (speechSupported.value) {
    speechRecognition.value = createSpeechRecognition({
      lang: 'zh-CN',
      onStart: () => {
        aiStore.isListening = true
        ElMessage.info('语音识别已启动，请说话...')
      },
      onEnd: () => {
        aiStore.isListening = false
      },
      onResult: ({ transcript, isFinal }) => {
        inputText.value = transcript
        if (isFinal && transcript.trim()) {
          sendMessage()
        }
      },
      onError: ({ message }) => {
        aiStore.isListening = false
        ElMessage.warning(message)
      }
    })
  }
  
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleOutsideClick)
  }
  
  // 确保初始位置在视口内
  clampPosition()
  window.addEventListener('resize', clampPosition)
})

onUnmounted(() => {
  if (speechRecognition.value) {
    speechRecognition.value.abort()
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleOutsideClick)
  }
  window.removeEventListener('resize', clampPosition)
})

function startDrag(e) {
  isDragging.value = false
  const startX = e.clientX
  const startY = e.clientY
  const startPosX = aiStore.position.x
  const startPosY = aiStore.position.y

  const onMove = (ev) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.value = true
    aiStore.position.x = Math.max(0, Math.min(window.innerWidth - 70, startPosX + dx))
    aiStore.position.y = Math.max(0, Math.min(window.innerHeight - 70, startPosY + dy))
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function startTouchDrag(e) {
  if (e.touches.length !== 1) return
  isDragging.value = false
  const touch = e.touches[0]
  const startX = touch.clientX
  const startY = touch.clientY
  const startPosX = aiStore.position.x
  const startPosY = aiStore.position.y

  const onTouchMove = (ev) => {
    if (ev.touches.length !== 1) return
    const t = ev.touches[0]
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.value = true
    aiStore.position.x = Math.max(0, Math.min(window.innerWidth - 70, startPosX + dx))
    aiStore.position.y = Math.max(0, Math.min(window.innerHeight - 70, startPosY + dy))
  }
  const onTouchEnd = () => {
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
    document.removeEventListener('touchcancel', onTouchEnd)
  }
  document.addEventListener('touchmove', onTouchMove, { passive: true })
  document.addEventListener('touchend', onTouchEnd)
  document.addEventListener('touchcancel', onTouchEnd)
}

function toggleBubbleMenu() {
  if (isDragging.value) return
  if (aiStore.isExpanded) {
    closeChat()
    return
  }
  aiStore.isBubbleMenuOpen = !aiStore.isBubbleMenuOpen
}

function openChat() {
  aiStore.isBubbleMenuOpen = false
  aiStore.isExpanded = true
  nextTick(() => scrollToBottom())
}

function closeChat() {
  aiStore.isExpanded = false
  if (aiStore.isListening && speechRecognition.value) {
    speechRecognition.value.stop()
  }
}

function navigateTo(path) {
  aiStore.isBubbleMenuOpen = false
  router.push(path)
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || aiStore.isProcessing) return
  inputText.value = ''
  
  const result = parseVoiceCommand(text)
  
  if (result.matched && result.confidence > 0.5) {
    const targetRoute = getCommandRoute(result.command)
    const response = getCommandResponse(result.command)
    
    aiStore.sendMessage(text)
    
    if (response) {
      setTimeout(() => {
        aiStore.messages.push({
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        })
      }, 300)
    }
    
    if (targetRoute) {
      setTimeout(() => {
        if (result.command === 'analysis') {
          router.push(`/analysis/${analysisVideoId.value}`)
        } else {
          router.push(targetRoute)
        }
      }, 500)
    }
  } else {
    aiStore.sendMessage(text)
  }
}

function toggleVoice() {
  if (!speechSupported.value) {
    ElMessage.warning('当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器')
    return
  }
  if (aiStore.isListening) {
    speechRecognition.value?.stop()
  } else {
    speechRecognition.value?.start()
  }
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

watch(() => aiStore.messages.length, () => nextTick(scrollToBottom))

const handleOutsideClick = () => {
  aiStore.isBubbleMenuOpen = false
}
</script>

<style lang="scss" src="./AIBot.scss" />
