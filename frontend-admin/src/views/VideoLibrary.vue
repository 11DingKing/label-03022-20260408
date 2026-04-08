<template>
  <div class="video-lib">
    <!-- 顶部搜索筛选 -->
    <div class="video-lib__header">
      <div class="video-lib__search">
        <el-input
          v-model="videoStore.filters.keyword"
          placeholder="搜索视频名称、标签..."
          clearable
          :prefix-icon="Search"
          class="video-lib__search-input"
        />
        <el-select v-model="videoStore.filters.status" placeholder="分析状态" clearable class="video-lib__filter-select">
          <el-option label="已完成" value="completed" />
          <el-option label="未完成" value="pending" />
        </el-select>
        <el-date-picker
          v-model="videoStore.filters.dateRange"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          popper-class="video-lib-date-popper"
          class="video-lib__date-picker"
        />
        <el-select v-model="videoStore.filters.tags" placeholder="标签筛选" multiple collapse-tags clearable class="video-lib__filter-select">
          <el-option v-for="tag in videoStore.allTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </div>
      <div class="video-lib__actions">
        <el-button-group>
          <el-button :type="videoStore.viewMode === 'grid' ? 'primary' : ''" @click="videoStore.viewMode = 'grid'" :icon="Grid" />
          <el-button :type="videoStore.viewMode === 'list' ? 'primary' : ''" @click="videoStore.viewMode = 'list'" :icon="List" />
        </el-button-group>
        <el-button type="primary" :icon="Upload" @click="showUpload = true">上传视频</el-button>
      </div>
    </div>

    <!-- 统计栏 -->
    <div class="video-lib__stats">
      <div class="video-lib__stat-item">
        <span class="video-lib__stat-value text-accent">{{ videoStore.filteredVideos.length }}</span>
        <span class="video-lib__stat-label">全部视频</span>
      </div>
      <div class="video-lib__stat-item">
        <span class="video-lib__stat-value text-success">{{ videoStore.stats.analyzed }}</span>
        <span class="video-lib__stat-label">已分析</span>
      </div>
      <div class="video-lib__stat-item">
        <span class="video-lib__stat-value text-warning">{{ analyzingCount }}</span>
        <span class="video-lib__stat-label">分析中</span>
      </div>
      <div class="video-lib__stat-item">
        <span class="video-lib__stat-value text-muted">{{ pendingCount }}</span>
        <span class="video-lib__stat-label">待处理</span>
      </div>
    </div>

    <!-- 演示提示 -->
    <div class="video-lib__demo-notice">
      <el-icon><InfoFilled /></el-icon>
      <span>演示模式：视频缩略图为模拟数据，点击任意视频可进入分析页面体验完整功能</span>
    </div>

    <!-- 网格视图 -->
    <div v-if="videoStore.viewMode === 'grid'" class="video-lib__grid">
      <div
        v-for="video in videoStore.filteredVideos"
        :key="video.id"
        class="video-lib__card glow-border"
        @click="goAnalysis(video.id)"
      >
        <div class="video-lib__card-thumb">
          <div class="video-lib__card-mock-thumb">
            <el-icon :size="32"><VideoCamera /></el-icon>
          </div>
          <div v-if="video.hasAIAnalysis" class="video-lib__card-ai-badge">AI</div>
          <div v-if="video.status === 'analyzing'" class="video-lib__card-analyzing">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <div class="video-lib__card-duration">{{ formatDuration(video.duration) }}</div>
        </div>
        <div class="video-lib__card-info">
          <div class="video-lib__card-name" :title="video.name">{{ video.name }}</div>
          <div class="video-lib__card-meta">
            <span>{{ formatDate(video.createdAt) }}</span>
            <span>{{ video.size }}MB</span>
          </div>
          <div class="video-lib__card-tags">
            <el-tag v-for="tag in video.tags.slice(0, 2)" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
            <el-tag v-if="video.tags.length > 2" size="small" type="info">+{{ video.tags.length - 2 }}</el-tag>
          </div>
          <div class="video-lib__card-status">
            <span class="video-lib__status-dot" :class="`is-${video.status}`"></span>
            {{ statusLabel(video.status) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="video-lib__list">
      <el-table :data="videoStore.filteredVideos" style="width: 100%" @row-click="(row) => goAnalysis(row.id)" row-class-name="video-lib__table-row">
        <el-table-column label="视频" width="100">
          <template #default>
            <div class="video-lib__list-thumb">
              <el-icon :size="20"><VideoCamera /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <div class="video-lib__card-status">
              <span class="video-lib__status-dot" :class="`is-${row.status}`"></span>
              {{ statusLabel(row.status) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="80">
          <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
        </el-table-column>
        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain" style="margin-right: 4px">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="80">
          <template #default="{ row }">{{ row.size }}MB</template>
        </el-table-column>
        <el-table-column label="日期" width="120">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUpload" title="上传视频" width="min(500px, 92vw)" :close-on-click-modal="false">
      <el-upload drag action="#" :auto-upload="false" accept="video/*" :on-change="handleFileChange" :disabled="uploading">
        <el-icon :size="48"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽视频文件到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 MP4、AVI、MOV 格式，单文件不超过 2GB</div>
        </template>
      </el-upload>
      <div v-if="uploading" class="video-lib__upload-progress">
        <div class="video-lib__upload-info">
          <span>{{ uploadFileName }}</span>
          <span>{{ uploadProgress }}%</span>
        </div>
        <el-progress :percentage="uploadProgress" :status="uploadProgress === 100 ? 'success' : ''" :stroke-width="8" />
        <div class="video-lib__upload-status">{{ uploadStatus }}</div>
      </div>
      <div class="video-lib__upload-demo-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>演示模式：上传的视频将保存在本地浏览器中，刷新页面后可能丢失</span>
      </div>
      <template #footer>
        <el-button @click="cancelUpload">{{ uploading ? '取消' : '关闭' }}</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload" :disabled="!uploadFile || uploading">
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore } from '@/stores/video'
import { ElMessage } from 'element-plus'
import { Grid, List, Upload, VideoCamera, UploadFilled, Search, InfoFilled, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const videoStore = useVideoStore()

const showUpload = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)
const uploadProgress = ref(0)
const uploadFileName = ref('')
const uploadStatus = ref('')

const analyzingCount = computed(() => videoStore.videos.filter(v => v.status === 'analyzing').length)
const pendingCount = computed(() => videoStore.videos.filter(v => v.status === 'pending').length)

function goAnalysis(id) {
  router.push(`/analysis/${id}`)
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function statusLabel(status) {
  return { completed: '已完成', pending: '待处理', analyzing: '分析中' }[status] || status
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg']

function handleFileChange(file) {
  const rawFile = file.raw || file
  if (rawFile.type && !ALLOWED_TYPES.includes(rawFile.type) && !rawFile.type.startsWith('video/')) {
    ElMessage.error('请选择有效的视频文件')
    return false
  }
  if (rawFile.size && rawFile.size > MAX_FILE_SIZE) {
    ElMessage.error('文件大小超过限制（最大 2GB）')
    return false
  }
  uploadFile.value = file
  uploadFileName.value = rawFile.name || file.name || '未命名视频'
  return true
}

function cancelUpload() {
  if (uploading.value) {
    uploading.value = false
    uploadProgress.value = 0
    uploadStatus.value = '上传已取消'
    ElMessage.info('上传已取消')
  } else {
    showUpload.value = false
    uploadFile.value = null
    uploadProgress.value = 0
    uploadStatus.value = ''
  }
}

function handleUpload() {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }
  const file = uploadFile.value.raw || uploadFile.value
  const fileName = file.name || uploadFile.value.name || '未命名视频'
  const fileSize = Math.round((file.size || 0) / (1024 * 1024))
  
  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = '准备上传...'
  
  let localUrl = ''
  if (file instanceof Blob) {
    localUrl = URL.createObjectURL(file)
  }
  
  const progressInterval = setInterval(() => {
    if (!uploading.value) {
      clearInterval(progressInterval)
      return
    }
    if (uploadProgress.value < 90) {
      uploadProgress.value += Math.random() * 15
      if (uploadProgress.value > 90) uploadProgress.value = 90
      uploadStatus.value = '正在上传...'
    }
  }, 200)
  
  setTimeout(() => {
    clearInterval(progressInterval)
    uploadProgress.value = 100
    uploadStatus.value = '处理完成'
    
    const newVideo = videoStore.addVideo({
      name: fileName.replace(/\.[^/.]+$/, ''),
      size: fileSize || Math.floor(Math.random() * 200) + 50,
      duration: Math.floor(Math.random() * 1800) + 300,
      tags: ['新上传'],
      url: localUrl
    })
    
    setTimeout(() => {
      uploading.value = false
      showUpload.value = false
      uploadFile.value = null
      uploadProgress.value = 0
      uploadStatus.value = ''
      ElMessage.success(`视频「${newVideo.name}」上传成功`)
    }, 500)
  }, 2000)
}
</script>

<style lang="scss" src="./VideoLibrary.scss" />
