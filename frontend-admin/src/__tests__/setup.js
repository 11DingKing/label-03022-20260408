import { vi, beforeEach } from 'vitest'

// Mock Element Plus 的具名导出（不 mock 默认导出，让组件测试可以正常使用 plugin）
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm')
    }
  }
})

// Mock localStorage
let localStorageStore = {}
const localStorageMock = {
  getItem: vi.fn(key => localStorageStore[key] || null),
  setItem: vi.fn((key, value) => { localStorageStore[key] = String(value) }),
  removeItem: vi.fn(key => { delete localStorageStore[key] }),
  clear: vi.fn(() => { localStorageStore = {} })
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// 每次测试前清空 localStorage
beforeEach(() => {
  localStorageStore = {}
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true
})

// Mock window dimensions
Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
