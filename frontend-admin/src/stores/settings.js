import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { createLogger } from '@/utils/logger'

const log = createLogger('SettingsStore')

/**
 * 主题配置映射
 * 定义每个主题的 CSS 变量值
 */
const themeConfigs = {
  'dark-blue': {
    '--theme-accent': '#00D4FF',
    '--theme-accent-soft': '#38bdf8',
    '--theme-accent-light': 'rgba(0, 212, 255, 0.12)',
    '--theme-accent-glow': 'rgba(0, 212, 255, 0.35)',
    '--theme-accent-subtle': 'rgba(0, 212, 255, 0.06)',
    '--theme-bg-deep': '#050a12',
    '--theme-bg-primary': '#0a1220',
    '--theme-bg-card': 'rgba(12, 22, 42, 0.75)'
  },
  'dark-purple': {
    '--theme-accent': '#7B61FF',
    '--theme-accent-soft': '#a78bfa',
    '--theme-accent-light': 'rgba(123, 97, 255, 0.12)',
    '--theme-accent-glow': 'rgba(123, 97, 255, 0.35)',
    '--theme-accent-subtle': 'rgba(123, 97, 255, 0.06)',
    '--theme-bg-deep': '#0a0510',
    '--theme-bg-primary': '#12081f',
    '--theme-bg-card': 'rgba(24, 12, 42, 0.75)'
  },
  'dark-green': {
    '--theme-accent': '#00E676',
    '--theme-accent-soft': '#4ade80',
    '--theme-accent-light': 'rgba(0, 230, 118, 0.12)',
    '--theme-accent-glow': 'rgba(0, 230, 118, 0.35)',
    '--theme-accent-subtle': 'rgba(0, 230, 118, 0.06)',
    '--theme-bg-deep': '#050a08',
    '--theme-bg-primary': '#0a1a12',
    '--theme-bg-card': 'rgba(12, 32, 22, 0.75)'
  }
}

/**
 * 应用主题到 DOM
 * @param {string} themeName - 主题名称
 */
function applyTheme(themeName) {
  const config = themeConfigs[themeName]
  if (!config) return
  
  const root = document.documentElement
  Object.entries(config).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  log.action('应用主题', { theme: themeName })
}

// 默认数据
const defaultProfile = {
  name: '张明华',
  email: 'zhangmh@huadong-factory.com',
  avatar: '',
  department: '安全生产管理部',
  role: '高级安全分析师'
}

const defaultSopList = [
  { id: 's1', name: '生产车间安全操作规范 v2.1', content: '1. 进入生产车间必须佩戴安全帽、防护眼镜和劳保鞋\n2. 操作设备前必须检查安全防护装置是否完好\n3. 严禁在设备运行时进行清洁或维护作业\n4. 发现异常情况立即按下急停按钮并上报\n5. 下班前必须关闭设备电源并做好交接记录', isDefault: true, createdAt: '2026-01-15' },
  { id: 's2', name: '产品质量检测流程规范 v1.3', content: '1. 按照抽样标准进行产品取样\n2. 使用校准合格的检测设备进行测量\n3. 如实记录检测数据并签字确认\n4. 发现不合格品立即隔离并标识\n5. 异常情况2小时内上报质量主管', isDefault: false, createdAt: '2026-01-20' },
  { id: 's3', name: '危险化学品泄漏应急预案 v1.0', content: '1. 发现泄漏立即撤离现场并拉响警报\n2. 通知安全负责人和应急救援队\n3. 在安全距离外设置警戒线\n4. 穿戴防护装备后方可进行处置\n5. 事后填写事故报告并分析原因', isDefault: false, createdAt: '2026-02-01' },
  { id: 's4', name: '特种设备操作安全规程 v1.2', content: '1. 操作人员必须持有效资格证书上岗\n2. 作业前检查设备状态和安全装置\n3. 严格按照操作规程进行作业\n4. 禁止超载、超速、超范围作业\n5. 定期进行设备维护保养和检验', isDefault: false, createdAt: '2026-02-05' }
]

