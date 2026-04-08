<template>
  <div class="analysis">
    <div class="analysis__left">
      <!-- 视频播放器组件 -->
      <VideoPlayer
        ref="playerRef"
        :src="videoSrc"
        :video-name="video?.name"
        :show-demo-selector="!video?.url"
        :demo-videos="demoVideos"
        :initial-demo-index="currentDemoIndex"
        @time-update="onTimeUpdate"
        @duration-change="onDurationChange"
        @demo-change="onDemoChange"
      />

      <!-- 截图和标注工具栏 -->
      <div class="analysis__screenshot-toolbar glow-border">
        <div class="analysis__section-title">
          <el-icon><Camera /></el-icon> 截图标注
        </div>
        <div class="analysis__screenshot-actions">
          <el-button type="primary" @click="takeScreenshot">
            <el-icon><Camera /></el-icon> 截图
          </el-button>
          <el-button 
            v-if="showAnnotationCanvas" 
            type="success" 
            @click="startAnnotation"
            :disabled="isAnnotating"
          >
            <el-icon><Pointer /></el-icon> 矩形标注
          </el-button>
          <el-button 
            v-if="showAnnotationCanvas && isAnnotating" 
            type="warning" 
            @click="cancelAnnotation"
          >
            <el-icon><Close /></el-icon> 取消标注
          </el-button>
          <el-button 
            v-if="showAnnotationCanvas && currentAnnotation" 
            type="primary" 
            @click="openRemarkDialog"
          >
            <el-icon><Edit /></el-icon> 添加备注
          </el-button>
          <el-button 
            v-if="showAnnotationCanvas" 
            type="success" 
            @click="saveAnnotation"
          >
            <el-icon><Check /></el-icon> 保存标注
          </el-button>
          <el-button 
            v-if="showAnnotationCanvas" 
            @click="closeAnnotationCanvas"
          >
            <el-icon><Close /></el-icon> 关闭
          </el-button>
        </div>
      </div>

      <!-- 标注画布 -->
      <div v-if="showAnnotationCanvas" class="analysis__annotation-canvas glow-border">
        <div class="analysis__section-title">
          <el-icon><Picture /></el-icon> 截图预览 ({{ formatTime(screenshotTime) }})
          <span v-if="isAnnotating" class="analysis__annotation-hint">拖拽鼠标绘制矩形标注</span>
        </div>
        <div class="analysis__canvas-container" ref="canvasContainerRef">
          <canvas 
            ref="screenshotCanvasRef" 
            class="analysis__canvas"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseUp"
          ></canvas>
        </div>
      </div>

      <!-- 视频标签 -->
      <div class="analysis__tags glow-border">
        <div class="analysis__section-title">
          <el-icon><PriceTag /></el-icon> 视频标签
          <el-button size="small" text type="primary" @click="editingTags = true" v-if="!editingTags">编辑</el-button>
        </div>
        <div v-if="!editingTags" class="analysis__tags-list">
          <el-tag v-for="tag in video?.tags || []" :key="tag" effect="plain">{{ tag }}</el-tag>
          <el-tag v-if="!video?.tags?.length" type="info">暂无标签</el-tag>
        </div>
        <div v-else class="analysis__tags-edit">
          <div style="display: flex; gap: 8px; align-items: center">
            <el-input v-model="newTag" placeholder="输入标签" size="small" @keyup.enter="addTag" />
            <el-button size="small" type="primary" round @click="addTag">添加</el-button>
          </div>
          <div class="analysis__tags-list" style="margin-top: 8px">
            <el-tag v-for="tag in editTags" :key="tag" closable @close="removeTag(tag)">{{ tag }}</el-tag>
          </div>
          <div style="margin-top: 8px; display: flex; gap: 8px">
            <el-button size="small" type="primary" @click="saveTags">保存</el-button>
            <el-button size="small" @click="editingTags = false">取消</el-button>
          </div>
        </div>
      </div>

      <!-- 时间轴组件 -->
      <VideoTimeline
        ref="timelineRef"
        :events="timelineEvents"
        :duration="totalDuration"
        :progress="playProgress"
        @jump="jumpTo"
        @selectionChange="onSelectionChange"
      />

      <!-- 合规性检测 -->
      <div v-if="settingsStore.sopComplianceEnabled" class="analysis__compliance glow-border">
        <div class="analysis__section-title">
          <el-icon><Warning /></el-icon> 合规性检测
          <el-tag v-if="complianceResult" size="small" :type="complianceResult.summary.passRate >= 80 ? 'success' : 'danger'" effect="plain" style="margin-left: 8px">
            通过率 {{ complianceResult.summary.passRate }}%
          </el-tag>
          <el-button size="small" text type="primary" :loading="detecting" @click="reDetect" style="margin-left: auto">重新检测</el-button>
        </div>
        <!-- 内容匹配度 -->
        <div v-if="contentMismatch" class="analysis__compliance-mismatch">
          <el-icon :color="contentMismatch.matchRate >= 80 ? '#22c55e' : '#f59e0b'">
            <CircleCheck v-if="contentMismatch.matchRate >= 80" /><Warning v-else />
          </el-icon>
          <span>内容匹配度：{{ contentMismatch.matchRate }}%</span>
          <span class="analysis__compliance-time">{{ contentMismatch.detail }}</span>
        </div>
        <div class="analysis__compliance-items">
          <div v-for="item in complianceItems" :key="item.label" class="analysis__compliance-item" :title="item.detail">
            <el-icon :color="item.pass ? '#22c55e' : '#ef4444'">
              <CircleCheck v-if="item.pass" /><CircleClose v-else />
            </el-icon>
            <span>{{ item.label }}</span>
            <el-tag v-if="item.severity === 'high' && !item.pass" size="small" type="danger" effect="plain" style="margin-left: 4px; font-size: 10px">高</el-tag>
            <span class="analysis__compliance-time">{{ item.time }}</span>
          </div>
        </div>
        <div v-if="complianceItems.some(i => !i.pass)" class="analysis__compliance-suggestion">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ complianceItems.find(i => !i.pass)?.suggestion }}</span>
        </div>
      </div>
      <div v-else class="analysis__compliance-disabled glow-border">
        <div class="analysis__section-title"><el-icon><Warning /></el-icon> 合规性检测</div>
        <div class="analysis__compliance-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>合规性检测已关闭，可在「个人中心 → 合规性检测」中开启</span>
        </div>
      </div>
    </div>

    <div class="analysis__right">
      <div class="analysis__right-header">
        <el-tooltip content="演示模式：将生成模拟报告数据" placement="bottom" :show-after="800">
          <el-button type="primary" @click="openReportDialog">
            <el-icon><Document /></el-icon> 生成报告
          </el-button>
        </el-tooltip>
        <el-tooltip content="演示模式：将生成模拟SOP数据" placement="bottom" :show-after="800">
          <el-button @click="generateSopFromVideo" :loading="generatingSop">
            <el-icon><DocumentAdd /></el-icon> 生成SOP
          </el-button>
        </el-tooltip>
      </div>

      <!-- 标注历史列表 -->
      <div class="analysis__annotation-history glow-border">
        <div class="analysis__section-title">
          <el-icon><List /></el-icon> 标注历史
          <el-tag v-if="annotationHistory.length > 0" size="small" type="info" effect="plain">
            {{ annotationHistory.length }} 条
          </el-tag>
        </div>
        <div v-if="annotationHistory.length === 0" class="analysis__annotation-empty">
          <el-icon :size="40"><Picture /></el-icon>
          <span>暂无标注记录</span>
          <span class="analysis__annotation-hint-text">点击上方「截图」按钮开始标注</span>
        </div>
        <div v-else class="analysis__annotation-list">
          <div 
            v-for="(item, index) in annotationHistory" 
            :key="item.id" 
            class="analysis__annotation-item"
            :class="{ 'is-active': selectedAnnotationId === item.id }"
            @click="jumpToAnnotation(item)"
          >
            <div class="analysis__annotation-thumbnail">
              <img :src="item.thumbnail" :alt="`标注 ${index + 1}`" />
              <div class="analysis__annotation-time">{{ formatTime(item.time) }}</div>
            </div>
            <div class="analysis__annotation-info">
              <div class="analysis__annotation-title">标注 #{{ index + 1 }}</div>
              <div v-if="item.remark" class="analysis__annotation-remark">{{ item.remark }}</div>
              <div v-else class="analysis__annotation-no-remark">暂无备注</div>
              <div class="analysis__annotation-meta">
                <span>{{ item.annotations.length }} 个标注区域</span>
                <span>{{ formatDateTime(item.createdAt) }}</span>
              </div>
            </div>
            <div class="analysis__annotation-actions">
              <el-button size="small" text type="primary" @click.stop="viewAnnotationDetail(item)">
                <el-icon><View /></el-icon>
              </el-button>
              <el-button size="small" text type="danger" @click.stop="deleteAnnotation(item.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 摘要 -->
      <div class="analysis__summary glow-border">
        <div class="analysis__section-title"><el-icon><MagicStick /></el-icon> AI 智能摘要</div>
        <div class="analysis__summary-content">{{ summary }}</div>
      </div>

      <!-- AI 对话 -->
      <div class="analysis__chat glow-border">
        <div class="analysis__section-title"><el-icon><ChatDotRound /></el-icon> AI 对话分析</div>
        <div class="analysis__chat-messages" ref="chatRef">
          <div v-for="msg in chatMessages" :key="msg.id" class="analysis__chat-msg" :class="'is-' + msg.role">
            <div class="analysis__chat-msg-content">{{ msg.content }}</div>
          </div>
        </div>
        <div class="analysis__chat-input">
          <el-input 
            v-model="chatInput" 
            :placeholder="isListening ? '正在聆听...' : '输入问题或点击麦克风语音输入'" 
            @keyup.enter="sendChat" 
            :disabled="isListening"
          >
            <template #suffix>
              <el-icon class="analysis__mic" :class="{ 'is-listening': isListening }" @click="toggleMic">
                <Microphone />
              </el-icon>
            </template>
          </el-input>
          <el-button type="primary" :icon="Promotion" circle @click="sendChat" />
        </div>
      </div>

      <!-- 语音转文字 -->
      <div class="analysis__transcript glow-border">
        <div class="analysis__section-title">
          <el-icon><Headset /></el-icon> 语音转文字
          <el-button size="small" text type="primary" @click="copyTranscript">
            <el-icon><CopyDocument /></el-icon> 复制
          </el-button>
        </div>
        <div class="analysis__transcript-content">{{ transcript }}</div>
      </div>
    </div>

    <!-- 备注对话框 -->
    <el-dialog v-model="showRemarkDialog" title="添加备注" width="400px">
      <el-input
        v-model="currentRemark"
        type="textarea"
        :rows="4"
        placeholder="请输入备注内容..."
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showRemarkDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRemark">确认</el-button>
      </template>
    </el-dialog>

    <!-- 标注详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="标注详情" width="700px">
      <div v-if="selectedAnnotation" class="analysis__detail-content">
        <div class="analysis__detail-header">
          <div class="analysis__detail-time">
            <el-icon><Clock /></el-icon>
            <span>时间点: {{ formatTime(selectedAnnotation.time) }}</span>
          </div>
          <div class="analysis__detail-count">
            <el-icon><Pointer /></el-icon>
            <span>{{ selectedAnnotation.annotations.length }} 个标注区域</span>
          </div>
        </div>
        <div class="analysis__detail-canvas">
          <canvas ref="detailCanvasRef" class="analysis__canvas"></canvas>
        </div>
        <div v-if="selectedAnnotation.remark" class="analysis__detail-remark">
          <div class="analysis__detail-remark-title">
            <el-icon><Edit /></el-icon> 备注
          </div>
          <div class="analysis__detail-remark-content">{{ selectedAnnotation.remark }}</div>
        </div>
        <div class="analysis__detail-annotations">
          <div class="analysis__detail-annotations-title">
            <el-icon><List /></el-icon> 标注区域列表
          </div>
          <div 
            v-for="(ann, idx) in selectedAnnotation.annotations" 
            :key="idx" 
            class="analysis__detail-annotation-item"
          >
            <div class="analysis__detail-annotation-index">#{{ idx + 1 }}</div>
            <div class="analysis__detail-annotation-coords">
              位置: ({{ Math.round(ann.x) }}, {{ Math.round(ann.y) }})
              大小: {{ Math.round(ann.width) }} × {{ Math.round(ann.height) }}
            </div>
            <div v-if="ann.remark" class="analysis__detail-annotation-remark">
              备注: {{ ann.remark }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 报告导出组件 -->
    <ReportExporter v-model="showReport" :report-data="reportData" @exported="onReportExported" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useVideoStore } from '@/stores/video'
