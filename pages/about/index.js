Page({
  data: { statusBarHeight: 0 },
  onLoad() {
    try {
      const w = wx.getWindowInfo()
      this.setData({ statusBarHeight: w.statusBarHeight })
    } catch(e) {
      this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 0 })
    }
  },
  goBack() { wx.navigateBack() },
  goAgreement() { wx.navigateTo({ url: '/pages/about/agreement' }) },
  goPrivacy() { wx.navigateTo({ url: '/pages/about/privacy' }) }
})


