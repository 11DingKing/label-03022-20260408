import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 默认数据
const defaultStats = {
  bandwidth: { value: 128.5, unit: 'GB', label: 'G消耗流量', trend: 12.5 },
  storage: { value: 2.4, unit: 'PB', label: 'P消耗存储', trend: 8.3 },
  tokens: { value: 856, unit: 'K', label: 'T消耗Tokens', trend: -3.2 },
  analyzed: { value: 186, unit: '', label: '已分析视频', trend: 15.0 },
  pending: { value: 42, unit: '', label: '待处理视频', trend: -5.0 },
  compliance: { value: 94.7, unit: '%', label: '合规率', trend: 2.1 },
  todayVideos: { value: 12, unit: '', label: '今日视频', trend: 20.0 },
  reports: { value: 328, unit: '', label: '生成报告', trend: 10.5 }
}

const defaultTasks = [
  { id: 't1', title: '完成华东工厂A车间巡检视频分析', status: 'in_progress', dueDate: '2026-02-14' },
  { id: 't2', title: '更新焊接作业安全操作规范SOP', status: 'pending', dueDate: '2026-02-15' },
  { id: 't3', title: '生成1月份安全生产合规报告', status: 'pending', dueDate: '2026-02-16' },
  { id: 't4', title: '审核新员工入职培训视频', status: 'completed', dueDate: '2026-02-13' },
  { id: 't5', title: '上传危化品管理知识库文档', status: 'in_progress', dueDate: '2026-02-14' },
  { id: 't6', title: '整理特种设备操作培训资料', status: 'pending', dueDate: '2026-02-17' },
  { id: 't7', title: '复核B车间生产线监控视频', status: 'pending', dueDate: '2026-02-18' },
  { id: 't8', title: '准备季度安全生产工作汇报', status: 'pending', dueDate: '2026-02-20' }
]

const defaultNotifications = [
  { id: 'n1', title: '视频分析完成', content: '华东工厂A车间日常巡检记录分析已完成，发现2处安全隐患需关注', isRead: false, createdAt: '2026-02-14T08:30:00' },
  { id: 'n2', title: '合规率预警', content: '本周安全合规率下降至92.3%，主要问题集中在防护装备佩戴', isRead: false, createdAt: '2026-02-14T07:15:00' },
  { id: 'n3', title: '存储空间提醒', content: '视频存储使用率已达85%，建议清理30天前的已分析视频', isRead: true, createdAt: '2026-02-13T16:00:00' },
  { id: 'n4', title: 'AI模型更新', content: '视频分析AI模型已升级至v3.2版本，安全隐患识别精度提升15%', isRead: true, createdAt: '2026-02-13T10:00:00' },
  { id: 'n5', title: '新SOP发布', content: '焊接作业安全操作规范v2.1已发布，请及时组织学习', isRead: false, createdAt: '2026-02-14T09:00:00' },
  { id: 'n6', title: '培训任务提醒', content: '新员工安全培训第二期将于明日开始，请提前准备培训视频', isRead: false, createdAt: '2026-02-14T10:30:00' }
]

/**
 * 从 localStorage 加载数据
 */
function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (e) {
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
    // 忽略存储错误
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref(loadFromStorage('dashboard_stats', defaultStats))
  const tasks = ref(loadFromStorage('dashboard_tasks', defaultTasks))
  const notifications = ref(loadFromStorage('dashboard_notifications', defaultNotifications))

  // 监听变化并持久化
  watch(stats, (val) => saveToStorage('dashboard_stats', val), { deep: true })
  watch(tasks, (val) => saveToStorage('dashboard_tasks', val), { deep: true })
  watch(notifications, (val) => saveToStorage('dashboard_notifications', val), { deep: true })

  return { stats, tasks, notifications }
})