import { useSettingsStore } from '@/stores/settings'
import { createSpeechRecognition, isSpeechRecognitionSupported } from '@/utils/speech'
import { ElMessage } from 'element-plus'
import { 
  PriceTag, Warning, Document, DocumentAdd, MagicStick, ChatDotRound, Microphone, 
  Headset, Promotion, CircleCheck, CircleClose, InfoFilled, CopyDocument,
  Camera, Pointer, Edit, Check, Close, Picture, List, View, Delete, Clock
} from '@element-plus/icons-vue'
import { runComplianceDetection, extractRulesFromSop, detectContentMismatch } from '@/utils/complianceDetector'
import { createLogger } from '@/utils/logger'

const log = createLogger('VideoAnalysis')

// 子组件
import VideoPlayer from '@/components/VideoPlayer.vue'
import VideoTimeline from '@/components/VideoTimeline.vue'
import ReportExporter from '@/components/ReportExporter.vue'

const route = useRoute()
const videoStore = useVideoStore()
const settingsStore = useSettingsStore()

const playerRef = ref(null)
const timelineRef = ref(null)

// Mixkit 免费工厂/工业视频素材（可直链播放）
const demoVideos = [
  { name: '食品工厂生产线', url: 'https://assets.mixkit.co/videos/21795/21795-720.mp4', duration: 15 },
  { name: '钢材切割车间', url: 'https://assets.mixkit.co/videos/21045/21045-720.mp4', duration: 10 },
  { name: '工厂建筑全景', url: 'https://assets.mixkit.co/videos/15599/15599-720.mp4', duration: 30 },
  { name: '仓库叉车作业', url: 'https://assets.mixkit.co/videos/45848/45848-720.mp4', duration: 25 }
]

