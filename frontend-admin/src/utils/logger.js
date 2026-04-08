/**
 * 前端日志系统
 * 支持分级日志、模块标记、操作审计
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
const CURRENT_LEVEL = LOG_LEVELS.DEBUG

const LOG_COLORS = {
  DEBUG: '#8892A4',
  INFO: '#00D4FF',
  WARN: '#FFD740',
  ERROR: '#FF5252'
}

class Logger {
  constructor(module) {
    this.module = module
    this._logs = []
  }

  _format(level, message, data) {
    const timestamp = new Date().toISOString()
    const entry = { timestamp, level, module: this.module, message, data }
    this._logs.push(entry)

    // 保留最近500条日志
    if (this._logs.length > 500) this._logs.shift()

    return entry
  }

  _output(level, message, data) {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return

    const entry = this._format(level, message, data)
    const color = LOG_COLORS[level]
    const prefix = `%c[${entry.timestamp.split('T')[1].split('.')[0]}] [${level}] [${this.module}]`

    if (data !== undefined) {
      console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
        prefix, `color: ${color}; font-weight: bold`, message, data
      )
    } else {
      console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
        prefix, `color: ${color}; font-weight: bold`, message
      )
    }

    return entry
  }

  debug(message, data) { return this._output('DEBUG', message, data) }
  info(message, data) { return this._output('INFO', message, data) }
  warn(message, data) { return this._output('WARN', message, data) }
  error(message, data) { return this._output('ERROR', message, data) }

  /** 记录用户操作（审计日志） */
  action(actionName, detail) {
    return this._output('INFO', `[ACTION] ${actionName}`, detail)
  }

  getLogs() { return [...this._logs] }
  clear() { this._logs = [] }
}

// 模块日志工厂
const loggers = new Map()

export function createLogger(module) {
  if (!loggers.has(module)) {
    loggers.set(module, new Logger(module))
  }
  return loggers.get(module)
}

// 全局日志收集
export function getAllLogs() {
  const all = []
  loggers.forEach(logger => all.push(...logger.getLogs()))
  return all.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export default { createLogger, getAllLogs }
