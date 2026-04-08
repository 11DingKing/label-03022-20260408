<template>
  <div class="video-player glow-border">
    <div class="video-player__screen">
      <video 
        v-show="!error"
        ref="videoRef" 
        class="video-player__video" 
        :src="src" 
        @timeupdate="onTimeUpdate" 
        @loadedmetadata="onLoadedMetadata" 
        @play="$emit('play')" 
        @pause="$emit('pause')" 
        @ended="$emit('ended')" 
        @error="handleError"
      >
        您的浏览器不支持视频播放
      </video>
      <div v-if="error" class="video-player__placeholder">
        <!-- 主图标 -->
        <div class="video-player__placeholder-icon">
          <el-icon :size="40"><VideoCamera /></el-icon>
        </div>
        
        <!-- 标题 -->
        <div class="video-player__placeholder-title">{{ videoName || '未选择视频' }}</div>
        
        <!-- 演示模式提示 -->
        <div class="video-player__placeholder-demo">
          <el-icon :size="14"><InfoFilled /></el-icon>
          <span>演示模式：当前为模拟视频数据</span>
        </div>
      </div>
    </div>
    <div class="video-player__controls">
      <el-button :icon="isPlaying ? 'VideoPause' : 'VideoPlay'" circle size="small" @click="togglePlay" />
      <div class="video-player__progress">
        <el-slider v-model="progress" :show-tooltip="false" :max="100" @change="seekTo" />
      </div>
      <span class="video-player__time text-mono">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      <el-select v-model="speed" class="video-player__speed" size="small" @change="changeSpeed">
        <el-option v-for="s in speeds" :key="s" :label="s + 'x'" :value="s" />
      </el-select>
    </div>
    <div v-if="showDemoSelector" class="video-player__demo-selector">
      <span class="video-player__demo-label">演示视频：</span>
      <el-select v-model="demoIndex" size="small" style="width: 180px" @change="switchDemo">
        <el-option v-for="(demo, idx) in demoVideos" :key="idx" :label="demo.name" :value="idx" />
      </el-select>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { VideoCamera, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  src: String,
  videoName: String,
  showDemoSelector: Boolean,
  demoVideos: { type: Array, default: () => [] },
  initialDemoIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['play', 'pause', 'ended', 'timeUpdate', 'durationChange', 'demoChange'])

const videoRef = ref(null)
const error = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(180)
const progress = ref(0)
const speed = ref(1)
const demoIndex = ref(props.initialDemoIndex)
const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

watch(() => props.src, () => {
  error.value = false
  currentTime.value = 0
  progress.value = 0
})

function handleError() {
  error.value = true
}

function retryLoad() {
  error.value = false
  if (videoRef.value) {
    videoRef.value.load()
  }
}

function togglePlay() {
  if (!videoRef.value) return
  if (isPlaying.value) {
    videoRef.value.pause()
    isPlaying.value = false
  } else {
    videoRef.value.play()
    isPlaying.value = true
  }
}

function onTimeUpdate() {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
    progress.value = (currentTime.value / duration.value) * 100
    emit('timeUpdate', currentTime.value)
  }
}

function onLoadedMetadata() {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    emit('durationChange', duration.value)
  }
}

function seekTo(val) {
  if (videoRef.value) {
    videoRef.value.currentTime = (val / 100) * duration.value
    currentTime.value = (val / 100) * duration.value
  }
}

function changeSpeed(s) {
  if (videoRef.value) {
    videoRef.value.playbackRate = s
  }
}

function switchDemo() {
  error.value = false
  currentTime.value = 0
  progress.value = 0
  isPlaying.value = false
  emit('demoChange', demoIndex.value)
  if (videoRef.value) {
    videoRef.value.load()
    videoRef.value.playbackRate = speed.value
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

// 暴露方法供父组件调用
function jumpTo(time) {
  if (videoRef.value) {
    videoRef.value.currentTime = time
    currentTime.value = time
    progress.value = (time / duration.value) * 100
  }
}

function play() {
  if (videoRef.value && !isPlaying.value) {
    videoRef.value.play()
    isPlaying.value = true
  }
}

function pause() {
  if (videoRef.value && isPlaying.value) {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

defineExpose({ jumpTo, play, pause, duration: computed(() => duration.value) })
</script>

<style lang="scss" scoped>
.video-player {
  background: $color-bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  flex-shrink: 0;

  &__screen {
    position: relative;
    background: #000;
    width: 100%;
    aspect-ratio: 16 / 9;
  }

  &__video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-md;
    color: $color-text-muted;
    background: $color-bg-deep;
    z-index: 10;
  }

  &__placeholder-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: $radius-round;
    background: rgba(0, 212, 255, 0.08);
    border: 2px solid rgba(0, 212, 255, 0.25);
    color: $color-accent;
  }

  &__placeholder-title {
    font-size: 16px;
    font-weight: 600;
    color: $color-text-primary;
    text-align: center;
  }

  &__placeholder-demo {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $color-accent;
    padding: 8px 16px;
    background: rgba(0, 212, 255, 0.08);
    border-radius: $radius-md;
    border: 1px solid rgba(0, 212, 255, 0.15);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background: rgba(0, 0, 0, 0.3);
  }

  &__progress {
    flex: 1;
    padding: 0 4px;
  }

  &__time {
    font-size: 12px;
    color: $color-text-secondary;
    min-width: 90px;
    text-align: center;
  }

  &__speed {
    width: 70px;
  }

  &__demo-selector {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba(0, 212, 255, 0.03);
    border-top: 1px solid $color-border;
  }

  &__demo-label {
    font-size: 12px;
    color: $color-text-muted;
  }
}

@keyframes ring-pulse {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.15);
  }
}

@keyframes glow-breathe {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.15);
  }
}

@keyframes icon-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 15px 2px rgba(239, 68, 68, 0.2);
  }
}

@keyframes particle-float {
  0%, 100% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  10% {
    opacity: 0.6;
    transform: translateY(0) scale(1);
  }
  90% {
    opacity: 0.6;
    transform: translateY(-40px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px) scale(0);
  }
}
</style>