// 根据视频 ID 稳定映射到一个演示视频（保证同一视频每次进入看到同一个演示源）
function getDemoIndexForId(id) {
  if (!id) return 0
  const num = parseInt(id.replace(/\D/g, ''), 10) || 0
  return num % demoVideos.length
}

const currentDemoIndex = ref(getDemoIndexForId(route.params.id))

// 视频源：优先使用视频库中的实际 URL，否则使用对应的演示视频
const videoSrc = computed(() => {
  const v = video.value
  if (v?.url) return v.url
  return demoVideos[currentDemoIndex.value]?.url || demoVideos[0].url
})

// 播放状态
const currentTime = ref(0)
const totalDuration = ref(0)
const playProgress = ref(0)

// 标签编辑
const editingTags = ref(false)
const editTags = ref([])
const newTag = ref('')

// 对话
const chatRef = ref(null)
const chatInput = ref('')
const chatMessages = ref([
  { id: 1, role: 'assistant', content: '您好！我是视频分析助手，可以帮您分析视频内容、检测合规性问题。请问有什么需要帮助的？' }
])

// 语音识别
const isListening = ref(false)
const speechSupported = ref(false)
let speechRecognition = null

// 报告
const showReport = ref(false)
const reportData = reactive({
  videoName: '',
  duration: '',
  analysisTime: '',
  complianceResults: [],
  summary: '',
  remarks: ''
})

