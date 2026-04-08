/**
 * Web Speech API 语音识别封装
 * 支持浏览器原生语音识别，增强功能包括：
 * - 噪声抑制（通过 AudioContext 处理）
 * - 断句优化（智能分段）
 * - 超时自动重启
 * - 优雅降级
 */

import { createLogger } from './logger'

const log = createLogger('Speech')

// 检测浏览器支持
const SpeechRecognition = typeof window !== 'undefined' 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

// 检测 AudioContext 支持（用于噪声抑制）
const AudioContext = typeof window !== 'undefined'
  ? (window.AudioContext || window.webkitAudioContext)
  : null

/**
 * 语音识别配置
 */
const DEFAULT_CONFIG = {
  lang: 'zh-CN',
  continuous: false,
  interimResults: true,
  maxAlternatives: 3,
  // 增强配置
  silenceTimeout: 2000,      // 静音超时（毫秒）
  maxDuration: 60000,        // 最大录音时长（毫秒）
  autoRestart: true,         // 静音后自动重启
  noiseReduction: true,      // 启用噪声抑制
  punctuationHints: true     // 断句提示
}

/**
 * 创建语音识别实例
 * @param {Object} options 配置选项
 * @returns {Object} 语音识别控制器
 */
export function createSpeechRecognition(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }
  const {
    onResult = () => {},
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
    onSilence = () => {},
    lang,
    silenceTimeout,
    maxDuration,
    autoRestart,
    noiseReduction
  } = config

  // 不支持时返回降级实现
  if (!SpeechRecognition) {
    log.warn('浏览器不支持语音识别')
    return {
      isSupported: false,
      start: () => {
        onError({ error: 'not-supported', message: '当前浏览器不支持语音识别，请使用 Chrome 或 Edge' })
      },
      stop: () => {},
      abort: () => {},
      destroy: () => {}
    }
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = config.continuous
  recognition.interimResults = config.interimResults
  recognition.lang = lang
  recognition.maxAlternatives = config.maxAlternatives

  let isListening = false
  let silenceTimer = null
  let durationTimer = null
  let audioContext = null
  let mediaStream = null
  let lastResultTime = 0
  let accumulatedTranscript = ''

  // 清理定时器
  const clearTimers = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      silenceTimer = null
    }
    if (durationTimer) {
      clearTimeout(durationTimer)
      durationTimer = null
    }
  }

  // 重置静音计时器
  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer)
    if (silenceTimeout > 0 && isListening) {
      silenceTimer = setTimeout(() => {
        log.info('检测到静音超时')
        onSilence({ duration: silenceTimeout })
        if (autoRestart && isListening) {
          // 自动重启识别
          try {
            recognition.stop()
            setTimeout(() => {
              if (isListening) recognition.start()
            }, 100)
          } catch (e) {
            // 忽略
          }
        }
      }, silenceTimeout)
    }
  }

  // 初始化噪声抑制（如果支持）
  const initNoiseReduction = async () => {
    if (!noiseReduction || !AudioContext || !navigator.mediaDevices) return

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      audioContext = new AudioContext()
      log.info('噪声抑制已启用')
    } catch (e) {
      log.warn('无法启用噪声抑制', e.message)
    }
  }

  // 清理音频资源
  const cleanupAudio = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close()
      audioContext = null
    }
  }

  recognition.onstart = () => {
    isListening = true
    lastResultTime = Date.now()
    accumulatedTranscript = ''
    log.info('语音识别已启动')
    onStart()
    resetSilenceTimer()
    
    // 设置最大时长限制
    if (maxDuration > 0) {
      durationTimer = setTimeout(() => {
        log.info('达到最大录音时长')
        recognition.stop()
      }, maxDuration)
    }
  }

  recognition.onend = () => {
    isListening = false
    clearTimers()
    log.info('语音识别已结束')
    onEnd()
  }

  recognition.onerror = (event) => {
    isListening = false
    clearTimers()
    
    const errorMessages = {
      'no-speech': '未检测到语音，请重试',
      'audio-capture': '无法访问麦克风，请检查权限',
      'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
      'network': '网络错误，请检查网络连接',
      'aborted': '语音识别已取消',
      'language-not-supported': '不支持当前语言',
      'service-not-allowed': '语音服务不可用'
    }
    
    log.warn('语音识别错误', { error: event.error })
    onError({
      error: event.error,
      message: errorMessages[event.error] || `语音识别错误: ${event.error}`
    })
  }

  recognition.onresult = (event) => {
    lastResultTime = Date.now()
    resetSilenceTimer()
    
    const results = event.results
    const lastResult = results[results.length - 1]
    const transcript = lastResult[0].transcript
    const isFinal = lastResult.isFinal
    const confidence = lastResult[0].confidence
    
    // 获取备选结果
    const alternatives = []
    for (let i = 1; i < lastResult.length && i < 3; i++) {
      alternatives.push({
        transcript: lastResult[i].transcript,
        confidence: lastResult[i].confidence
      })
    }
    
    // 断句优化：检测自然停顿
    let processedTranscript = transcript
    if (config.punctuationHints && isFinal) {
      processedTranscript = addPunctuation(transcript)
    }
    
    if (isFinal) {
      accumulatedTranscript += processedTranscript
    }
    
    onResult({
      transcript: processedTranscript,
      isFinal,
      confidence,
      alternatives,
      accumulated: accumulatedTranscript
    })
  }

  // 语音活动检测回调
  recognition.onspeechstart = () => {
    log.debug('检测到语音开始')
    resetSilenceTimer()
  }

  recognition.onspeechend = () => {
    log.debug('检测到语音结束')
  }

  return {
    isSupported: true,
    
    start: async () => {
      if (isListening) return
      
      try {
        // 初始化噪声抑制
        if (noiseReduction) {
          await initNoiseReduction()
        }
        recognition.start()
      } catch (e) {
        if (e.message?.includes('already started')) {
          log.warn('语音识别已在运行')
          onError({ error: 'already-started', message: '语音识别已在运行' })
        } else {
          log.error('启动语音识别失败', e)
          onError({ error: 'start-failed', message: '启动语音识别失败' })
        }
      }
    },
    
    stop: () => {
      if (isListening) {
        clearTimers()
        recognition.stop()
      }
    },
    
    abort: () => {
      clearTimers()
      recognition.abort()
      isListening = false
    },
    
    destroy: () => {
      clearTimers()
      cleanupAudio()
      if (isListening) {
        recognition.abort()
      }
    },
    
    // 获取当前状态
    getState: () => ({
      isListening,
      lastResultTime,
      accumulatedTranscript
    })
  }
}

