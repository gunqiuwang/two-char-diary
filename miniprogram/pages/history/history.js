// pages/history/history.js
Page({
  data: {
    historyList: []
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    const diaryData = wx.getStorageSync('diary_data') || {}
    const keys = Object.keys(diaryData).sort().reverse()

    const historyList = keys.map(date => {
      const data = diaryData[date]
      const displayYaos = data.yaos ? data.yaos.slice().reverse() : []

      // 解析日期
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

    this.setData({ historyList })
  },

  viewDetail(e) {
    const date = e.currentTarget.dataset.date
    const diaryData = wx.getStorageSync('diary_data') || {}
    const data = diaryData[date]

    if (!data) return

    const [year, month, day] = date.split('-')
    const dateText = `${year}年${parseInt(month)}月${parseInt(day)}日`

    const shareData = {
      dateText,
      words: data.words,
      hexagramName: data.hexagramName || '',
      hexagramText: data.hexagramText || '',
      yaos: JSON.stringify(data.yaos || [])
    }

    wx.navigateTo({
      url: `/pages/share/share?data=${encodeURIComponent(JSON.stringify(shareData))}`
    })
  }
})