// SOP 生成
const generatingSop = ref(false)

// 当前视频
const video = computed(() => {
  const id = route.params.id
  return videoStore.videos.find(v => v.id === id) || { name: '示例视频', tags: ['培训', '合规'] }
})

// 时间轴事件（基于视频实际时长）
const timelineEvents = computed(() => {
  const duration = totalDuration.value || 180
  return [
    { time: Math.floor(duration * 0.05), label: '开场白', type: 'info' },
    { time: Math.floor(duration * 0.15), label: '产品介绍', type: 'success' },
    { time: Math.floor(duration * 0.35), label: '风险提示', type: 'warning' },
    { time: Math.floor(duration * 0.55), label: '违规话术', type: 'danger' },
    { time: Math.floor(duration * 0.85), label: '结束语', type: 'info' }
  ]
})

// 转写文本
const transcript = ref('[00:00] 各位好，欢迎参加今天的产品培训...\n[00:15] 首先我来介绍一下我们的核心产品...\n[01:30] 请注意，投资有风险，入市需谨慎...\n[02:00] 这款产品收益稳定，基本上可以保本...\n[02:40] 感谢大家的参与，如有问题请随时联系...')

// 合规性检测（使用检测引擎）
const complianceResult = ref(null)
const complianceItems = computed(() => complianceResult.value?.items || [])
const contentMismatch = ref(null)
const detecting = ref(false)

// AI 摘要（基于检测结果动态生成）
const summary = computed(() => {
  const v = video.value
  const cr = complianceResult.value
  const cm = contentMismatch.value
  
  let text = `本视频为${v?.tags?.join('/')|| '培训'}内容，时长约${Math.ceil(totalDuration.value / 60)}分钟。\n`
  
  if (cr) {
    const failed = cr.items.filter(i => !i.pass)
    text += `合规性检测共 ${cr.summary.total} 项，通过 ${cr.summary.passed} 项，通过率 ${cr.summary.passRate}%。\n`
    if (failed.length > 0) {
      text += `发现 ${failed.length} 处问题：\n`
      failed.forEach(f => { text += `• ${f.detail}\n` })
      text += `建议：${failed[0].suggestion}\n`
    } else {
      text += '所有检测项均通过，内容符合合规要求。\n'
    }
  }
  
  if (cm && cm.matchRate < 80) {
    text += `\n⚠️ 内容匹配度：${cm.matchRate}%。${cm.detail}`
  }
  
  return text
})

// === 截图标注功能 ===
const showAnnotationCanvas = ref(false)
const screenshotCanvasRef = ref(null)
const canvasContainerRef = ref(null)
const screenshotTime = ref(0)
const originalScreenshotImage = ref(null)

// 标注状态
const isAnnotating = ref(false)
const annotations = ref([])
const currentAnnotation = ref(null)
const annotationStartPos = ref(null)

// 备注对话框
const showRemarkDialog = ref(false)
const currentRemark = ref('')

// 标注历史
const annotationHistory = ref([])
const selectedAnnotationId = ref(null)
const selectedAnnotation = ref(null)

// 详情对话框
const showDetailDialog = ref(false)
const detailCanvasRef = ref(null)

/**
 * 执行合规性检测
 */
function runDetection() {
  // 获取当前默认 SOP 的自定义规则
  const defaultSop = settingsStore.sopList.find(s => s.isDefault)
  const customRules = defaultSop ? extractRulesFromSop(defaultSop.content, defaultSop.name) : []
  
  complianceResult.value = runComplianceDetection(transcript.value, {
    customRules,
    videoName: video.value?.name || ''
  })
  
  // 内容匹配度检测
  contentMismatch.value = detectContentMismatch(
    video.value?.name || '',
    video.value?.tags || [],
    transcript.value
  )
  
  log.info('合规性检测完成', complianceResult.value?.summary)
}

/**
 * 重新检测（带 loading 反馈）
 */
function reDetect() {
  detecting.value = true
  complianceResult.value = null
  contentMismatch.value = null
  setTimeout(() => {
    runDetection()
    detecting.value = false
    ElMessage.success(`检测完成，通过率 ${complianceResult.value?.summary?.passRate ?? 0}%`)
  }, 600)
}

