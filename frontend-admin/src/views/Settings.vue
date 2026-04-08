<template>
  <div class="settings">
    <div class="settings__sidebar">
      <div
        v-for="section in sections"
        :key="section.key"
        class="settings__nav-item"
        :class="{ 'is-active': activeSection === section.key }"
        @click="activeSection = section.key"
      >
        <el-icon><component :is="section.icon" /></el-icon>
        {{ section.label }}
      </div>
    </div>

    <div class="settings__content">
      <!-- 个人信息 -->
      <div v-if="activeSection === 'profile'" class="settings__panel">
        <div class="settings__panel-title">个人信息</div>
        <el-form :model="profileForm" label-width="80px" class="settings__form">
          <el-form-item label="头像">
            <div class="settings__avatar">
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="handleAvatarChange"
              >
                <div class="settings__avatar-placeholder" :title="'点击更换头像'">
                  <img v-if="profileForm.avatar" :src="profileForm.avatar" class="settings__avatar-img" alt="头像" />
                  <el-icon v-else :size="32"><User /></el-icon>
                </div>
              </el-upload>
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="handleAvatarChange"
              >
                <el-button size="small" text type="primary">更换头像</el-button>
              </el-upload>
              <el-button v-if="profileForm.avatar" size="small" text type="danger" @click="removeAvatar">移除</el-button>
            </div>
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="profileForm.name" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" />
          </el-form-item>
          <el-form-item label="部门">
            <el-input v-model="profileForm.department" />
          </el-form-item>
          <el-form-item label="角色">
            <el-input v-model="profileForm.role" disabled />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveProfile" :loading="saving">保存修改</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 主题配色 -->
      <div v-if="activeSection === 'theme'" class="settings__panel">
        <div class="settings__panel-title">主题配色</div>
        <div class="settings__themes">
          <div
            v-for="opt in settingsStore.themeOptions"
            :key="opt.value"
            class="settings__theme-card glow-border"
            :class="{ 'is-active': settingsStore.theme === opt.value }"
            @click="settingsStore.theme = opt.value"
          >
            <div class="settings__theme-preview" :style="{ background: opt.bg }">
              <div class="settings__theme-accent" :style="{ background: opt.primary }"></div>
            </div>
            <div class="settings__theme-name">{{ opt.label }}</div>
          </div>
        </div>
      </div>

      <!-- AI对话历史 -->
      <div v-if="activeSection === 'history'" class="settings__panel">
        <div class="settings__panel-title">
          AI对话历史
          <el-button size="small" type="danger" text @click="clearHistory">清空记录</el-button>
        </div>
        <div class="settings__history">
          <div v-for="msg in aiStore.messages" :key="msg.id" class="settings__history-item">
            <el-tag :type="msg.role === 'user' ? '' : 'info'" size="small">{{ msg.role === 'user' ? '我' : 'AI' }}</el-tag>
            <span class="settings__history-content">{{ msg.content }}</span>
            <span class="settings__history-time text-mono">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- SOP管理 -->
      <div v-if="activeSection === 'sop'" class="settings__panel">
        <div class="settings__panel-title">
          SOP管理
          <div>
            <el-button size="small" type="success" @click="aiGenerateSop" :loading="aiGenerating">AI生成SOP</el-button>
            <el-button size="small" type="primary" @click="showSopDialog = true">新建SOP</el-button>
            <el-button size="small" @click="importSop">导入SOP</el-button>
          </div>
        </div>
        <div class="settings__sop-switch">
          <span>合规性检测</span>
          <el-switch v-model="settingsStore.sopComplianceEnabled" />
        </div>
        <div class="settings__sop-list">
          <div v-for="sop in settingsStore.sopList" :key="sop.id" class="settings__sop-item glow-border">
            <div class="settings__sop-header">
              <span class="settings__sop-name">{{ sop.name }}</span>
              <el-tag v-if="sop.isDefault" type="success" size="small">默认</el-tag>
            </div>
            <div class="settings__sop-content">{{ sop.content }}</div>
            <div class="settings__sop-actions">
              <el-button size="small" text type="primary" @click="settingsStore.setDefaultSop(sop.id)">设为默认</el-button>
              <el-button size="small" text @click="editSop(sop)">编辑</el-button>
              <el-button size="small" text type="danger" @click="settingsStore.removeSop(sop.id)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 知识库 -->
      <div v-if="activeSection === 'knowledge'" class="settings__panel">
        <div class="settings__panel-title">
          AI知识库
          <el-button size="small" type="primary" @click="showKnowledgeUpload = true">上传文档</el-button>
        </div>
        <div class="settings__knowledge-list">
          <div v-for="item in settingsStore.knowledgeBase" :key="item.id" class="settings__knowledge-item glow-border">
            <el-icon :size="24"><Document /></el-icon>
            <div class="settings__knowledge-info">
              <div class="settings__knowledge-name">{{ item.name }}</div>
              <div class="settings__knowledge-meta">{{ item.size }} · {{ item.uploadedAt }}</div>
            </div>
            <el-button size="small" text type="danger" @click="settingsStore.removeKnowledge(item.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- SOP新建/编辑弹窗 -->
    <el-dialog v-model="showSopDialog" :title="editingSop ? '编辑SOP' : '新建SOP'" width="min(500px, 92vw)">
      <el-form :model="sopForm" label-position="top">
        <el-form-item label="名称">
          <el-input v-model="sopForm.name" placeholder="输入SOP名称" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="sopForm.content" type="textarea" :rows="6" placeholder="输入SOP内容..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSopDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSop">保存</el-button>
      </template>
    </el-dialog>

    <!-- 知识库上传弹窗 -->
    <el-dialog v-model="showKnowledgeUpload" title="上传知识库文档" width="min(500px, 92vw)">
      <el-upload drag action="#" :auto-upload="false" accept=".pdf,.doc,.docx,.txt" :on-change="handleKnowledgeFile">
        <el-icon :size="48"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 PDF、DOC、DOCX、TXT 格式</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showKnowledgeUpload = false">取消</el-button>
        <el-button type="primary" @click="uploadKnowledge" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <!-- SOP导入弹窗 -->
    <el-dialog v-model="showSopImport" title="导入SOP文件" width="min(500px, 92vw)">
      <el-upload drag action="#" :auto-upload="false" accept=".txt,.doc,.docx,.pdf" :on-change="handleSopImportFile">
        <el-icon :size="48"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽SOP文件到此处，或 <em>点击选择</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 TXT、DOC、DOCX、PDF 格式</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showSopImport = false">取消</el-button>
        <el-button type="primary" @click="confirmImportSop">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 个人中心/设置页
 * 
 * 提供用户个人信息管理、主题配置、AI对话历史、SOP管理和知识库管理功能。
 * 
 * 语音导航支持：
 * - "打开设置" / "个人中心" - 跳转到此页面
 * - "个人信息" - 切换到个人信息面板
 * - "主题" / "配色" - 切换到主题配色面板
 * - "对话历史" - 切换到对话历史面板
 * - "SOP" / "合规" - 切换到SOP管理面板
 * - "知识库" - 切换到知识库面板
 */
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useAIStore } from '@/stores/ai'
import { ElMessage } from 'element-plus'
import { User, Document, Delete, UploadFilled } from '@element-plus/icons-vue'

