/**
 * 合规性检测引擎
 * 
 * 基于 SOP 规则和视频转写文本，检测视频内容是否符合合规要求。
 * 支持：禁止性话术检测、必要内容缺失检测、时间点定位。
 *
 * @module utils/complianceDetector
 */

import { createLogger } from '@/utils/logger'

const log = createLogger('ComplianceDetector')

/**
 * 内置合规规则库
 * 每条规则包含：id、标签、类型（forbidden/required）、关键词/模式、严重级别
 */
const builtinRules = [
  // 禁止性话术
  {
    id: 'forbidden_guarantee',
    label: '禁止性话术检测 - 保本保收益',
    type: 'forbidden',
    patterns: ['保本', '保收益', '稳赚不赔', '零风险', '保证收益', '绝对安全', '不会亏'],
    severity: 'high',
    suggestion: '避免使用"保本"、"保收益"等禁止性用语，改用"历史业绩不代表未来表现，投资需谨慎"'
  },
  {
    id: 'forbidden_exaggeration',
    label: '禁止性话术检测 - 夸大宣传',
    type: 'forbidden',
    patterns: ['最好的', '第一名', '绝对领先', '无与伦比', '史上最强', '100%'],
    severity: 'medium',
    suggestion: '避免使用绝对化用语，应使用客观、准确的表述'
  },
  // 必要内容检测
  {
    id: 'required_opening',
    label: '开场白规范',
    type: 'required',
    patterns: ['欢迎', '各位好', '大家好', '你好', '自我介绍'],
    severity: 'low',
    suggestion: '视频应包含规范的开场白和自我介绍'
  },
  {
    id: 'required_risk_warning',
    label: '风险提示完整',
    type: 'required',
    patterns: ['风险', '谨慎', '注意安全', '安全提示', '风险提示', '投资有风险'],
    severity: 'high',
    suggestion: '视频中应包含完整的风险提示内容'
  },
  {
    id: 'required_closing',
    label: '结束语规范',
    type: 'required',
    patterns: ['感谢', '谢谢', '联系方式', '如有问题', '再见'],
    severity: 'low',
    suggestion: '视频应包含规范的结束语'
  },
  {
    id: 'required_safety_equipment',
    label: '安全防护提醒',
    type: 'required',
    patterns: ['安全帽', '防护', '劳保', '安全带', '护目镜', '手套', '防护装备'],
    severity: 'medium',
    suggestion: '培训视频应提及必要的安全防护装备要求'
  },
  {
    id: 'forbidden_unsafe_behavior',
    label: '危险行为提示',
    type: 'forbidden',
    patterns: ['不用戴', '不需要防护', '没关系', '不会出事', '省略这步'],
    severity: 'high',
    suggestion: '不应出现鼓励省略安全步骤的表述'
  }
]

/**
 * 解析转写文本为带时间戳的段落
 * 支持格式: [MM:SS] 文本内容 或 [HH:MM:SS] 文本内容
 * @param {string} transcript - 转写文本
 * @returns {Array<{time: number, timeStr: string, text: string}>}
 */
function parseTranscript(transcript) {
  if (!transcript) return []
  
  const segments = []
  const lines = transcript.split('\n').filter(l => l.trim())
  
  for (const line of lines) {
    const match = line.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(.+)/)
    if (match) {
      const hours = match[3] !== undefined ? parseInt(match[1]) : 0
      const minutes = match[3] !== undefined ? parseInt(match[2]) : parseInt(match[1])
      const seconds = match[3] !== undefined ? parseInt(match[3]) : parseInt(match[2])
      const time = hours * 3600 + minutes * 60 + seconds
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      segments.push({ time, timeStr, text: match[4] || match[3] || '' })
    } else {
      // 无时间戳的行，归入上一个段落或作为独立段落
      segments.push({ time: 0, timeStr: '00:00', text: line.trim() })
    }
  }
  
  return segments
}

/**
 * 在文本段落中搜索关键词匹配
 * @param {Array} segments - 解析后的转写段落
 * @param {Array<string>} patterns - 要搜索的关键词列表
 * @returns {Array<{timeStr: string, time: number, matchedText: string, keyword: string}>}
 */
function findPatternMatches(segments, patterns) {
  const matches = []
  for (const seg of segments) {
    for (const pattern of patterns) {
      if (seg.text.includes(pattern)) {
        matches.push({
          timeStr: seg.timeStr,
          time: seg.time,
          matchedText: seg.text,
          keyword: pattern
        })
      }
    }
  }
  return matches
}

/**
 * 执行合规性检测
 * 
 * @param {string} transcript - 视频转写文本
 * @param {Object} options - 检测选项
 * @param {Array} [options.customRules] - 自定义规则（来自 SOP）
 * @param {Array} [options.ruleIds] - 仅运行指定规则 ID
 * @param {string} [options.videoName] - 视频名称（用于日志）
 * @returns {{
 *   items: Array<{label: string, pass: boolean, time: string, severity: string, detail: string, suggestion: string}>,
 *   summary: {total: number, passed: number, failed: number, passRate: number},
 *   detectedAt: string
 * }}
 */
