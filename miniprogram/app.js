// app.js
const { migrateDiary } = require('./utils/diary')

App({
  onLaunch() {
    migrateDiary()
  },

  globalData: {}
})