const defaultKnowledgeBase = [
  { id: 'k1', name: '安全生产法律法规汇编2026版.pdf', size: '3.2MB', uploadedAt: '2026-01-10' },
  { id: 'k2', name: '数控机床操作维护手册.docx', size: '2.1MB', uploadedAt: '2026-01-15' },
  { id: 'k3', name: 'GB/T 28001职业健康安全管理体系.pdf', size: '5.4MB', uploadedAt: '2026-01-20' },
  { id: 'k4', name: '化学品安全技术说明书MSDS合集.pdf', size: '8.7MB', uploadedAt: '2026-01-25' },
  { id: 'k5', name: '企业安全生产标准化基本规范.pdf', size: '4.2MB', uploadedAt: '2026-02-01' },
  { id: 'k6', name: '特种设备安全监察条例解读.docx', size: '1.8MB', uploadedAt: '2026-02-05' }
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

export const useSettingsStore = defineStore('settings', () => {
  const profile = ref(loadFromStorage('settings_profile', defaultProfile))
  const theme = ref(localStorage.getItem('theme') || 'dark-blue')
  const sopComplianceEnabled = ref(loadFromStorage('settings_sopComplianceEnabled', true))
  const sopList = ref(loadFromStorage('settings_sopList', defaultSopList))
  const knowledgeBase = ref(loadFromStorage('settings_knowledgeBase', defaultKnowledgeBase))

  // 监听变化并持久化
  watch(profile, (val) => saveToStorage('settings_profile', val), { deep: true })
  watch(sopComplianceEnabled, (val) => saveToStorage('settings_sopComplianceEnabled', val))
  watch(sopList, (val) => saveToStorage('settings_sopList', val), { deep: true })
  watch(knowledgeBase, (val) => saveToStorage('settings_knowledgeBase', val), { deep: true })

  const themeOptions = [
    { value: 'dark-blue', label: '深空蓝', primary: '#00D4FF', bg: '#0A1628' },
    { value: 'dark-purple', label: '星际紫', primary: '#7B61FF', bg: '#12081F' },
    { value: 'dark-green', label: '极光绿', primary: '#00E676', bg: '#0A1A12' }
  ]

  watch(theme, (val) => {
    localStorage.setItem('theme', val)
    applyTheme(val)
  })

  // 初始化时应用主题
  applyTheme(theme.value)

  function updateProfile(data) {
    log.action('更新个人信息', { fields: Object.keys(data) })
    Object.assign(profile.value, data)
  }

  function addSop(sop) {
    const newSop = { ...sop, id: `s${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }
    sopList.value.push(newSop)
    log.action('新建SOP', { name: sop.name, id: newSop.id })
  }

  function removeSop(id) {
    const target = sopList.value.find(s => s.id === id)
    log.action('删除SOP', { id, name: target?.name })
    sopList.value = sopList.value.filter(s => s.id !== id)
  }

  function setDefaultSop(id) {
    sopList.value.forEach(s => { s.isDefault = s.id === id })
    log.action('设置默认SOP', { id })
  }

  function addKnowledge(item) {
    const newItem = { ...item, id: `k${Date.now()}`, uploadedAt: new Date().toISOString().split('T')[0] }
    knowledgeBase.value.push(newItem)
    log.action('上传知识库文档', { name: item.name, id: newItem.id })
  }

  function removeKnowledge(id) {
    const target = knowledgeBase.value.find(k => k.id === id)
    log.action('删除知识库文档', { id, name: target?.name })
    knowledgeBase.value = knowledgeBase.value.filter(k => k.id !== id)
  }

  return {
    profile, theme, sopComplianceEnabled, sopList, knowledgeBase, themeOptions,
    updateProfile, addSop, removeSop, setDefaultSop, addKnowledge, removeKnowledge
  }
})
