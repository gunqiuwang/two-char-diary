// app.js
App({
  onLaunch() {
    if (!wx.getStorageSync('diary_data')) {
      wx.setStorageSync('diary_data', {})
    }
  },

  globalData: {}
})
