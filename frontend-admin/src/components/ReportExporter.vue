<template>
  <!-- 报告编辑弹窗 -->
  <el-dialog v-model="visible" title="视频分析报告" width="min(800px, 92vw)" :close-on-click-modal="false" class="report-dialog">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本信息" name="basic">
        <el-form label-position="top">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="视频名称">
                <el-input v-model="data.videoName" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="视频时长">
                <el-input v-model="data.duration" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分析时间">
                <el-input v-model="data.analysisTime" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="报告编号">
                <el-input v-model="data.reportId" placeholder="自动生成" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="合规检测" name="compliance">
        <div class="compliance-section">
          <!-- 统计卡片 -->
          <div class="compliance-stats">
            <div class="stat-card stat-total">
              <span class="stat-value">{{ data.complianceResults.length }}</span>
              <span class="stat-label">检测项</span>
            </div>
            <div class="stat-card stat-pass">
              <span class="stat-value">{{ passCount }}</span>
              <span class="stat-label">通过</span>
            </div>
            <div class="stat-card stat-fail">
              <span class="stat-value">{{ data.complianceResults.length - passCount }}</span>
              <span class="stat-label">未通过</span>
            </div>
            <div class="stat-card stat-rate">
              <span class="stat-value">{{ passRate }}%</span>
              <span class="stat-label">通过率</span>
            </div>
          </div>
          
          <!-- 表头 -->
          <div class="compliance-header">
            <span class="col-label">检测项目</span>
            <span class="col-status">状态</span>
            <span class="col-time">时间点</span>
            <span class="col-action">操作</span>
          </div>
          
          <!-- 检测项列表 -->
          <div class="compliance-list">
            <div v-for="(item, index) in data.complianceResults" :key="index" class="compliance-item" :class="{ 'is-pass': item.pass, 'is-fail': !item.pass }">
              <div class="col-label">
                <span class="item-index">{{ index + 1 }}</span>
                <el-input v-model="item.label" size="small" placeholder="检测项名称" />
              </div>
              <div class="col-status">
                <el-switch 
                  v-model="item.pass" 
                  inline-prompt
                  :active-icon="Check"
                  :inactive-icon="Close"
                  active-color="#22c55e"
                  inactive-color="#ef4444"
                />
                <span class="status-text" :class="item.pass ? 'text-pass' : 'text-fail'">
                  {{ item.pass ? '通过' : '未通过' }}
                </span>
              </div>
              <div class="col-time">
                <el-icon class="time-icon"><Clock /></el-icon>
                <el-input v-model="item.time" size="small" placeholder="00:00" />
              </div>
              <div class="col-action">
                <el-button type="danger" size="small" :icon="Delete" circle @click="removeComplianceItem(index)" />
              </div>
            </div>
          </div>
          
          <!-- 添加按钮 -->
          <div class="compliance-footer">
            <el-button type="primary" :icon="Plus" @click="addComplianceItem">
              添加检测项
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="AI摘要" name="summary">
        <el-form label-position="top">
          <el-form-item label="AI 智能摘要">
            <el-input v-model="data.summary" type="textarea" :rows="8" placeholder="AI自动生成的视频内容摘要..." />
          </el-form-item>
          <el-form-item label="关键发现">
            <el-input v-model="data.keyFindings" type="textarea" :rows="4" placeholder="列出视频中的关键发现和问题点..." />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="备注附件" name="remarks">
        <el-form label-position="top">
          <el-form-item label="备注说明">
            <el-input v-model="data.remarks" type="textarea" :rows="4" placeholder="可添加额外备注信息" />
          </el-form-item>
          <el-form-item label="审核人">
            <el-input v-model="data.reviewer" placeholder="填写审核人姓名" />
          </el-form-item>
          <el-form-item label="审核意见">
            <el-radio-group v-model="data.reviewStatus">
              <el-radio label="approved">审核通过</el-radio>
              <el-radio label="rejected">审核不通过</el-radio>
              <el-radio label="pending">待审核</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="info" @click="showPreviewDialog = true">
          <el-icon><View /></el-icon> 预览
        </el-button>
        <el-button type="primary" @click="exportHTML" :loading="exporting">
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 预览弹窗 -->
  <el-dialog v-model="showPreviewDialog" title="报告预览" width="min(700px, 92vw)" class="preview-dialog">
    <div class="report-preview" ref="previewRef">
      <div class="report-header">
        <h1>视频分析报告</h1>
        <p class="report-id">报告编号：{{ data.reportId || '自动生成' }}</p>
      </div>
      
      <div class="report-section">
        <h3><span class="section-icon">📋</span> 基本信息</h3>
        <div class="info-grid">
          <div class="info-item"><label>视频名称</label><span>{{ data.videoName }}</span></div>
          <div class="info-item"><label>视频时长</label><span>{{ data.duration }}</span></div>
          <div class="info-item"><label>分析时间</label><span>{{ data.analysisTime }}</span></div>
          <div class="info-item"><label>审核状态</label><span :class="'status-' + data.reviewStatus">{{ reviewStatusText }}</span></div>
        </div>
      </div>

      <div class="report-section">
        <h3><span class="section-icon">✅</span> 合规性检测结果</h3>
        <div class="compliance-table">
          <div class="compliance-row header">
            <span>检测项目</span>
            <span>状态</span>
            <span>时间点</span>
          </div>
          <div v-for="item in data.complianceResults" :key="item.label" class="compliance-row">
            <span>{{ item.label }}</span>
            <span :class="item.pass ? 'text-success' : 'text-danger'">{{ item.pass ? '✓ 通过' : '✗ 未通过' }}</span>
            <span>{{ item.time }}</span>
          </div>
        </div>
        <div class="compliance-summary">
          通过率：{{ passRate }}% ({{ passCount }}/{{ data.complianceResults.length }})
        </div>
      </div>

      <div class="report-section">
        <h3><span class="section-icon">🤖</span> AI 智能摘要</h3>
        <div class="summary-content">{{ data.summary }}</div>
      </div>

      <div v-if="data.keyFindings" class="report-section">
        <h3><span class="section-icon">🔍</span> 关键发现</h3>
        <div class="summary-content">{{ data.keyFindings }}</div>
      </div>

      <div v-if="data.remarks || data.reviewer" class="report-section">
        <h3><span class="section-icon">📝</span> 审核信息</h3>
        <div v-if="data.reviewer" class="info-item"><label>审核人</label><span>{{ data.reviewer }}</span></div>
        <div v-if="data.remarks" class="remarks-content">{{ data.remarks }}</div>
      </div>

      <div class="report-footer">
        <p>本报告由视频分析 AI 系统自动生成</p>
        <p>生成时间：{{ new Date().toLocaleString() }}</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="showPreviewDialog = false">关闭</el-button>
      <el-button type="primary" @click="showPreviewDialog = false; exportHTML()">确认并导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, View, Document, Printer, DataLine, EditPen, Plus, Delete, Check, Close, Clock } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  reportData: Object
})

