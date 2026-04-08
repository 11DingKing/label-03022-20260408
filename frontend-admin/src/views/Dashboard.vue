<template>
  <div class="dashboard">
    <!-- 背景星空粒子 -->
    <div class="dashboard__bg">
      <div class="dashboard__stars" v-for="n in 50" :key="n" :style="starStyle(n)"></div>
    </div>

    <!-- HUD 边框装饰 -->
    <div class="dashboard__hud-frame">
      <div class="dashboard__hud-corner dashboard__hud-corner--tl"></div>
      <div class="dashboard__hud-corner dashboard__hud-corner--tr"></div>
      <div class="dashboard__hud-corner dashboard__hud-corner--bl"></div>
      <div class="dashboard__hud-corner dashboard__hud-corner--br"></div>
      <div class="dashboard__hud-scanline"></div>
    </div>

    <!-- 顶部信息区 -->
    <div class="dashboard__top">
      <!-- 左上：日期 + 任务 -->
      <div class="dashboard__top-left">
        <div class="dashboard__date">
          <div class="dashboard__date-day text-mono">{{ currentDate.day }}</div>
          <div class="dashboard__date-info">
            <span class="dashboard__date-weekday">{{ currentDate.weekday }}</span>
            <span class="dashboard__date-full">{{ currentDate.full }}</span>
          </div>
        </div>
        <div class="dashboard__tasks glow-border">
          <div class="dashboard__section-label">
            <el-icon><Calendar /></el-icon>
            今日任务
          </div>
          <div class="dashboard__tasks-scroll" ref="taskScrollRef" @mouseenter="pauseScroll('task')" @mouseleave="resumeScroll('task')">
            <!-- 原始内容 -->
            <div class="dashboard__tasks-inner" ref="taskInnerRef">
              <div
                v-for="task in dashStore.tasks"
                :key="task.id"
                class="dashboard__task-item"
              >
                <span class="dashboard__task-dot" :class="`is-${task.status}`"></span>
                <span class="dashboard__task-title">{{ task.title }}</span>
                <span class="dashboard__task-due">{{ task.dueDate }}</span>
              </div>
            </div>
            <!-- 复制内容实现无缝循环 -->
            <div class="dashboard__tasks-inner" aria-hidden="true">
              <div
                v-for="task in dashStore.tasks"
                :key="'dup-' + task.id"
                class="dashboard__task-item"
              >
                <span class="dashboard__task-dot" :class="`is-${task.status}`"></span>
                <span class="dashboard__task-title">{{ task.title }}</span>
                <span class="dashboard__task-due">{{ task.dueDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右上：通知 -->
      <div class="dashboard__top-right">
        <div class="dashboard__notifications glow-border">
          <div class="dashboard__section-label">
            <el-icon><Bell /></el-icon>
            系统通知
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="dashboard__badge" />
          </div>
          <div class="dashboard__notif-scroll" ref="notifScrollRef" @mouseenter="pauseScroll('notif')" @mouseleave="resumeScroll('notif')">
            <!-- 原始内容 -->
            <div class="dashboard__notif-inner" ref="notifInnerRef">
              <div
                v-for="notification in dashStore.notifications"
                :key="notification.id"
                class="dashboard__notif-item"
                :class="{ 'is-unread': !notification.isRead }"
              >
                <div class="dashboard__notif-title">{{ notification.title }}</div>
                <div class="dashboard__notif-content">{{ notification.content }}</div>
                <div class="dashboard__notif-time">{{ formatNotifTime(notification.createdAt) }}</div>
              </div>
            </div>
            <!-- 复制内容实现无缝循环 -->
            <div class="dashboard__notif-inner" aria-hidden="true">
              <div
                v-for="notification in dashStore.notifications"
                :key="'dup-' + notification.id"
                class="dashboard__notif-item"
                :class="{ 'is-unread': !notification.isRead }"
              >
                <div class="dashboard__notif-title">{{ notification.title }}</div>
                <div class="dashboard__notif-content">{{ notification.content }}</div>
                <div class="dashboard__notif-time">{{ formatNotifTime(notification.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 中央挡风玻璃区域 -->
    <div class="dashboard__center">
      <div class="dashboard__windshield">
        <!-- 挡风玻璃边框 -->
        <div class="dashboard__windshield-frame">
          <svg class="dashboard__windshield-svg" viewBox="0 0 500 350" preserveAspectRatio="none">
            <defs>
              <linearGradient id="windshieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(0,212,255,0.15)"/>
                <stop offset="50%" style="stop-color:rgba(139,92,246,0.08)"/>
                <stop offset="100%" style="stop-color:rgba(0,212,255,0.15)"/>
              </linearGradient>
            </defs>
            <path d="M50,10 Q250,-20 450,10 L480,280 Q250,340 20,280 Z" fill="url(#windshieldGrad)" stroke="rgba(0,212,255,0.3)" stroke-width="1.5"/>
            <!-- HUD 网格线 -->
            <line x1="100" y1="50" x2="100" y2="280" stroke="rgba(0,212,255,0.08)" stroke-width="0.5"/>
            <line x1="200" y1="30" x2="200" y2="300" stroke="rgba(0,212,255,0.08)" stroke-width="0.5"/>
            <line x1="300" y1="30" x2="300" y2="300" stroke="rgba(0,212,255,0.08)" stroke-width="0.5"/>
            <line x1="400" y1="50" x2="400" y2="280" stroke="rgba(0,212,255,0.08)" stroke-width="0.5"/>
            <line x1="60" y1="100" x2="440" y2="100" stroke="rgba(0,212,255,0.06)" stroke-width="0.5"/>
            <line x1="40" y1="180" x2="460" y2="180" stroke="rgba(0,212,255,0.06)" stroke-width="0.5"/>
            <line x1="60" y1="260" x2="440" y2="260" stroke="rgba(0,212,255,0.06)" stroke-width="0.5"/>
          </svg>
        </div>
        
        <!-- 雷达扫描效果 -->
        <div class="dashboard__radar">
          <div class="dashboard__radar-ring"></div>
          <div class="dashboard__radar-ring dashboard__radar-ring--2"></div>
          <div class="dashboard__radar-sweep"></div>
          <div class="dashboard__radar-dot" v-for="dot in radarDots" :key="dot.id" :style="dot.style"></div>
        </div>

        <!-- AI机器人区域：展示问候语，交互由全局 AIBot 组件提供（支持拖拽） -->
        <div class="dashboard__ai-figure">
          <div class="dashboard__ai-greeting">{{ greeting }}</div>
          <div class="dashboard__ai-hint">拖拽AI助手到此区域 · 点击开始对话</div>
        </div>

        <!-- 状态指示器 -->
        <div class="dashboard__status-indicators">
          <div class="dashboard__status-item">
            <span class="dashboard__status-dot is-online"></span>
            <span>系统在线</span>
          </div>
          <div class="dashboard__status-item">
            <span class="dashboard__status-dot is-active"></span>
            <span>AI就绪</span>
          </div>
          <div class="dashboard__status-item">
            <span class="dashboard__status-dot" :class="isVoiceReady ? 'is-online' : 'is-standby'"></span>
            <span>语音{{ isVoiceReady ? '就绪' : '待机' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部仪表盘 -->
    <div class="dashboard__bottom">
      <!-- 左侧圆形仪表 -->
      <div class="dashboard__circular-gauges">
        <div class="dashboard__circular-gauge" v-for="gauge in circularGauges" :key="gauge.key">
          <svg viewBox="0 0 100 100" class="dashboard__circular-svg">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,180,214,0.1)" stroke-width="4"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gaugeGradient)" stroke-width="4"
              :stroke-dasharray="`${gauge.percent * 2.64} 264`" stroke-linecap="round"
              transform="rotate(-90 50 50)" class="dashboard__circular-progress"/>
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#00d4ff"/>
                <stop offset="100%" style="stop-color:#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="dashboard__circular-content">
            <span class="dashboard__circular-value text-mono">{{ gauge.value }}</span>
            <span class="dashboard__circular-unit">{{ gauge.unit }}</span>
          </div>
          <div class="dashboard__circular-label">{{ gauge.label }}</div>
        </div>
      </div>

      <!-- 中央数据条：展示视频处理状态、合规率、今日视频数、生成报告（G/P/T已在左侧圆形仪表展示，此处不重复） -->
      <div class="dashboard__gauges">
        <div
          v-for="(stat, key) in secondaryStats"
          :key="key"
          class="dashboard__gauge glow-border"
        >
          <div class="dashboard__gauge-icon">
            <el-icon><component :is="getGaugeIcon(key)" /></el-icon>
          </div>
          <div class="dashboard__gauge-value">
            <span class="text-mono dashboard__gauge-num">{{ stat.value }}</span>
            <span class="dashboard__gauge-unit">{{ stat.unit }}</span>
          </div>
          <div class="dashboard__gauge-label">{{ stat.label }}</div>
          <div class="dashboard__gauge-trend" :class="stat.trend >= 0 ? 'is-up' : 'is-down'">
            <el-icon><ArrowUp v-if="stat.trend >= 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(stat.trend) }}%
          </div>
          <div class="dashboard__gauge-bar">
            <div class="dashboard__gauge-bar-fill" :style="{ width: `${Math.min(100, stat.value / getMaxForKey(key) * 100)}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 右侧迷你雷达 -->
      <div class="dashboard__mini-radar">
        <div class="dashboard__mini-radar-ring"></div>
        <div class="dashboard__mini-radar-cross"></div>
        <div class="dashboard__mini-radar-sweep"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAIStore } from '@/stores/ai'
import { Calendar, Bell, ArrowUp, ArrowDown, DataLine, Folder, Cpu, Document } from '@element-plus/icons-vue'

const dashStore = useDashboardStore()
const aiStore = useAIStore()
const isVoiceReady = ref(false)

// 雷达点位数据
const radarDots = ref([
  { id: 1, style: { left: '30%', top: '40%', animationDelay: '0s' } },
  { id: 2, style: { left: '65%', top: '55%', animationDelay: '0.5s' } },
  { id: 3, style: { left: '45%', top: '70%', animationDelay: '1s' } }
])

// 圆形仪表数据 - 展示 G/P/T 三大核心业务指标
const circularGauges = computed(() => {
  const s = dashStore.stats
  return [
    { key: 'bandwidth', label: 'G消耗流量', value: s.bandwidth.value, unit: s.bandwidth.unit, percent: Math.min(100, (s.bandwidth.value / 200) * 100) },
    { key: 'storage', label: 'P消耗存储', value: s.storage.value, unit: s.storage.unit, percent: Math.min(100, (s.storage.value / 5) * 100) },
    { key: 'tokens', label: 'T消耗Tokens', value: s.tokens.value, unit: s.tokens.unit, percent: Math.min(100, (s.tokens.value / 1000) * 100) }
  ]
})

// 底部列表只展示非 G/P/T 的指标，避免与左侧圆形仪表重复
const secondaryStats = computed(() => {
  const exclude = new Set(['bandwidth', 'storage', 'tokens'])
  return Object.fromEntries(
    Object.entries(dashStore.stats).filter(([k]) => !exclude.has(k))
  )
})

const currentDate = computed(() => {
  const d = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return {
    day: d.getDate(),
    weekday: weekdays[d.getDay()],
    full: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，注意休息'
  if (h < 12) return '早上好，新的一天开始了'
  if (h < 18) return '下午好，工作顺利'
  return '晚上好，辛苦了'
})

const unreadCount = computed(() => dashStore.notifications.filter(n => !n.isRead).length)

function starStyle(n) {
  const seed = n * 137.5
  return {
    left: `${(seed * 7) % 100}%`,
    top: `${(seed * 13) % 100}%`,
    width: `${1 + (seed % 3)}px`,
    height: `${1 + (seed % 3)}px`,
    animationDelay: `${(seed % 5)}s`,
    animationDuration: `${2 + (seed % 3)}s`
  }
}

function getMaxForKey(key) {
  const maxMap = { bandwidth: 200, storage: 5, tokens: 1000, analyzed: 300, pending: 100, compliance: 100, todayVideos: 30, reports: 500 }
  return maxMap[key] || 100
}

function getGaugeIcon(key) {
  const iconMap = { bandwidth: 'DataLine', storage: 'Folder', tokens: 'Cpu', analyzed: 'Document', pending: 'Document', compliance: 'Document', todayVideos: 'Document', reports: 'Document' }
  return iconMap[key] || 'Document'
}

function formatNotifTime(ts) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 无缝循环滚动
const taskScrollRef = ref(null)
const notifScrollRef = ref(null)
const taskInnerRef = ref(null)
const notifInnerRef = ref(null)
const scrollPaused = ref({ task: false, notif: false })
let scrollTimer = null

function pauseScroll(type) { scrollPaused.value[type] = true }
function resumeScroll(type) { scrollPaused.value[type] = false }

onMounted(() => {
  // 检测语音API
  isVoiceReady.value = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // 在驾驶舱页面，将全局 AIBot 初始位置移到中央区域
  if (typeof window !== 'undefined') {
    aiStore.position.x = Math.floor(window.innerWidth / 2) - 35
    aiStore.position.y = Math.floor(window.innerHeight / 2) - 80
  }

  scrollTimer = setInterval(() => {
    // 任务列表循环滚动
    if (!scrollPaused.value.task && taskScrollRef.value && taskInnerRef.value) {
      const el = taskScrollRef.value
      const innerH = taskInnerRef.value.offsetHeight
      el.scrollTop += 1
      if (innerH > 0 && el.scrollTop >= innerH) {
        el.scrollTop = 0
      }
    }
    // 通知列表循环滚动
    if (!scrollPaused.value.notif && notifScrollRef.value && notifInnerRef.value) {
      const el = notifScrollRef.value
      const innerH = notifInnerRef.value.offsetHeight
      el.scrollTop += 1
      if (innerH > 0 && el.scrollTop >= innerH) {
        el.scrollTop = 0
      }
    }
  }, 50)
})

onUnmounted(() => {
  clearInterval(scrollTimer)
})
</script>

<style lang="scss" src="./Dashboard.scss" />
