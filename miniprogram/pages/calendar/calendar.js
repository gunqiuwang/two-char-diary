// pages/calendar/calendar.js
const { solarToLunar } = require('../../utils/lunar')

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

Page({
  data: {
    statusBarHeight: 20,
    year: 2026,
    month: 1,
    days: [],
    weekdays: WEEKDAYS,
    selectedDate: '',
    selectedData: null,
    selectedLunar: '',
    recordDates: {},
    bgStyle: 'xuan',
    bgClass: '',
    isDark: false,
    monthActiveStyle: ''
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      year,
      month,
      selectedDate: todayStr
    })

    this.loadRecords()
    this.buildMonth()
    this.loadDetail(todayStr)
    this.loadBgStyle()
  },

  onShow() {
    this.loadRecords()
    this.buildMonth()
    if (this.data.selectedDate) {
      this.loadDetail(this.data.selectedDate)
    }
    this.loadBgStyle()
  },

  loadBgStyle() {
    const settings = wx.getStorageSync('settings') || {}
    const bgStyle = settings.bgStyle || 'xuan'
    const bgMap = { xuan: '', silk: 'paper-texture-silk', bamboo: 'paper-texture-bamboo', dark: 'paper-texture-dark' }
    const isDark = bgStyle === 'dark'
    const activeColorMap = { xuan: '#3A3A35', silk: '#a09070', bamboo: '#8a9a80', dark: '#7a7a70' }
    const color = activeColorMap[bgStyle] || '#3A3A35'
    const textColor = isDark ? '#2a2a28' : '#f5f4ed'
    const monthActiveStyle = `background:${color};border-color:${color};color:${textColor}`
    this.setData({ bgStyle, bgClass: bgMap[bgStyle] || '', isDark, monthActiveStyle })
  },

  loadRecords() {
    const diaryData = wx.getStorageSync('diary_data') || {}
    const recordDates = {}
    for (const key in diaryData) {
      if (diaryData[key] && diaryData[key].words) {
        recordDates[key] = true
      }
    }
    this.setData({ recordDates })
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
      days.push({ isEmpty: true })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        day: d,
        date: dateStr,
        hasRecord: !!recordDates[dateStr],
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.data.selectedDate,
        isEmpty: false
      })
    }

    this.setData({ days })
  },

  loadDetail(dateStr) {
    const diaryData = wx.getStorageSync('diary_data') || {}
    const d = diaryData[dateStr]

    if (d && d.words) {
      const [y, m, day] = dateStr.split('-')
      const lunar = solarToLunar(parseInt(y), parseInt(m), parseInt(day))
      const lunarText = `${lunar.monthText}${lunar.dayText}`

      this.setData({
        selectedData: {
          words: d.words,
          hexagramSymbol: d.hexagramSymbol || '',
          hexagramName: d.hexagramName || '',
          hexagramText: d.hexagramText || '',
          yaoTexts: d.yaoTexts || []
        },
        selectedLunar: lunarText
      })
    } else {
      this.setData({ selectedData: null, selectedLunar: '' })
    }
  },

  prevYear() {
    this.setData({ year: this.data.year - 1 })
    this.buildMonth()
  },

  nextYear() {
    this.setData({ year: this.data.year + 1 })
    this.buildMonth()
  },

  selectMonth(e) {
    const m = parseInt(e.currentTarget.dataset.month)
    this.setData({ month: m })
    this.buildMonth()
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

  goBack() {
    wx.navigateBack()
  }
})
