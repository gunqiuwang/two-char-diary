// utils/diary.js — 记录存储：精简结构、版本迁移、安全写入、备份导入导出
//
// v2 记录结构（约 60 字节/条）：
//   diary_data = { '2026-10-19': { words: '平静', yao: '798777', timestamp: 1760000000000 } }
//   yao 为自下而上 6 位：6 老阴、7 少阳、8 少阴、9 老阳。
//   卦名、卦辞、爻辞、农历都由 yao 和日期推导，不再落盘。
const { HEX_DATA } = require('./hexdata')

const DIARY_KEY = 'diary_data'
const SCHEMA_KEY = 'diary_schema'
const SCHEMA_VERSION = 2
const BACKUP_HEADER = '# 二字爻记备份 v2'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function loadDiary() {
  return wx.getStorageSync(DIARY_KEY) || {}
}

// 写入失败（通常是单 key 超过 1MB）时提示用户，并返回 false 让调用方不进入“已保存”状态
function saveDiary(data) {
  try {
    wx.setStorageSync(DIARY_KEY, data)
    return true
  } catch (e) {
    wx.showModal({
      title: '保存失败',
      content: '本机存储空间不足，这条记录未能保存。可在设置中导出备份后再清理。',
      showCancel: false
    })
    return false
  }
}

function isYaoCode(value) {
  return typeof value === 'string' && /^[6789]{6}$/.test(value)
}

function yaosToCode(yaos) {
  return yaos.map(y => String(y.value || (y.type === 'yang' ? 7 : 8))).join('')
}

// 兼容 v1 记录（yaos 数组）
function getYaoCode(record) {
  if (!record) return ''
  if (isYaoCode(record.yao)) return record.yao
  if (Array.isArray(record.yaos) && record.yaos.length === 6) return yaosToCode(record.yaos)
  return ''
}

// bits：自下而上 6 位 0/1
function getHexViewFromBits(bits) {
  const hex = HEX_DATA[bits]
  if (!hex) return null
  return {
    symbol: hex.symbol,
    name: hex.name,
    ci: hex.ci,
    yaoTexts: hex.yaos.slice().reverse(),
    hexLines: bits.split('').reverse().map((bit, index) => ({ key: index, type: bit === '1' ? 'yang' : 'yin' }))
  }
}

function getHexView(record) {
  const code = getYaoCode(record)
  return code ? getHexViewFromBits(code.replace(/[79]/g, '1').replace(/[68]/g, '0')) : null
}

function slimRecord(record) {
  if (!record || typeof record !== 'object') return null
  const slim = {}
  if (record.words) slim.words = record.words
  const yao = getYaoCode(record)
  if (yao) slim.yao = yao
  if (record.timestamp) slim.timestamp = record.timestamp
  return slim.words || slim.yao ? slim : null
}

function migrateDiary() {
  if (wx.getStorageSync(SCHEMA_KEY) === SCHEMA_VERSION) return
  const data = loadDiary()
  const next = {}
  Object.keys(data).forEach(key => {
    const record = slimRecord(data[key])
    if (record) next[key] = record
  })
  // 迁移失败则保留旧数据；读取侧兼容旧结构，下次启动再试
  try {
    wx.setStorageSync(DIARY_KEY, next)
    wx.setStorageSync(SCHEMA_KEY, SCHEMA_VERSION)
  } catch (e) {}
}

// 备份格式：每行 日期|二字|爻|卦名，卦名仅供阅读
function buildBackup(data) {
  const lines = Object.keys(data)
    .filter(key => DATE_PATTERN.test(key))
    .sort()
    .map(key => {
      const record = data[key] || {}
      const hex = getHexView(record)
      return [key, record.words || '', getYaoCode(record), hex ? hex.name : ''].join('|')
    })
    .filter(line => !/^[^|]*\|\|\|$/.test(line))
  return lines.length ? [BACKUP_HEADER, ...lines].join('\n') : ''
}

// 合法日期，且在 1900-01-31（农历数据起点）到今天之间，否则导入后页面无法展示
function isValidDate(key) {
  if (!DATE_PATTERN.test(key)) return false
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) return false
  return date >= new Date(1900, 0, 31) && date <= new Date()
}

function parseBackup(text) {
  const records = {}
  String(text || '').split(/\r?\n/).forEach(rawLine => {
    const parts = rawLine.trim().split('|')
    if (parts.length !== 4) return
    const [date, words, yao] = parts
    if (!isValidDate(date)) return
    const validWords = Array.from(words).length === 2 && !/\s/.test(words)
    const validYao = isYaoCode(yao)
    if (!validWords && !validYao) return
    const record = {}
    if (validWords) record.words = words
    if (validYao) record.yao = yao
    records[date] = record
  })
  return records
}

// 本机已有的内容优先，只补缺失的日期或字段
function mergeDiary(data, imported) {
  const merged = { ...data }
  let added = 0
  Object.keys(imported).forEach(key => {
    const local = merged[key] || {}
    const next = { ...local }
    if (!local.words && imported[key].words) next.words = imported[key].words
    if (!getYaoCode(local) && imported[key].yao) next.yao = imported[key].yao
    if (next.words !== local.words || getYaoCode(next) !== getYaoCode(local)) {
      merged[key] = next
      added++
    }
  })
  return { data: merged, added }
}

module.exports = {
  loadDiary,
  saveDiary,
  migrateDiary,
  yaosToCode,
  getYaoCode,
  getHexView,
  getHexViewFromBits,
  slimRecord,
  buildBackup,
  parseBackup,
  mergeDiary
}