// 初始化
onMounted(() => {
  speechSupported.value = isSpeechRecognitionSupported()
  if (speechSupported.value) {
    speechRecognition = createSpeechRecognition({
      lang: 'zh-CN',
      silenceTimeout: 3000,
      onStart: () => { isListening.value = true; ElMessage.info('语音识别已启动，请说话...') },
      onEnd: () => { isListening.value = false },
      onResult: ({ transcript, isFinal }) => { 
        chatInput.value = transcript
        if (isFinal && transcript.trim()) sendChat() 
      },
      onError: ({ message }) => { isListening.value = false; ElMessage.warning(message) }
    })
  }
  editTags.value = [...(video.value?.tags || [])]
  
  // 初始化时长：优先使用视频库中的时长数据
  if (video.value?.duration) {
    totalDuration.value = video.value.duration
  } else {
    totalDuration.value = demoVideos[currentDemoIndex.value]?.duration || 180
  }
  
  // 自动执行合规性检测
  if (settingsStore.sopComplianceEnabled) {
    runDetection()
  }
})

onUnmounted(() => { 
  if (speechRecognition) speechRecognition.abort() 
})

// 播放器事件
function onTimeUpdate(time) {
  currentTime.value = time
  playProgress.value = (time / totalDuration.value) * 100
}

function onDurationChange(duration) {
  totalDuration.value = duration
}

function onDemoChange(index) {
  currentDemoIndex.value = index
  currentTime.value = 0
  playProgress.value = 0
}

function jumpTo(time) {
  playerRef.value?.jumpTo(time)
  currentTime.value = time
  playProgress.value = (time / totalDuration.value) * 100
}

// 时间轴区间选择事件
function onSelectionChange(selection) {
  if (selection) {
    log.info('时间轴区间选择:', selection)
  }
}

// 标签操作
function addTag() {
  if (newTag.value.trim() && !editTags.value.includes(newTag.value.trim())) {
    editTags.value.push(newTag.value.trim())
    newTag.value = ''
  }
}

function removeTag(tag) {
  editTags.value = editTags.value.filter(t => t !== tag)
}

function saveTags() {
  const videoId = route.params.id
  if (videoId) {
    videoStore.updateVideoTags(videoId, [...editTags.value])
  }
  ElMessage.success('标签已保存')
  editingTags.value = false
}

// 复制转写
function copyTranscript() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(transcript.value).then(() => {
      ElMessage.success('已复制到剪贴板')
    }).catch(() => fallbackCopy(transcript.value))
  } else {
    fallbackCopy(transcript.value)
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
  document.body.removeChild(textarea)
}

// 对话
function sendChat() {
  const text = chatInput.value.trim()
  if (!text) return
  chatMessages.value.push({ id: Date.now(), role: 'user', content: text })
  chatInput.value = ''
  
  // 处理语音指令控制视频播放器
  const lowerText = text.toLowerCase()
  if (lowerText.includes('播放') || lowerText.includes('开始')) {
    playerRef.value?.play?.()
    chatMessages.value.push({ id: Date.now() + 1, role: 'assistant', content: '好的，已开始播放视频。' })
    return
  }
  if (lowerText.includes('暂停') || lowerText.includes('停止')) {
    playerRef.value?.pause?.()
    chatMessages.value.push({ id: Date.now() + 1, role: 'assistant', content: '好的，已暂停视频播放。' })
    return
  }
  if (lowerText.includes('快进') || lowerText.includes('前进')) {
    const newTime = Math.min(currentTime.value + 10, totalDuration.value)
    jumpTo(newTime)
    chatMessages.value.push({ id: Date.now() + 1, role: 'assistant', content: '已快进10秒。' })
    return
  }
  if (lowerText.includes('后退') || lowerText.includes('倒退')) {
    const newTime = Math.max(currentTime.value - 10, 0)
    jumpTo(newTime)
    chatMessages.value.push({ id: Date.now() + 1, role: 'assistant', content: '已后退10秒。' })
    return
  }
  if (lowerText.includes('跳转') || lowerText.includes('定位')) {
    // 尝试解析时间，如 "跳转到1分30秒" 或 "定位到90秒"
    const timeMatch = text.match(/(\d+)\s*分\s*(\d+)?\s*秒?/) || text.match(/(\d+)\s*秒/)
    if (timeMatch) {
      let targetTime = 0
      if (timeMatch[2] !== undefined) {
        targetTime = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2])
      } else {
        targetTime = parseInt(timeMatch[1])
      }
      jumpTo(Math.min(targetTime, totalDuration.value))
      chatMessages.value.push({ id: Date.now() + 1, role: 'assistant', content: `已跳转到 ${formatTime(targetTime)}。` })
      return
    }
  }
  
  setTimeout(() => {
    let reply = '我正在分析您的问题，请稍候...'
    if (text.includes('违规') || text.includes('问题')) {
      const failed = complianceItems.value.filter(i => !i.pass)
      if (failed.length > 0) {
        reply = failed.map(f => `• ${f.detail}\n  建议：${f.suggestion}`).join('\n\n')
      } else {
        reply = '当前视频合规性检测全部通过，未发现违规问题。'
      }
    } else if (text.includes('摘要') || text.includes('总结')) {
      reply = summary.value
    } else if (text.includes('生成') && text.includes('SOP')) {
      reply = '好的，我将根据视频分析结果为您生成SOP。请点击下方的"生成SOP"按钮，或稍等片刻...'
      generateSopFromVideo()
    }
    chatMessages.value.push({ id: Date.now() + 1, role: 'assistant', content: reply })
    nextTick(() => { if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight })
  }, 800)
}

