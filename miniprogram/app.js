// app.js
App({
  onLaunch() {
    if (!wx.getStorageSync('diary_data')) {
      wx.setStorageSync('diary_data', {})
    }
    this.loadFont()
  },

  loadFont() {
    wx.loadFontFace({
      family: 'LXGW WenKai GB',
      source: 'https://cdn.bootcdn.net/ajax/libs/lxgw-wenkai-webfont/1.7.0/style.css',
      success: () => { this.globalData.fontLoaded = true },
      fail: () => { this.globalData.fontLoaded = false }
    })
  },

  globalData: {
    fontLoaded: false
  }
})