const emit = defineEmits(['update:modelValue', 'exported'])

const visible = ref(props.modelValue)
const showPreviewDialog = ref(false)
const exporting = ref(false)
const activeTab = ref('basic')
const previewRef = ref(null)

const data = reactive({
  videoName: '',
  duration: '',
  analysisTime: '',
  reportId: '',
  complianceResults: [],
  summary: '',
  keyFindings: '',
  remarks: '',
  reviewer: '',
  reviewStatus: 'pending'
})

const passCount = computed(() => data.complianceResults.filter(i => i.pass).length)
const passRate = computed(() => {
  if (data.complianceResults.length === 0) return 0
  return Math.round((passCount.value / data.complianceResults.length) * 100)
})

const reviewStatusText = computed(() => {
  const map = { approved: '已通过', rejected: '未通过', pending: '待审核' }
  return map[data.reviewStatus] || '待审核'
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.reportData) {
    Object.assign(data, {
      ...props.reportData,
      reportId: props.reportData.reportId || `RPT-${Date.now().toString(36).toUpperCase()}`,
      keyFindings: props.reportData.keyFindings || '',
      reviewer: props.reportData.reviewer || '',
      reviewStatus: props.reportData.reviewStatus || 'pending'
    })
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function addComplianceItem() {
  data.complianceResults.push({ label: '新检测项', pass: true, time: '00:00' })
}

function removeComplianceItem(index) {
  data.complianceResults.splice(index, 1)
}

// 生成 HTML 内容
function generateHTML() {
  const statusClass = data.reviewStatus === 'approved' ? 'approved' : data.reviewStatus === 'rejected' ? 'rejected' : 'pending'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>视频分析报告 - ${data.videoName}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; background: #f5f7fa; }
    .report-container { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    h1 { text-align: center; color: #1a1a2e; margin-bottom: 8px; font-size: 28px; }
    .report-id { text-align: center; color: #999; font-size: 13px; margin-bottom: 30px; }
    h2 { color: #16213e; margin-top: 30px; border-left: 4px solid #00d4ff; padding-left: 12px; font-size: 18px; display: flex; align-items: center; gap: 8px; }
    .section-icon { font-size: 20px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item label { font-size: 12px; color: #999; text-transform: uppercase; }
    .info-item span { font-size: 15px; color: #333; }
    .compliance-table { margin-top: 16px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    .compliance-row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 12px 16px; border-bottom: 1px solid #eee; }
    .compliance-row:last-child { border-bottom: none; }
    .compliance-row.header { background: #f8f9fa; font-weight: 600; font-size: 13px; color: #666; }
    .pass { color: #22c55e; font-weight: 600; }
    .fail { color: #ef4444; font-weight: 600; }
    .compliance-summary { margin-top: 12px; padding: 12px 16px; background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(139,92,246,0.1)); border-radius: 8px; font-weight: 600; }
    .summary-content { background: #f8f9fa; padding: 20px; border-radius: 8px; white-space: pre-wrap; line-height: 1.8; margin-top: 12px; }
    .status-approved { color: #22c55e; font-weight: 600; }
    .status-rejected { color: #ef4444; font-weight: 600; }
    .status-pending { color: #f59e0b; font-weight: 600; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
    @media print { body { padding: 20px; background: #fff; } .report-container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="report-container">
    <h1>视频分析报告</h1>
    <p class="report-id">报告编号：${data.reportId}</p>
    
    <h2><span class="section-icon">📋</span> 基本信息</h2>
    <div class="info-grid">
      <div class="info-item"><label>视频名称</label><span>${data.videoName}</span></div>
      <div class="info-item"><label>视频时长</label><span>${data.duration}</span></div>
      <div class="info-item"><label>分析时间</label><span>${data.analysisTime}</span></div>
      <div class="info-item"><label>审核状态</label><span class="status-${statusClass}">${reviewStatusText.value}</span></div>
    </div>
    
    <h2><span class="section-icon">✅</span> 合规性检测结果</h2>
    <div class="compliance-table">
      <div class="compliance-row header"><span>检测项目</span><span>状态</span><span>时间点</span></div>
      ${data.complianceResults.map(i => `<div class="compliance-row"><span>${i.label}</span><span class="${i.pass ? 'pass' : 'fail'}">${i.pass ? '✓ 通过' : '✗ 未通过'}</span><span>${i.time}</span></div>`).join('')}
    </div>
    <div class="compliance-summary">通过率：${passRate.value}% (${passCount.value}/${data.complianceResults.length})</div>
    
    <h2><span class="section-icon">🤖</span> AI 智能摘要</h2>
    <div class="summary-content">${data.summary}</div>
    
    ${data.keyFindings ? `<h2><span class="section-icon">🔍</span> 关键发现</h2><div class="summary-content">${data.keyFindings}</div>` : ''}
    ${data.reviewer ? `<h2><span class="section-icon">📝</span> 审核信息</h2><div class="info-item"><label>审核人</label><span>${data.reviewer}</span></div>` : ''}
    ${data.remarks ? `<div class="summary-content" style="margin-top:12px">${data.remarks}</div>` : ''}
    
    <div class="footer">
      <p>本报告由视频分析 AI 系统自动生成</p>
      <p>生成时间：${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`
}

// 导出 HTML
function exportHTML() {
  exporting.value = true
  const html = generateHTML()
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  downloadFile(blob, `视频分析报告_${data.videoName}_${getDateStr()}.html`)
  
  setTimeout(() => {
    exporting.value = false
    visible.value = false
    showPreviewDialog.value = false
    ElMessage.success('HTML 报告已导出')
    emit('exported', { format: 'html' })
  }, 500)
}

// 导出 PDF（通过打印）
function exportPDF() {
  const html = generateHTML()
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
    ElMessage.success('已打开打印窗口，请选择"另存为 PDF"')
    emit('exported', { format: 'pdf' })
  } else {
    ElMessage.warning('无法打开打印窗口，请检查浏览器弹窗设置')
  }
}

// 导出 JSON
function exportJSON() {
  const jsonData = {
    ...data,
    exportTime: new Date().toISOString(),
    version: '1.0',
    passRate: passRate.value
  }
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' })
  downloadFile(blob, `视频分析报告_${data.videoName}_${getDateStr()}.json`)
  ElMessage.success('JSON 报告已导出')
  emit('exported', { format: 'json' })
}

// 导出 Markdown
function exportMarkdown() {
  const md = `# 视频分析报告

**报告编号**: ${data.reportId}  
**生成时间**: ${new Date().toLocaleString()}

---

## 📋 基本信息

| 项目 | 内容 |
|------|------|
| 视频名称 | ${data.videoName} |
| 视频时长 | ${data.duration} |
| 分析时间 | ${data.analysisTime} |
| 审核状态 | ${reviewStatusText.value} |

## ✅ 合规性检测结果

| 检测项目 | 状态 | 时间点 |
|----------|------|--------|
${data.complianceResults.map(i => `| ${i.label} | ${i.pass ? '✓ 通过' : '✗ 未通过'} | ${i.time} |`).join('\n')}

**通过率**: ${passRate.value}% (${passCount.value}/${data.complianceResults.length})

## 🤖 AI 智能摘要

${data.summary}

${data.keyFindings ? `## 🔍 关键发现\n\n${data.keyFindings}` : ''}

${data.reviewer || data.remarks ? `## 📝 审核信息\n\n${data.reviewer ? `**审核人**: ${data.reviewer}\n\n` : ''}${data.remarks ? data.remarks : ''}` : ''}

---

*本报告由视频分析 AI 系统自动生成*
`
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  downloadFile(blob, `视频分析报告_${data.videoName}_${getDateStr()}.md`)
  ElMessage.success('Markdown 报告已导出')
  emit('exported', { format: 'markdown' })
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getDateStr() {
  return new Date().toISOString().split('T')[0]
}
</script>

<style lang="scss" scoped>
.report-dialog {
  :deep(.el-dialog__body) {
    padding-top: 0;
  }
}

.compliance-section {
  .compliance-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    
    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      border-radius: $radius-md;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid $color-border;
      transition: all $transition-fast;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        font-family: $font-family-mono;
        line-height: 1;
      }
      
      .stat-label {
        font-size: 11px;
        color: $color-text-muted;
        margin-top: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      &.stat-total .stat-value { color: $color-accent; }
      &.stat-pass .stat-value { color: $color-success; }
      &.stat-fail .stat-value { color: $color-danger; }
      &.stat-rate {
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(139, 92, 246, 0.08));
        border-color: rgba(0, 212, 255, 0.2);
        .stat-value { 
          background: linear-gradient(135deg, $color-accent, $color-purple);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
    }
  }
  
  .compliance-header {
    display: grid;
    grid-template-columns: 1fr 140px 120px 50px;
    gap: 12px;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: rgba(255, 255, 255, 0.02);
    border-radius: $radius-md $radius-md 0 0;
    border: 1px solid $color-border;
    border-bottom: none;
  }
  
  .compliance-list {
    border: 1px solid $color-border;
    border-radius: 0 0 $radius-md $radius-md;
    overflow: hidden;
  }
  
  .compliance-item {
    display: grid;
    grid-template-columns: 1fr 140px 120px 50px;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.01);
    border-bottom: 1px solid $color-border-light;
    transition: all $transition-fast;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    
    &.is-pass {
      border-left: 3px solid $color-success;
    }
    
    &.is-fail {
      border-left: 3px solid $color-danger;
      background: rgba(239, 68, 68, 0.03);
    }
    
    .col-label {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .item-index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: $radius-round;
        background: rgba(0, 212, 255, 0.1);
        color: $color-accent;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      .el-input {
        flex: 1;
      }
    }
    
    .col-status {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .status-text {
        font-size: 12px;
        font-weight: 500;
        
        &.text-pass { color: $color-success; }
        &.text-fail { color: $color-danger; }
      }
    }
    
    .col-time {
      display: flex;
      align-items: center;
      gap: 6px;
      
      .time-icon {
        color: $color-text-muted;
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .el-input {
        width: 80px;
      }
    }
    
    .col-action {
      display: flex;
      justify-content: center;
    }
  }
  
  .compliance-footer {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.report-preview {
  padding: $spacing-lg;
  background: #fff;
  color: #333;
  border-radius: $radius-md;
  max-height: 60vh;
  overflow-y: auto;
}

.report-header {
  text-align: center;
  margin-bottom: $spacing-xl;
  
  h1 {
    font-size: 24px;
    color: #1a1a2e;
    margin-bottom: 8px;
  }
  
  .report-id {
    font-size: 12px;
    color: #999;
  }
}

.report-section {
  margin-bottom: $spacing-xl;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #16213e;
    border-left: 3px solid $color-accent;
    padding-left: $spacing-sm;
    margin-bottom: $spacing-md;
    font-size: 16px;
  }
  
  .section-icon {
    font-size: 18px;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  label {
    font-size: 11px;
    color: #999;
    text-transform: uppercase;
  }
  
  span {
    font-size: 14px;
    color: #333;
  }
}

.compliance-table {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  
  .compliance-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 10px 16px;
    border-bottom: 1px solid #eee;
    font-size: 13px;
    
    &:last-child { border-bottom: none; }
    
    &.header {
      background: #f8f9fa;
      font-weight: 600;
      font-size: 12px;
      color: #666;
    }
  }
}

.compliance-summary {
  margin-top: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(139,92,246,0.08));
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

.summary-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 13px;
}

.remarks-content {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
}

.report-footer {
  margin-top: $spacing-xl;
  text-align: center;
  padding-top: $spacing-md;
  border-top: 1px solid #eee;
  
  p {
    font-size: 11px;
    color: #999;
    margin: 4px 0;
  }
}

.text-success { color: #22c55e; font-weight: 600; }
.text-danger { color: #ef4444; font-weight: 600; }
.status-approved { color: #22c55e; font-weight: 600; }
.status-rejected { color: #ef4444; font-weight: 600; }
.status-pending { color: #f59e0b; font-weight: 600; }

// === 移动端适配 ===
@media (max-width: 640px) {
  .compliance-section {
    .compliance-stats {
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;

      .stat-card {
        padding: 10px 4px;

        .stat-value { font-size: 18px; }
        .stat-label { font-size: 10px; }
      }
    }

    // 隐藏桌面端表头
    .compliance-header {
      display: none;
    }

    .compliance-list {
      border: none;
      border-radius: $radius-md;
    }

    // 检测项改为卡片式布局
    .compliance-item {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: $radius-md;
      border: 1px solid $color-border;

      &.is-pass { border-left: 3px solid $color-success; }
      &.is-fail { border-left: 3px solid $color-danger; }

      // 第一行：序号 + 名称，占满宽度
      .col-label {
        flex: 1 1 100%;
        .el-input { flex: 1; min-width: 0; }
      }

      // 第二行：状态 + 时间 + 删除，横排
      .col-status { flex: 0 0 auto; }

      .col-time {
        flex: 1 1 0;
        min-width: 0;
        .el-input { width: 100%; }
      }

      .col-action {
        flex: 0 0 auto;
        justify-content: center;
      }
    }
  }

  .dialog-footer {
    flex-wrap: nowrap;
    gap: 8px;

    .el-button {
      flex: 1;
      min-width: 0;
    }
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .report-preview {
    padding: $spacing-md;
  }

  .compliance-table .compliance-row {
    grid-template-columns: 1.5fr 1fr 1fr;
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>
