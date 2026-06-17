// pages/history/history.js
const { loadBgStyle } = require('../../utils/common')

Page({
  data: {
    statusBarHeight: 20,
    historyList: [],
    filteredList: [],
    searchQuery: '',
    bgStyle: 'xuan',
    bgClass: '',
    isDark: false
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
  },

  onShow() {
    this.loadBgStyle()
    this.loadHistory()
  },

  loadBgStyle() {
    const bg = loadBgStyle()
    this.setData(bg)
  },

  loadHistory() {
    const diaryData = wx.getStorageSync('diary_data') || {}
    const keys = Object.keys(diaryData).sort().reverse()

    const historyList = keys.map(date => {
      const data = diaryData[date]
      const displayYaos = data.yaos ? data.yaos.slice().reverse() : []

      const [year, month, day] = date.split('-')
      const dateText = `${year}年${parseInt(month)}月${parseInt(day)}日`

      return {
        date,
        dateText,
        words: data.words,
        yaos: data.yaos,
        displayYaos,
        hexagramName: data.hexagramName,
        hexagramText: data.hexagramText
      }
    })

    this.setData({ 
      historyList,
      filteredList: historyList
    })
  },

  onSearchInput(e) {
    const query = e.detail.value.toLowerCase()
    this.setData({ searchQuery: query })
    this.filterList(query)
  },

  onSearchClear() {
    this.setData({ 
      searchQuery: '',
      filteredList: this.data.historyList
    })
  },

  filterList(query) {
    if (!query) {
      this.setData({ filteredList: this.data.historyList })
      return
    }
    
    const filtered = this.data.historyList.filter(item => {
      return (item.words && item.words.includes(query)) ||
             (item.hexagramName && item.hexagramName.includes(query)) ||
             (item.dateText && item.dateText.includes(query))
    })
    
    this.setData({ filteredList: filtered })
  },

  viewDetail(e) {
    const date = e.currentTarget.dataset.date
    wx.navigateTo({
      url: `/pages/share/share?date=${date}`
    })
  }
})