export function runComplianceDetection(transcript, options = {}) {
  const { customRules = [], ruleIds, videoName = '' } = options
  log.info('开始合规性检测', { videoName, transcriptLength: transcript?.length || 0 })
  
  const segments = parseTranscript(transcript)
  const allText = segments.map(s => s.text).join(' ')
  const rules = [...builtinRules, ...customRules]
  const activeRules = ruleIds ? rules.filter(r => ruleIds.includes(r.id)) : rules
  
  const items = []
  
  for (const rule of activeRules) {
    const matches = findPatternMatches(segments, rule.patterns)
    
    if (rule.type === 'forbidden') {
      // 禁止性内容：找到匹配 = 不通过
      const pass = matches.length === 0
      const firstMatch = matches[0]
      items.push({
        label: rule.label,
        pass,
        time: firstMatch ? firstMatch.timeStr : '--:--',
        severity: rule.severity,
        detail: pass
          ? '未检测到违规内容'
          : `在 ${firstMatch.timeStr} 检测到禁止性内容："${firstMatch.keyword}"`,
        suggestion: rule.suggestion,
        matchCount: matches.length,
        matches: matches.slice(0, 3) // 最多返回3个匹配
      })
    } else if (rule.type === 'required') {
      // 必要内容：未找到匹配 = 不通过
      const pass = matches.length > 0
      const firstMatch = matches[0]
      items.push({
        label: rule.label,
        pass,
        time: firstMatch ? firstMatch.timeStr : '--:--',
        severity: rule.severity,
        detail: pass
          ? `在 ${firstMatch.timeStr} 检测到相关内容`
          : '未检测到必要内容',
        suggestion: rule.suggestion,
        matchCount: matches.length,
        matches: matches.slice(0, 3)
      })
    }
  }
  
  // 按严重级别排序：high > medium > low，未通过的排前面
  const severityOrder = { high: 0, medium: 1, low: 2 }
  items.sort((a, b) => {
    if (a.pass !== b.pass) return a.pass ? 1 : -1
    return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2)
  })
  
  const passed = items.filter(i => i.pass).length
  const result = {
    items,
    summary: {
      total: items.length,
      passed,
      failed: items.length - passed,
      passRate: items.length > 0 ? Math.round((passed / items.length) * 100) : 100
    },
    detectedAt: new Date().toISOString()
  }
  
  log.info('合规性检测完成', { 
    videoName, 
    total: result.summary.total, 
    passed: result.summary.passed, 
    passRate: result.summary.passRate 
  })
  
  return result
}

/**
 * 从 SOP 文本中提取自定义规则
 * @param {string} sopContent - SOP 内容
 * @param {string} sopName - SOP 名称
 * @returns {Array} 提取的规则
 */
export function extractRulesFromSop(sopContent, sopName = 'SOP') {
  if (!sopContent) return []
  
  const rules = []
  const lines = sopContent.split('\n').filter(l => l.trim())
  
  for (const line of lines) {
    const trimmed = line.replace(/^[\d.、\-*#]+\s*/, '').trim()
    if (!trimmed || trimmed.length < 4) continue
    
    // 检测"禁止"、"严禁"、"不得"等否定性规则
    if (/禁止|严禁|不得|不允许|不可以|不能/.test(trimmed)) {
      // 提取关键动作词
      const actionMatch = trimmed.match(/(?:禁止|严禁|不得|不允许|不可以|不能)(.{2,10})/)
      if (actionMatch) {
        rules.push({
          id: `sop_forbidden_${rules.length}`,
          label: `${sopName} - ${trimmed.slice(0, 20)}`,
          type: 'forbidden',
          patterns: [actionMatch[1].replace(/[，。、]/g, '').trim()],
          severity: 'medium',
          suggestion: trimmed
        })
      }
    }
    
    // 检测"必须"、"应当"、"需要"等要求性规则
    if (/必须|应当|需要|确保|务必/.test(trimmed)) {
      const actionMatch = trimmed.match(/(?:必须|应当|需要|确保|务必)(.{2,10})/)
      if (actionMatch) {
        rules.push({
          id: `sop_required_${rules.length}`,
          label: `${sopName} - ${trimmed.slice(0, 20)}`,
          type: 'required',
          patterns: [actionMatch[1].replace(/[，。、]/g, '').trim()],
          severity: 'medium',
          suggestion: trimmed
        })
      }
    }
  }
  
  return rules
}

/**
 * 检测视频文案与内容的匹配度
 * 比较视频摘要/标题与转写文本的关键词重合度
 * @param {string} videoName - 视频名称
 * @param {Array<string>} videoTags - 视频标签
 * @param {string} transcript - 转写文本
 * @returns {{matchRate: number, matched: string[], unmatched: string[], detail: string}}
 */
export function detectContentMismatch(videoName, videoTags, transcript) {
  if (!transcript || !videoName) {
    return { matchRate: 0, matched: [], unmatched: videoTags || [], detail: '缺少转写文本，无法进行匹配检测' }
  }
  
  const allText = transcript.toLowerCase()
  const keywords = [...(videoTags || [])]
  
  // 从视频名称中提取关键词
  const nameKeywords = videoName.match(/[\u4e00-\u9fa5]{2,}/g) || []
  keywords.push(...nameKeywords.filter(k => k.length >= 2 && !keywords.includes(k)))
  
  const unique = [...new Set(keywords)]
  const matched = unique.filter(k => allText.includes(k.toLowerCase()))
  const unmatched = unique.filter(k => !allText.includes(k.toLowerCase()))
  
  const matchRate = unique.length > 0 ? Math.round((matched.length / unique.length) * 100) : 0
  
  let detail = `视频标题/标签共 ${unique.length} 个关键词，转写文本匹配 ${matched.length} 个`
  if (unmatched.length > 0) {
    detail += `，未匹配：${unmatched.join('、')}`
  }
  
  return { matchRate, matched, unmatched, detail }
}

export { builtinRules, parseTranscript }
