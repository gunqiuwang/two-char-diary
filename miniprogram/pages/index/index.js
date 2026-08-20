// pages/index/index.js
const { HEX_DATA } = require('../../utils/hexdata')
const { solarToLunar } = require('../../utils/lunar')
const { getRandomWords } = require('../../utils/words')
const { getTodayKey, loadBgStyle, getWindowInfoSafe } = require('../../utils/common')
const { getSpecialDate, getDailyWords } = require('../../utils/solarterm')

Page({
  data: {
    statusBarHeight: 20,
    currentDateKey: '',
    lunarYear: '',
    lunarMonthDay: '',
    solarDate: '',
    specialDate: '',
    chars: ['', ''],
    char1: '',
    char2: '',
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
    hasCastToday: false,

    totalDays: 0,
    streakDays: 0,

    bgStyle: 'xuan',
    bgClass: '',
    isDark: false
  },

  onLoad() {
    const sysInfo = getWindowInfoSafe()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    this.refreshForCurrentDate(true)
    this.loadBgStyle()
    this.loadStats()
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline'],
      fail: () => {}
    })
  },

  onShow() {
    this.refreshForCurrentDate()
    this.loadToday()
    this.loadBgStyle()
    this.loadStats()
  },

  onUnload() {
    if (this._castingTimer) clearTimeout(this._castingTimer)
    if (this._editTimer) clearTimeout(this._editTimer)
  },

  refreshForCurrentDate(force = false) {
    const currentDateKey = getTodayKey()
    if (!force && this.data.currentDateKey === currentDateKey) return
    this.setData({ currentDateKey })
    this.initDate()
    this.initCandidates()
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

    // 获取节气/节日
    const specialDate = getSpecialDate(month, day, lunar.lunarMonth, lunar.lunarDay, lunar.lunarYear)
    
    this.setData({ lunarYear, lunarMonthDay, solarDate, specialDate })
  },

  loadToday() {
    const today = getTodayKey()
    const data = wx.getStorageSync('diary_data') || {}
    const d = data[today] || {}

    const update = {}

    if (d.words) {
      const storedChars = Array.from(d.words)
      update.chars = [storedChars[0] || '', storedChars[1] || '']
      update.char1 = storedChars[0] || ''
      update.char2 = storedChars[1] || ''
      update.input1 = storedChars[0] || ''
      update.input2 = storedChars[1] || ''
      update.isRecorded = true
    } else {
      update.isRecorded = false
      update.chars = ['', '']
      update.char1 = ''
      update.char2 = ''
      update.input1 = ''
      update.input2 = ''
    }

    if (d.yaos && d.yaos.length === 6) {
      const hex = this.getHex(d.yaos)
      const yaoTexts = d.yaoTexts || (hex.yaos ? hex.yaos.slice().reverse() : [])
      const hexLines = d.yaos.slice().reverse().map((y, index) => ({ key: index, type: y.type }))
      update.castingState = 'result'
      update.yaos = d.yaos
      update.displayYaos = yaoTexts
      update.hexagramSymbol = hex.symbol || ''
      update.hexagramName = hex.name
      update.hexagramText = hex.ci
      update.hexLines = hexLines
      update.hasCastToday = true
    } else {
      update.castingState = 'idle'
      update.yaos = []
      update.displayYaos = []
      update.hexagramSymbol = ''
      update.hexagramName = ''
      update.hexagramText = ''
      update.hexLines = []
      update.hasCastToday = false
    }

    this.setData(update)
  },

  calculateStats(sourceData) {
    const data = sourceData || wx.getStorageSync('diary_data') || {}
    const keys = Object.keys(data).filter(k => data[k] && data[k].words)
    const totalDays = keys.length
    let streakDays = 0

    if (keys.length > 0) {
      const today = getTodayKey()
      const checkDate = new Date()
      if (!data[today] || !data[today].words) {
        checkDate.setDate(checkDate.getDate() - 1)
      }

      for (let i = 0; i < keys.length; i++) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
        if (!data[dateStr] || !data[dateStr].words) break
        streakDays++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    return { totalDays, streakDays }
  },

  loadStats() {
    this.setData(this.calculateStats())
  },

  // 备选词功能
  initCandidates() {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const lunar = solarToLunar(now.getFullYear(), month, day)
    
    // 优先使用节气/节日推荐词
    const dailyWords = getDailyWords(month, day, lunar.lunarMonth, lunar.lunarDay, lunar.lunarYear)
    
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
    const idx = Number(e.currentTarget.dataset.idx)
    if (idx !== 0 && idx !== 1) return

    const editingExisting = this.data.isRecorded
    this._editingStartedAt = Date.now()
    if (this._editTimer) {
      clearTimeout(this._editTimer)
      this._editTimer = null
    }

    // input 始终存在，因此一次 setData 即可进入编辑态并聚焦。
    // 避免条件渲染 + nextTick 造成递归更新。
    this.setData({
      isRecorded: false,
      showCandidates: true,
      focus1: idx === 0,
      focus2: idx === 1,
      input1: editingExisting && idx === 0 ? '' : (this.data.char1 || ''),
      input2: editingExisting && idx === 1 ? '' : (this.data.char2 || '')
    })
  },

  refreshCandidates() {
    const words = getRandomWords(8)
    this.setData({ candidateWords: words, showCandidates: true })
  },

  selectWord(e) {
    const word = e.currentTarget.dataset.word || ''
    const wordChars = Array.from(word).slice(0, 2)
    this.commitWords(wordChars)
  },

  onFocus1() {
    if (this._editTimer) clearTimeout(this._editTimer)
    if (!this.data.focus1 || this.data.focus2 || !this.data.showCandidates) {
      this.setData({ focus1: true, focus2: false, showCandidates: true })
    }
  },
  onFocus2() {
    if (this._editTimer) clearTimeout(this._editTimer)
    if (!this.data.focus2 || this.data.focus1 || !this.data.showCandidates) {
      this.setData({ focus1: false, focus2: true, showCandidates: true })
    }
  },

  onInput1(e) {
    const valueChars = Array.from(e.detail.value || '')
    const chars = [this.data.char1 || '', this.data.char2 || '']

    if (valueChars.length >= 2) {
      chars[0] = valueChars[0]
      chars[1] = valueChars[1]
      this.commitWords(chars)
    } else if (valueChars.length === 1) {
      chars[0] = valueChars[0]
      if (chars[1]) {
        this.commitWords(chars)
      } else {
        this.setData({
          input1: valueChars[0],
          chars,
          char1: chars[0],
          char2: chars[1],
          isRecorded: false,
          focus1: false,
          focus2: true
        })
      }
    } else {
      chars[0] = ''
      this.setData({ input1: '', chars, char1: '', char2: chars[1], isRecorded: false })
    }
  },

  onInput2(e) {
    const valueChars = Array.from(e.detail.value || '')
    const chars = [this.data.char1 || '', this.data.char2 || '']

    if (valueChars.length >= 2) {
      chars[0] = valueChars[0]
      chars[1] = valueChars[1]
      this.commitWords(chars)
    } else if (valueChars.length === 1) {
      chars[1] = valueChars[0]
      if (chars[0]) {
        this.commitWords(chars)
      } else {
        this.setData({ input2: valueChars[0], chars, char1: chars[0], char2: chars[1], isRecorded: false })
      }
    } else {
      chars[1] = ''
      this.setData({ input2: '', chars, char1: chars[0], char2: '', isRecorded: false })
    }
  },

  onBlur1() {
    if (this.data.focus1) this.setData({ focus1: false })
    if (!this.data.isRecorded) this.scheduleFinishEditing()
  },
  onBlur2() {
    if (this.data.focus2) this.setData({ focus2: false })
    if (!this.data.isRecorded) this.scheduleFinishEditing()
  },

  scheduleFinishEditing() {
    if (this._editTimer) clearTimeout(this._editTimer)
    this._editTimer = setTimeout(() => {
      this._editTimer = null
      if (
        this.data.focus1 ||
        this.data.focus2 ||
        this.data.isRecorded ||
        Date.now() - (this._editingStartedAt || 0) < 600
      ) return
      const todayData = (wx.getStorageSync('diary_data') || {})[getTodayKey()] || {}
      const currentWords = `${this.data.char1 || ''}${this.data.char2 || ''}`
      if (todayData.words === currentWords) {
        this.setData({
          isRecorded: true,
          showCandidates: false,
          input1: '',
          input2: ''
        })
      } else {
        this.loadToday()
        this.setData({ showCandidates: false })
      }
    }, 320)
  },

  saveWords() {
    this.commitWords([this.data.char1 || '', this.data.char2 || ''])
  },

  commitWords(sourceChars) {
    const chars = Array.from(sourceChars || []).slice(0, 2)
    if (chars.length !== 2 || chars.some(char => !char)) return

    const words = chars.join('')
    const today = getTodayKey()
    const data = wx.getStorageSync('diary_data') || {}
    data[today] = {
      ...data[today],
      words,
      lunarYear: this.data.lunarYear,
      lunarMonthDay: this.data.lunarMonthDay,
      timestamp: Date.now()
    }
    wx.setStorageSync('diary_data', data)

    if (this._editTimer) {
      clearTimeout(this._editTimer)
      this._editTimer = null
    }
    this._editingStartedAt = 0

    const stats = this.calculateStats(data)
    this.setData({
      chars,
      char1: chars[0],
      char2: chars[1],
      isRecorded: true,
      showCandidates: false,
      input1: '',
      input2: '',
      focus1: false,
      focus2: false,
      ...stats
    })
    wx.showToast({ title: '已记下', icon: 'success', duration: 600 })
  },

  startCasting() {
    if (this.data.castingState === 'casting') return

    const today = getTodayKey()
    const data = wx.getStorageSync('diary_data') || {}
    const todayRecord = data[today] || {}
    if (this.data.hasCastToday || (todayRecord.yaos && todayRecord.yaos.length === 6)) {
      wx.showToast({ title: '今日已起卦', icon: 'none', duration: 1000 })
      this.loadToday()
      return
    }

    const yaos = []
    for (let i = 0; i < 6; i++) yaos.push(this.genYao())
    const hex = this.getHex(yaos)
    const yaoTexts = (hex.yaos || []).slice().reverse()
    const hexLines = yaos.slice().reverse().map((y, index) => ({ key: index, type: y.type }))

    this.setData({
      castingState: 'casting',
      yaos: [],
      displayYaos: [],
      hexagramSymbol: '',
      hexagramName: '',
      hexagramText: '',
      hexLines: [],
      hasCastToday: false
    })

    if (this._castingTimer) clearTimeout(this._castingTimer)
    this._castingTimer = setTimeout(() => {
      this._castingTimer = null
      this.setData({
        castingState: 'result',
        yaos,
        displayYaos: yaoTexts,
        hexagramSymbol: hex.symbol || '',
        hexagramName: hex.name,
        hexagramText: hex.ci,
        hexLines,
        hasCastToday: true
      }, () => {
        this.saveHex(yaoTexts, today)
      })
    }, 1200)
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

  saveHex(yaoTexts, dateKey = getTodayKey()) {
    const data = wx.getStorageSync('diary_data') || {}
    data[dateKey] = { ...data[dateKey], yaos: this.data.yaos, yaoTexts: yaoTexts || this.data.displayYaos, hexagramSymbol: this.data.hexagramSymbol, hexagramName: this.data.hexagramName, hexagramText: this.data.hexagramText, lunarYear: this.data.lunarYear, lunarMonthDay: this.data.lunarMonthDay }
    wx.setStorageSync('diary_data', data)
  },

  goToShare() {
    wx.navigateTo({ url: `/pages/share/share?date=${getTodayKey()}` })
  },

  goToCalendar() { wx.navigateTo({ url: '/pages/calendar/calendar' }) },
  openSettings() { wx.navigateTo({ url: '/pages/settings/settings' }) },

  onShareAppMessage() {
    return {
      title: '二字爻记 - 每天用两个字记下一天',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: '二字爻记 - 每天用两个字记下一天',
      query: ''
    }
  }
})