// 语音
function toggleMic() {
  if (!speechSupported.value) {
    ElMessage.warning('当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器')
    return
  }
  isListening.value ? speechRecognition?.stop() : speechRecognition?.start()
}

// 报告
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

function formatDateTime(date) {
  const d = new Date(date)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function openReportDialog() {
  // 如果还没有检测结果，先执行检测
  if (!complianceResult.value && settingsStore.sopComplianceEnabled) {
    runDetection()
  }
  
  reportData.videoName = video.value?.name || '示例视频'
  reportData.duration = formatTime(totalDuration.value)
  reportData.analysisTime = new Date().toLocaleString()
  reportData.complianceResults = complianceItems.value.map(item => ({ 
    label: item.label, 
    pass: item.pass, 
    time: item.time 
  }))
  reportData.summary = summary.value
  reportData.remarks = ''
  
  // 添加关键发现
  const findings = []
  const failed = complianceItems.value.filter(i => !i.pass)
  if (failed.length > 0) {
    findings.push(`合规检测发现 ${failed.length} 处问题：`)
    failed.forEach(f => findings.push(`• ${f.detail}`))
  }
  if (contentMismatch.value && contentMismatch.value.matchRate < 80) {
    findings.push(`\n内容匹配度偏低（${contentMismatch.value.matchRate}%）：${contentMismatch.value.detail}`)
  }
  reportData.keyFindings = findings.join('\n')
  
  showReport.value = true
}

function onReportExported({ format }) {
  console.log('报告已导出:', format)
}

// SOP 生成功能
async function generateSopFromVideo() {
  if (generatingSop.value) return
  
  generatingSop.value = true
  ElMessage.info('正在根据视频分析结果生成SOP...')
  
  try {
    const { aiApi } = await import('@/api/video.js')
    const result = await aiApi.generateSopFromAnalysis(route.params.id, {
      videoName: video.value?.name || '示例视频',
      complianceResults: complianceItems.value,
      summary: summary.value
    })
    
    // 将生成的 SOP 添加到设置中
    settingsStore.addSop({
      name: result.name,
      content: result.content
    })
    
    ElMessage.success('SOP 已生成并保存到「个人中心 → SOP管理」')
    
    // 在对话中通知用户
    chatMessages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: `✅ SOP 已成功生成！\n\n名称：${result.name}\n\n您可以在「个人中心 → SOP管理」中查看和编辑。`
    })
    nextTick(() => { if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight })
  } catch (error) {
    ElMessage.error('SOP 生成失败，请稍后重试')
    console.error('SOP generation error:', error)
  } finally {
    generatingSop.value = false
  }
}

// === 截图标注功能实现 ===

// 截图
function takeScreenshot() {
  const videoElement = playerRef.value?.$el?.querySelector('video')
  if (!videoElement) {
    ElMessage.warning('无法获取视频元素')
    return
  }

  // 暂停视频
  playerRef.value?.pause?.()

  // 保存当前时间
  screenshotTime.value = currentTime.value

  // 创建 canvas 并绘制视频帧
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // 设置 canvas 尺寸为视频的实际尺寸
  canvas.width = videoElement.videoWidth || 640
  canvas.height = videoElement.videoHeight || 360
  
  // 绘制视频帧
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
  
  // 保存原始截图
  originalScreenshotImage.value = new Image()
  originalScreenshotImage.src = canvas.toDataURL('image/png')
  
  // 显示标注画布
  showAnnotationCanvas.value = true
  annotations.value = []
  currentAnnotation.value = null
  
  // 等待 DOM 更新后绘制
  nextTick(() => {
    drawScreenshot()
  })
  
  ElMessage.success('截图成功')
}

// 绘制截图到画布
function drawScreenshot() {
  const canvas = screenshotCanvasRef.value
  if (!canvas || !originalScreenshotImage.value) return
  
  const container = canvasContainerRef.value
  if (!container) return
  
  // 计算缩放比例以适应容器
  const containerWidth = container.clientWidth
  const containerHeight = 400
  const imgRatio = originalScreenshotImage.value.width / originalScreenshotImage.value.height
  const containerRatio = containerWidth / containerHeight
  
  let drawWidth, drawHeight, offsetX, offsetY
  
  if (imgRatio > containerRatio) {
    drawWidth = containerWidth
    drawHeight = containerWidth / imgRatio
    offsetX = 0
    offsetY = (containerHeight - drawHeight) / 2
  } else {
    drawHeight = containerHeight
    drawWidth = containerHeight * imgRatio
    offsetX = (containerWidth - drawWidth) / 2
    offsetY = 0
  }
  
  // 设置 canvas 尺寸
  canvas.width = containerWidth
  canvas.height = containerHeight
  
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制背景
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制截图
  ctx.drawImage(
    originalScreenshotImage.value,
    offsetX, offsetY, drawWidth, drawHeight
  )
  
  // 绘制所有标注
  drawAnnotations(ctx, offsetX, offsetY, drawWidth, drawHeight)
  
  // 保存绘制参数供后续使用
  canvas._drawParams = { offsetX, offsetY, drawWidth, drawHeight }
}

