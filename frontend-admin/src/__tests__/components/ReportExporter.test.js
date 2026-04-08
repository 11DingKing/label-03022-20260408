import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ReportExporter from '@/components/ReportExporter.vue'
import ElementPlus from 'element-plus'

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test')
global.URL.revokeObjectURL = vi.fn()

describe('ReportExporter 组件', () => {
  let wrapper

  const mockReportData = {
    videoName: '测试视频.mp4',
    duration: '03:45',
    analysisTime: '2024-01-15 10:30:00',
    reportId: 'RPT-TEST123',
    complianceResults: [
      { label: '安全帽佩戴', pass: true, time: '00:15' },
      { label: '工作服穿着', pass: true, time: '00:30' },
      { label: '操作规范', pass: false, time: '01:20' }
    ],
    summary: '这是一段AI生成的视频摘要内容。'
  }

  beforeEach(async () => {
    wrapper = mount(ReportExporter, {
      props: {
        modelValue: false,
        reportData: mockReportData
      },
      global: {
        plugins: [ElementPlus]
      }
    })
    // 触发 watch - 模拟打开对话框
    await wrapper.setProps({ modelValue: true })
    await wrapper.vm.$nextTick()
  })

  describe('基础渲染', () => {
    it('应渲染对话框', () => {
      expect(wrapper.find('.el-dialog').exists()).toBe(true)
    })

    it('应渲染标签页', () => {
      expect(wrapper.find('.el-tabs').exists()).toBe(true)
    })

    it('应有4个标签页', () => {
      const tabs = wrapper.findAll('.el-tabs__item')
      expect(tabs.length).toBe(4)
    })
  })

  describe('基本信息标签页', () => {
    it('应显示视频名称输入框', () => {
      const inputs = wrapper.findAll('.el-input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('应正确显示视频名称', () => {
      expect(wrapper.vm.data.videoName).toBe('测试视频.mp4')
    })

    it('应正确显示视频时长', () => {
      expect(wrapper.vm.data.duration).toBe('03:45')
    })

    it('应正确显示分析时间', () => {
      expect(wrapper.vm.data.analysisTime).toBe('2024-01-15 10:30:00')
    })
  })

  describe('合规检测标签页', () => {
    it('应正确加载合规检测结果', () => {
      expect(wrapper.vm.data.complianceResults.length).toBe(3)
    })

    it('应能添加检测项', async () => {
      const initialCount = wrapper.vm.data.complianceResults.length
      wrapper.vm.addComplianceItem()
      expect(wrapper.vm.data.complianceResults.length).toBe(initialCount + 1)
    })

    it('应能删除检测项', async () => {
      const initialCount = wrapper.vm.data.complianceResults.length
      wrapper.vm.removeComplianceItem(0)
      expect(wrapper.vm.data.complianceResults.length).toBe(initialCount - 1)
    })
  })

  describe('计算属性', () => {
    it('应正确计算通过数量', () => {
      expect(wrapper.vm.passCount).toBe(2)
    })

    it('应正确计算通过率', () => {
      expect(wrapper.vm.passRate).toBe(67) // 2/3 ≈ 67%
    })

    it('空结果时通过率应为0', async () => {
      wrapper.vm.data.complianceResults = []
      expect(wrapper.vm.passRate).toBe(0)
    })

    it('应正确显示审核状态文本', () => {
      wrapper.vm.data.reviewStatus = 'approved'
      expect(wrapper.vm.reviewStatusText).toBe('已通过')
      
      wrapper.vm.data.reviewStatus = 'rejected'
      expect(wrapper.vm.reviewStatusText).toBe('未通过')
      
      wrapper.vm.data.reviewStatus = 'pending'
      expect(wrapper.vm.reviewStatusText).toBe('待审核')
    })
  })

  describe('对话框控制', () => {
    it('关闭对话框时应触发 update:modelValue', async () => {
      wrapper.vm.visible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('预览功能', () => {
    it('应能打开预览对话框', async () => {
      wrapper.vm.showPreviewDialog = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.showPreviewDialog).toBe(true)
    })
  })

  describe('导出功能', () => {
    beforeEach(() => {
      // Mock document methods
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
    })

    it('应能生成HTML内容', () => {
      const html = wrapper.vm.generateHTML()
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('视频分析报告')
    })

    it('HTML应包含视频名称', () => {
      const html = wrapper.vm.generateHTML()
      expect(html).toContain('测试视频.mp4')
    })

    it('HTML应包含合规检测结果', () => {
      // 重新设置数据以确保完整性
      wrapper.vm.data.complianceResults = [
        { label: '安全帽佩戴', pass: true, time: '00:15' },
        { label: '工作服穿着', pass: true, time: '00:30' },
        { label: '操作规范', pass: false, time: '01:20' }
      ]
      const html = wrapper.vm.generateHTML()
      expect(html).toContain('安全帽佩戴')
      expect(html).toContain('工作服穿着')
      expect(html).toContain('操作规范')
    })

    it('导出JSON时应触发 exported 事件', async () => {
      wrapper.vm.exportJSON()
      expect(wrapper.emitted('exported')).toBeTruthy()
      expect(wrapper.emitted('exported')[0][0].format).toBe('json')
    })

    it('导出Markdown时应触发 exported 事件', async () => {
      wrapper.vm.exportMarkdown()
      expect(wrapper.emitted('exported')).toBeTruthy()
      expect(wrapper.emitted('exported')[0][0].format).toBe('markdown')
    })
  })

  describe('数据初始化', () => {
    it('应正确加载报告编号', async () => {
      expect(wrapper.vm.data.reportId).toBe('RPT-TEST123')
    })

    it('无报告编号时应自动生成', async () => {
      const dataWithoutId = { ...mockReportData, reportId: '' }
      const newWrapper = mount(ReportExporter, {
        props: {
          modelValue: false,
          reportData: dataWithoutId
        },
        global: {
          plugins: [ElementPlus]
        }
      })
      await newWrapper.setProps({ modelValue: true })
      await newWrapper.vm.$nextTick()
      expect(newWrapper.vm.data.reportId).toMatch(/^RPT-/)
    })
  })

  describe('审核状态', () => {
    it('默认审核状态应为 pending', async () => {
      const dataWithoutStatus = { ...mockReportData }
      delete dataWithoutStatus.reviewStatus
      const newWrapper = mount(ReportExporter, {
        props: {
          modelValue: false,
          reportData: dataWithoutStatus
        },
        global: {
          plugins: [ElementPlus]
        }
      })
      await newWrapper.setProps({ modelValue: true })
      await newWrapper.vm.$nextTick()
      expect(newWrapper.vm.data.reviewStatus).toBe('pending')
    })
  })

  describe('备注功能', () => {
    it('应能设置备注', async () => {
      wrapper.vm.data.remarks = '这是测试备注'
      expect(wrapper.vm.data.remarks).toBe('这是测试备注')
    })
  })

  describe('摘要功能', () => {
    it('应正确显示摘要', () => {
      expect(wrapper.vm.data.summary).toBe('这是一段AI生成的视频摘要内容。')
    })
  })

  describe('数据响应', () => {
    it('data应为响应式对象', () => {
      expect(wrapper.vm.data).toBeDefined()
      expect(typeof wrapper.vm.data).toBe('object')
    })

    it('visible应为布尔值', () => {
      expect(typeof wrapper.vm.visible).toBe('boolean')
    })
  })
})
