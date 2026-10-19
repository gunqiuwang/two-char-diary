// pages/calendar/calendar.js
const { solarToLunar, MIN_YEAR, MAX_YEAR } = require('../../utils/lunar')
const { loadDiary, getHexView } = require('../../utils/diary')
const { loadBgStyle, getWindowInfoSafe } = require('../../utils/common')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

Page({
  data: {
    statusBarHeight: 20,
    isShortScreen: false,
    year: 2026,
    month: 1,
    days: [],
    weekdays: WEEKDAYS,
    selectedDate: '',
    selectedDateLabel: '',
    selectedData: null,
    selectedLunar: '',
    selectedWord1: '',
    selectedWord2: '',
    selectedHexLines: [],
    detailYaos: [],
    recordDates: {},
    bgStyle: 'xuan',
    bgClass: '',
    isDark: false
  },

  onLoad() {
    const sysInfo = getWindowInfoSafe()
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isShortScreen: Number(sysInfo.windowHeight || 0) > 0 && Number(sysInfo.windowHeight) < 720,
      year,
      month,
      selectedDate: todayStr
    })

    this.loadRecords(() => {
      this.buildMonth()
      this.loadDetail(todayStr)
    })
    this.loadBgStyle()
  },

  onShow() {
    this.loadRecords(() => {
      this.buildMonth()
      if (this.data.selectedDate) {
        this.loadDetail(this.data.selectedDate)
      }
    })
    this.loadBgStyle()
  },

  loadBgStyle() {
    this.setData(loadBgStyle())
  },

  loadRecords(callback) {
    const diaryData = wx.getStorageSync('diary_data') || {}
    const recordDates = {}
    for (const key in diaryData) {
      if (diaryData[key] && diaryData[key].words) {
        recordDates[key] = true
      }
    }
    this.setData({ recordDates }, () => {
      if (typeof callback === 'function') callback()
    })
  },

  buildMonth() {
    const { year, month, recordDates } = this.data
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const days = []

    for (let i = 0; i < startWeekday; i++) {
      days.push({ key: `empty-${i}`, isEmpty: true })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        key: dateStr,
        day: d,
        date: dateStr,
        hasRecord: !!recordDates[dateStr],
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.data.selectedDate,
        isEmpty: false
      })
    }

    // 固定为六周网格，让月份切换时页面高度和视觉节奏保持稳定。
    while (days.length < 42) {
      days.push({ key: `tail-empty-${days.length}`, isEmpty: true })
    }

    this.setData({ days })
  },

  loadDetail(dateStr) {
    const d = loadDiary()[dateStr]

    if (d && d.words) {
      const [y, m, day] = dateStr.split('-').map(Number)
      const lunar = solarToLunar(y, m, day)
      const lunarText = lunar ? `${lunar.monthText}${lunar.dayText}` : ''

      const hex = getHexView(d)
      const yaoTexts = hex ? hex.yaoTexts : []
      const wordChars = Array.from(d.words || '').slice(0, 2)
      const selectedHexLines = hex ? hex.hexLines : []
      this.setData({
        selectedDateLabel: `${m}月${day}日`,
        selectedData: {
          words: d.words,
          hexagramSymbol: hex ? hex.symbol : '',
          hexagramName: hex ? hex.name : '',
          hexagramText: hex ? hex.ci : '',
          yaoTexts
        },
        selectedLunar: lunarText,
        selectedWord1: wordChars[0] || '',
        selectedWord2: wordChars[1] || '',
        selectedHexLines,
        detailYaos: this.buildYaoItems(yaoTexts)
      })
    } else {
      this.setData({
        selectedDateLabel: '',
        selectedData: null,
        selectedLunar: '',
        selectedWord1: '',
        selectedWord2: '',
        selectedHexLines: [],
        detailYaos: []
      })
    }
  },

  changeCalendar(patch) {
    this.setData({
      ...patch,
      selectedDate: '',
      selectedDateLabel: '',
      selectedData: null,
      selectedLunar: '',
      selectedWord1: '',
      selectedWord2: '',
      selectedHexLines: [],
      detailYaos: []
    }, () => this.buildMonth())
  },

  prevYear() {
    if (this.data.year <= MIN_YEAR) return
    this.changeCalendar({ year: this.data.year - 1 })
  },

  nextYear() {
    if (this.data.year >= MAX_YEAR) return
    this.changeCalendar({ year: this.data.year + 1 })
  },

  selectMonth(e) {
    const month = Number(e.currentTarget.dataset.month)
    if (!Number.isInteger(month) || month < 1 || month > 12 || month === this.data.month) return
    this.changeCalendar({ month })
  },

  onDayTap(e) {
    const { date, isempty } = e.currentTarget.dataset
    if (isempty || !date) return

    const hasRecord = this.data.recordDates[date]
    if (!hasRecord) {
      wx.showToast({ title: '当日暂无记录', icon: 'none', duration: 1000 })
      return
    }

    this.setData({ selectedDate: date })
    this.buildMonth()
    this.loadDetail(date)
  },

  buildYaoItems(yaoTexts) {
    return (yaoTexts || []).map((value, index) => {
      const text = String(value || '').trim()
      const matched = text.match(/^([^：:]{1,6})[：:]\s*(.*)$/)
      const fallbackLabels = ['上爻', '五爻', '四爻', '三爻', '二爻', '初爻']
      return {
        key: index,
        label: matched ? matched[1] : fallbackLabels[index],
        content: matched ? matched[2] : text
      }
    })
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  goToShare() {
    if (!this.data.selectedDate || !this.data.selectedData) {
      wx.showToast({ title: '请先选择一条记录', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/share/share?date=${this.data.selectedDate}` })
  }
})