// 绘制标注
function drawAnnotations(ctx, offsetX, offsetY, drawWidth, drawHeight) {
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']
  
  annotations.value.forEach((ann, index) => {
    const color = colors[index % colors.length]
    
    // 转换坐标
    const x = offsetX + (ann.x / originalScreenshotImage.value.width) * drawWidth
    const y = offsetY + (ann.y / originalScreenshotImage.value.height) * drawHeight
    const w = (ann.width / originalScreenshotImage.value.width) * drawWidth
    const h = (ann.height / originalScreenshotImage.value.height) * drawHeight
    
    // 绘制矩形
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, w, h)
    
    // 绘制半透明填充
    ctx.fillStyle = color + '33'
    ctx.fillRect(x, y, w, h)
    
    // 绘制序号
    ctx.fillStyle = color
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(`#${index + 1}`, x + 5, y + 18)
    
    // 如果有备注，绘制备注标签
    if (ann.remark) {
      ctx.fillStyle = color
      ctx.font = '12px sans-serif'
      const remarkWidth = Math.min(ctx.measureText(ann.remark).width + 10, 150)
      ctx.fillRect(x, y + h + 5, remarkWidth, 20)
      ctx.fillStyle = '#fff'
      ctx.fillText(ann.remark.length > 15 ? ann.remark.substring(0, 15) + '...' : ann.remark, x + 5, y + h + 19)
    }
  })
}

// 开始标注
function startAnnotation() {
  isAnnotating.value = true
  ElMessage.info('请在截图上拖拽鼠标绘制矩形标注')
}

// 取消标注
function cancelAnnotation() {
  isAnnotating.value = false
  annotationStartPos.value = null
  currentAnnotation.value = null
}

// 画布鼠标事件
function onCanvasMouseDown(event) {
  if (!isAnnotating.value) return
  
  const canvas = screenshotCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  annotationStartPos.value = { x, y }
  currentAnnotation.value = { x, y, width: 0, height: 0, remark: '' }
}

function onCanvasMouseMove(event) {
  if (!isAnnotating.value || !annotationStartPos.value || !currentAnnotation.value) return
  
  const canvas = screenshotCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // 更新当前标注
  currentAnnotation.value.width = x - annotationStartPos.value.x
  currentAnnotation.value.height = y - annotationStartPos.value.y
  
  // 重新绘制
  drawScreenshot()
  
  // 绘制临时标注
  const ctx = canvas.getContext('2d')
  const params = canvas._drawParams
  
  if (params) {
    // 转换为原始图像坐标
    const imgX = ((currentAnnotation.value.x - params.offsetX) / params.drawWidth) * originalScreenshotImage.value.width
    const imgY = ((currentAnnotation.value.y - params.offsetY) / params.drawHeight) * originalScreenshotImage.value.height
    const imgW = (currentAnnotation.value.width / params.drawWidth) * originalScreenshotImage.value.width
    const imgH = (currentAnnotation.value.height / params.drawHeight) * originalScreenshotImage.value.height
    
    // 绘制临时矩形
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(
      currentAnnotation.value.x,
      currentAnnotation.value.y,
      currentAnnotation.value.width,
      currentAnnotation.value.height
    )
    ctx.setLineDash([])
  }
}

function onCanvasMouseUp(event) {
  if (!isAnnotating.value || !annotationStartPos.value || !currentAnnotation.value) return
  
  // 检查标注大小
  if (Math.abs(currentAnnotation.value.width) < 10 || Math.abs(currentAnnotation.value.height) < 10) {
    ElMessage.warning('标注区域太小，请重新绘制')
    cancelAnnotation()
    return
  }
  
  const canvas = screenshotCanvasRef.value
  const params = canvas._drawParams
  
  if (params) {
    // 标准化坐标（确保宽高为正）
    let x = currentAnnotation.value.x
    let y = currentAnnotation.value.y
    let w = currentAnnotation.value.width
    let h = currentAnnotation.value.height
    
    if (w < 0) {
      x += w
      w = Math.abs(w)
    }
    if (h < 0) {
      y += h
      h = Math.abs(h)
    }
    
    // 转换为原始图像坐标
    const imgX = ((x - params.offsetX) / params.drawWidth) * originalScreenshotImage.value.width
    const imgY = ((y - params.offsetY) / params.drawHeight) * originalScreenshotImage.value.height
    const imgW = (w / params.drawWidth) * originalScreenshotImage.value.width
    const imgH = (h / params.drawHeight) * originalScreenshotImage.value.height
    
    // 添加到标注列表
    annotations.value.push({
      x: Math.max(0, imgX),
      y: Math.max(0, imgY),
      width: Math.min(imgW, originalScreenshotImage.value.width - imgX),
      height: Math.min(imgH, originalScreenshotImage.value.height - imgY),
      remark: ''
    })
    
    // 重新绘制
    drawScreenshot()
    
    ElMessage.success(`已添加第 ${annotations.value.length} 个标注`)
  }
  
  // 重置状态
  cancelAnnotation()
}