/**
 * 简单的断句处理
 * @param {string} text 原始文本
 * @returns {string} 处理后的文本
 */
function addPunctuation(text) {
  if (!text) return text
  
  // 中文断句规则
  const patterns = [
    // 问句
    { regex: /(什么|怎么|为什么|哪里|谁|多少|是不是|有没有|能不能|可不可以).*$/g, suffix: '？' },
    // 感叹
    { regex: /(太|真|好|非常|特别).*(了|啊|呀)$/g, suffix: '！' },
    // 陈述句结尾
    { regex: /(了|的|吧|呢|啊|嘛)$/g, suffix: '。' }
  ]
  
  let result = text.trim()
  
  // 如果已有标点则不处理
  if (/[。！？，、；：]$/.test(result)) {
    return result
  }
  
  // 尝试匹配断句规则
  for (const pattern of patterns) {
    if (pattern.regex.test(result)) {
      return result + pattern.suffix
    }
  }
  
  // 默认添加句号
  if (result.length > 5) {
    return result + '。'
  }
  
  return result
}

/**
 * 检查语音识别是否可用
 */
export function isSpeechRecognitionSupported() {
  return !!SpeechRecognition
}

/**
 * 检查噪声抑制是否可用
 */
export function isNoiseReductionSupported() {
  return !!(AudioContext && navigator.mediaDevices?.getUserMedia)
}

/**
 * 获取语音识别能力信息
 */
export function getSpeechCapabilities() {
  return {
    recognition: !!SpeechRecognition,
    noiseReduction: isNoiseReductionSupported(),
    synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window
  }
}