const settingsStore = useSettingsStore()
const aiStore = useAIStore()

const activeSection = ref('profile')
const saving = ref(false)
const uploading = ref(false)
const aiGenerating = ref(false)
const showSopDialog = ref(false)
const showSopImport = ref(false)
const showKnowledgeUpload = ref(false)
const editingSop = ref(null)
const knowledgeFile = ref(null)
const sopImportFile = ref(null)

const sections = [
  { key: 'profile', label: '个人信息', icon: 'User' },
  { key: 'theme', label: '主题配色', icon: 'Brush' },
  { key: 'history', label: '对话历史', icon: 'ChatLineSquare' },
  { key: 'sop', label: 'SOP管理', icon: 'Document' },
  { key: 'knowledge', label: '知识库', icon: 'FolderOpened' }
]

const profileForm = reactive({ ...settingsStore.profile })
const sopForm = reactive({ name: '', content: '' })

function handleAvatarChange(uploadFile) {
  const file = uploadFile.raw || uploadFile
  if (!file || !file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.avatar = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  profileForm.avatar = ''
}

function saveProfile() {
  saving.value = true
  setTimeout(() => {
    settingsStore.updateProfile(profileForm)
    saving.value = false
    ElMessage.success('个人信息已更新')
  }, 600)
}

function clearHistory() {
  aiStore.clearHistory()
  ElMessage.success('对话历史已清空')
}

function editSop(sop) {
  editingSop.value = sop
  sopForm.name = sop.name
  sopForm.content = sop.content
  showSopDialog.value = true
}

function saveSop() {
  if (!sopForm.name.trim()) {
    ElMessage.warning('请输入SOP名称')
    return
  }
  if (editingSop.value) {
    Object.assign(editingSop.value, { name: sopForm.name, content: sopForm.content })
    ElMessage.success('SOP已更新')
  } else {
    settingsStore.addSop({ name: sopForm.name, content: sopForm.content })
    ElMessage.success('SOP已创建')
  }
  showSopDialog.value = false
  editingSop.value = null
  sopForm.name = ''
  sopForm.content = ''
}

function importSop() {
  showSopImport.value = true
}

async function aiGenerateSop() {
  aiGenerating.value = true
  ElMessage.info('AI正在根据视频分析结果生成SOP...')
  try {
    const { aiApi } = await import('@/api/video.js')
    const result = await aiApi.generateSopFromAnalysis(null, {
      videoName: '综合分析',
      complianceResults: [],
      summary: '基于历史视频分析数据生成'
    })
    settingsStore.addSop({ name: result.name, content: result.content })
    ElMessage.success('AI已生成SOP，可在下方列表查看')
  } catch (e) {
    ElMessage.error('SOP生成失败，请稍后重试')
  } finally {
    aiGenerating.value = false
  }
}

function handleSopImportFile(uploadFile) {
  sopImportFile.value = uploadFile
}

function confirmImportSop() {
  if (!sopImportFile.value) {
    ElMessage.warning('请先选择SOP文件')
    return
  }
  const file = sopImportFile.value.raw || sopImportFile.value
  const fileName = sopImportFile.value.name || file?.name || '导入的SOP'
  
  // 读取文件内容
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result || '导入的SOP内容'
    settingsStore.addSop({
      name: fileName.replace(/\.[^/.]+$/, ''),
      content: typeof content === 'string' ? content : '导入的SOP内容'
    })
    showSopImport.value = false
    sopImportFile.value = null
    ElMessage.success('SOP导入成功')
  }
  reader.onerror = () => {
    settingsStore.addSop({
      name: fileName.replace(/\.[^/.]+$/, ''),
      content: '导入的SOP内容（文件读取失败）'
    })
    showSopImport.value = false
    sopImportFile.value = null
    ElMessage.success('SOP导入成功')
  }
  
  if (file instanceof Blob) {
    reader.readAsText(file)
  } else {
    settingsStore.addSop({ name: fileName.replace(/\.[^/.]+$/, ''), content: '导入的SOP内容' })
    showSopImport.value = false
    sopImportFile.value = null
    ElMessage.success('SOP导入成功')
  }
}

function handleKnowledgeFile(uploadFile) {
  knowledgeFile.value = uploadFile
}

function uploadKnowledge() {
  if (!knowledgeFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  const file = knowledgeFile.value.raw || knowledgeFile.value
  const fileName = knowledgeFile.value.name || file?.name || '新文档.pdf'
  const fileSize = file?.size ? formatFileSize(file.size) : '未知大小'
  
  uploading.value = true
  setTimeout(() => {
    settingsStore.addKnowledge({
      name: fileName,
      size: fileSize
    })
    uploading.value = false
    showKnowledgeUpload.value = false
    knowledgeFile.value = null
    ElMessage.success('文档已上传至知识库')
  }, 500)
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style lang="scss" src="./Settings.scss" />