// 打开备注对话框
function openRemarkDialog() {
  if (annotations.value.length === 0) {
    ElMessage.warning('请先添加标注')
    return
  }
  currentRemark.value = ''
  showRemarkDialog.value = true
}

// 确认备注
function confirmRemark() {
  if (annotations.value.length > 0) {
    // 将备注添加到最后一个标注
    annotations.value[annotations.value.length - 1].remark = currentRemark.value
    drawScreenshot()
    ElMessage.success('备注已添加')
  }
  showRemarkDialog.value = false
}

// 保存标注
function saveAnnotation() {
  if (annotations.value.length === 0) {
    ElMessage.warning('请先添加标注')
    return
  }
  
  // 创建缩略图
  const thumbnailCanvas = document.createElement('canvas')
  const thumbnailCtx = thumbnailCanvas.getContext('2d')
  thumbnailCanvas.width = 120
  thumbnailCanvas.height = 80
  
  // 绘制缩略图
  if (originalScreenshotImage.value) {
    thumbnailCtx.drawImage(
      originalScreenshotImage.value,
      0, 0, thumbnailCanvas.width, thumbnailCanvas.height
    )
  }
  
  // 创建标注记录
  const annotationRecord = {
    id: Date.now(),
    time: screenshotTime.value,
    thumbnail: thumbnailCanvas.toDataURL('image/png'),
    fullImage: originalScreenshotImage.value?.src || '',
    annotations: [...annotations.value],
    remark: annotations.value.filter(a => a.remark).map(a => a.remark).join('; '),
    createdAt: new Date().toISOString()
  }
  
  // 添加到历史
  annotationHistory.value.unshift(annotationRecord)
  
  ElMessage.success('标注已保存')
  
  // 关闭画布
  closeAnnotationCanvas()
}

// 关闭标注画布
function closeAnnotationCanvas() {
  showAnnotationCanvas.value = false
  annotations.value = []
  currentAnnotation.value = null
  originalScreenshotImage.value = null
}

// 跳转到标注
function jumpToAnnotation(item) {
  selectedAnnotationId.value = item.id
  jumpTo(item.time)
  ElMessage.info(`已跳转到 ${formatTime(item.time)}`)
}

// 查看标注详情
function viewAnnotationDetail(item) {
  selectedAnnotation.value = item
  showDetailDialog.value = true
  
  nextTick(() => {
    drawDetailCanvas()
  })
}

// 绘制详情画布
function drawDetailCanvas() {
  const canvas = detailCanvasRef.value
  if (!canvas || !selectedAnnotation.value) return
  
  const img = new Image()
  img.onload = () => {
    // 计算缩放比例
    const maxWidth = 660
    const maxHeight = 400
    let width = img.width
    let height = img.height
    
    if (width > maxWidth) {
      height = (maxWidth / width) * height
      width = maxWidth
    }
    if (height > maxHeight) {
      width = (maxHeight / height) * width
      height = maxHeight
    }
    
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    
    // 绘制图像
    ctx.drawImage(img, 0, 0, width, height)
    
    // 绘制标注
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']
    
    selectedAnnotation.value.annotations.forEach((ann, index) => {
      const color = colors[index % colors.length]
      
      // 转换坐标
      const x = (ann.x / img.width) * width
      const y = (ann.y / img.height) * height
      const w = (ann.width / img.width) * width
      const h = (ann.height / img.height) * height
      
      // 绘制矩形
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, w, h)
      
      // 绘制半透明填充
      ctx.fillStyle = color + '33'
      ctx.fillRect(x, y, w, h)
      
      // 绘制序号
      ctx.fillStyle = color
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`#${index + 1}`, x + 8, y + 24)
      
      // 如果有备注，绘制备注标签
      if (ann.remark) {
        ctx.fillStyle = color
        ctx.font = '14px sans-serif'
        const remarkWidth = Math.min(ctx.measureText(ann.remark).width + 16, 200)
        ctx.fillRect(x, y + h + 8, remarkWidth, 28)
        ctx.fillStyle = '#fff'
        ctx.fillText(ann.remark.length > 20 ? ann.remark.substring(0, 20) + '...' : ann.remark, x + 8, y + h + 27)
      }
    })
  }
  img.src = selectedAnnotation.value.fullImage
}

// 删除标注
function deleteAnnotation(id) {
  annotationHistory.value = annotationHistory.value.filter(item => item.id !== id)
  if (selectedAnnotationId.value === id) {
    selectedAnnotationId.value = null
  }
  ElMessage.success('标注已删除')
}
</script>

<style lang="scss" src="./VideoAnalysis.scss" />
