// pages/index/index.js
const app = getApp()
const { HEX_DATA } = require('../../utils/hexdata')
const { solarToLunar } = require('../../utils/lunar')
const { getRandomWords } = require('../../utils/words')
const { getTodayKey, loadBgStyle } = require('../../utils/common')
const { getSpecialDate, getDailyWords } = require('../../utils/solarterm')
const { getSpecialDate, getDailyWords } = require('../../utils/solarterm')

Page({
  data: {
    statusBarHeight: 20,
    lunarYear: '',
    lunarMonthDay: '',
    solarDate: '',
    specialDate: '',
    chars: ['', ''],
    input1: '',
    input2: '',
    focus1: false,
    focus2: false,
    isRecorded: false,
    showCandidates: false,
    candidateWords: [],

    castingState: 'idle',
    yaos: [],
    displayYaos: [],
    hexagramSymbol: '',
    hexagramName: '',
    hexagramText: '',
    hexLines: [],

    totalDays: 0,
    streakDays: 0,

    bgStyle: 'xuan',
    bgClass: '',
    isDark: false
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    this.initDate()
    this.initCandidates()
    this.loadBgStyle()
    this.loadStats()
  },

  onShow() {
    this.loadToday()
    this.loadBgStyle()
    this.loadStats()
  },

  loadBgStyle() {
    const bg = loadBgStyle()
    this.setData(bg)
  },

  initDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()

    const lunar = solarToLunar(year, month, day)
    const lunarYear = `${lunar.ganZhiYear}年`
    const lunarMonthDay = `${lunar.monthText}${lunar.dayText}`
    const solarDate = `${month}月${day}日`

    const specialDate = getSpecialDate(month, day, lunar.lunarMonth, lunar.lunarDay)

    this.setData({ lunarYear, lunarMonthDay, solarDate, specialDate })
  },

  loadToday() {
    const today = getTodayKey()
    const data = wx.getStorageSync('diary_data') || {}
    const d = data[today] || {}

    const update = {}

    if (d.words) {
      update.chars = [d.words[0] || '', d.words[1] || '']
      update.input1 = d.words[0] || ''
      update.input2 = d.words[1] || ''
      update.isRecorded = true
    } else {
      update.isRecorded = false
      update.chars = ['', '']
      update.input1 = ''
      update.input2 = ''
    }

    if (d.yaos && d.yaos.length === 6) {
      const hex = this.getHex(d.yaos)
      const yaoTexts = d.yaoTexts || (hex.yaos ? hex.yaos.slice().reverse() : [])
      const hexLines = d.yaos.slice().reverse().map(y => ({ type: y.type }))
      update.castingState = 'result'
      update.yaos = d.yaos
      update.displayYaos = yaoTexts
      update.hexagramSymbol = hex.symbol || ''
      update.hexagramName = hex.name
      update.hexagramText = hex.ci
      update.hexLines = hexLines
    } else {
      update.castingState = 'idle'
      update.yaos = []
      update.displayYaos = []
      update.hexagramSymbol = ''
      update.hexagramName = ''
      update.hexagramText = ''
      update.hexLines = []
    }

    this.setData(update)
  },

  loadStats() {
    const data = wx.getStorageSync('diary_data') || {}
    const keys = Object.keys(data).filter(k => data[k] && data[k].words)
    
    // 总记录天数
    const totalDays = keys.length
    
    // 连续记录天数
    let streakDays = 0
    if (keys.length > 0) {
      const sortedDates = keys.sort().reverse()
      const today = getTodayKey()
      let checkDate = new Date()
      
      // 如果今天没记录，从昨天开始算
      if (!data[today] || !data[today].words) {
        checkDate.setDate(checkDate.getDate() - 1)
      }
      
      for (let i = 0; i < 365; i++) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
        if (data[dateStr] && data[dateStr].words) {
          streakDays++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }
    
    this.setData({ totalDays, streakDays })
  },

  // 备选词功能
  initCandidates() {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const lunar = solarToLunar(now.getFullYear(), month, day)
    
    // 优先使用节气/节日推荐词
    const dailyWords = getDailyWords(month, day, lunar.lunarMonth, lunar.lunarDay)
    
    let words
    if (dailyWords) {
      // 节气推荐词 + 随机词
      const randomWords = getRandomWords(4)
      words = [...dailyWords, ...randomWords]
    } else {
      words = getRandomWords(8)
    }
    
    this.setData({ candidateWords: words })
  },

  onBoxTap(e) {
    const idx = e.currentTarget.dataset.idx
    const update = {
      showCandidates: true,
      focus1: idx === 0,
      focus2: idx === 1,
      input1: this.data.chars[0] || '',
      input2: this.data.chars[1] || ''
    }
    if (this.data.isRecorded) update.isRecorded = false
    this.setData(update)
  },

  refreshCandidates() {
    const words = getRandomWords(8)
    this.setData({ candidateWords: words })
  },

  selectWord(e) {
    const word = e.currentTarget.dataset.word
    if (word.length >= 2) {
      this.setData({
        chars: [word[0], word[1]],
        input1: word[0],
        input2: word[1],
        showCandidates: false,
        focus1: false,
        focus2: false
      })
      this.saveWords()
    }
  },

  onFocus1() { this.setData({ showCandidates: true }) },
  onFocus2() { this.setData({ showCandidates: true }) },

  onInput1(e) {
    const val = e.detail.value
    const chars = [...this.data.chars]

    if (val.length >= 2) {
      chars[0] = val[0]
      chars[1] = val[1]
      this.setData({ input1: val[0], input2: val[1], chars, isRecorded: false, focus1: false, focus2: false })
      this.saveWords()
    } else if (val.length === 1) {
      chars[0] = val
      const update = { input1: val, chars, isRecorded: false }
      if (!chars[1]) {
        update.focus1 = false
        update.focus2 = true
      }
      this.setData(update)
      if (chars[1]) {
        this.saveWords()
      }
    } else {
      chars[0] = ''
      this.setData({ input1: '', chars, isRecorded: false })
    }
  },

  onInput2(e) {
    const val = e.detail.value
    const chars = [...this.data.chars]

    if (val.length >= 2) {
      chars[0] = val[0]
      chars[1] = val[1]
      this.setData({ input1: val[0], input2: val[1], chars, isRecorded: false, focus1: false, focus2: false })
      this.saveWords()
    } else if (val.length === 1) {
      chars[1] = val
      this.setData({ input2: val, chars, isRecorded: false })
      if (chars[0]) {
        this.saveWords()
      }
    } else {
      chars[1] = ''
      this.setData({ input2: '', chars, isRecorded: false })
    }
  },

  onBlur1() {
    this.setData({ focus1: false })
  },
  onBlur2() {
    this.setData({ focus2: false })
  },

  saveWords() {
    const words = this.data.chars.join('')
    if (words.length !== 2) return
    const today = getTodayKey()
    const data = wx.getStorageSync('diary_data') || {}
    data[today] = { ...data[today], words, lunarYear: this.data.lunarYear, lunarMonthDay: this.data.lunarMonthDay, timestamp: Date.now() }
    wx.setStorageSync('diary_data', data)
    this.setData({ isRecorded: true, input1: '', input2: '', focus1: false, focus2: false })
    wx.showToast({ title: '已记下', icon: 'success', duration: 600 })
  },

  startCasting() {
    if (this.data.castingState === 'result') return
    const yaos = []
    for (let i = 0; i < 6; i++) yaos.push(this.genYao())
    const hex = this.getHex(yaos)
    const yaoTexts = (hex.yaos || []).slice().reverse()
    const hexLines = yaos.slice().reverse().map(y => ({ type: y.type }))
    this.setData({
      castingState: 'result',
      yaos,
      displayYaos: yaoTexts,
      hexagramSymbol: hex.symbol || '',
      hexagramName: hex.name,
      hexagramText: hex.ci,
      hexLines
    })
    this.saveHex(yaoTexts)
  },

  genYao() {
    const coins = [Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5]
    const n = coins.filter(c => c).length
    if (n === 1) return { type: 'yang', moving: false, value: 7 }
    if (n === 2) return { type: 'yin', moving: false, value: 8 }
    if (n === 3) return { type: 'yang', moving: true, value: 9 }
    return { type: 'yin', moving: true, value: 6 }
  },

  getHex(yaos) {
    const bin = yaos.map(y => y.type === 'yang' ? '1' : '0').join('')
    return HEX_DATA[bin] || { symbol: '', name: '未知卦', ci: '' }
  },

  saveHex(yaoTexts) {
    const today = getTodayKey()
    const data = wx.getStorageSync('diary_data') || {}
    data[today] = { ...data[today], yaos: this.data.yaos, yaoTexts: yaoTexts || this.data.displayYaos, hexagramSymbol: this.data.hexagramSymbol, hexagramName: this.data.hexagramName, hexagramText: this.data.hexagramText, lunarYear: this.data.lunarYear, lunarMonthDay: this.data.lunarMonthDay }
    wx.setStorageSync('diary_data', data)
  },

  goToShare() {
    wx.navigateTo({ url: '/pages/share/share' })
  },

  goToCalendar() { wx.navigateTo({ url: '/pages/calendar/calendar' }) },
  openSettings() { wx.navigateTo({ url: '/pages/settings/settings' }) }
})
