// app.js
App({
  onLaunch(options) {
    console.log('📱 小程序启动，参数:', options)
    
    // ========== 初始化云开发（必须最先执行）==========
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-8gi23b6b06a44a37',  // 云开发环境ID
        traceUser: true  // 记录用户访问记录，便于分析
      })
      console.log('✅ 云开发环境初始化成功')
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }
    
    // 🎫 检查是否通过小程序码扫码进入（scene 参数）
    const scene = options.scene || ''
    console.log('🔍 Scene 参数:', scene)
    
    if (scene && scene.startsWith('ORDER')) {
      // 检测到取件小程序码，跳转到门店扫码页面
      console.log('🎫 检测到取件小程序码，订单号:', scene)
      
      // 延迟跳转，确保小程序初始化完成
      setTimeout(() => {
        wx.reLaunch({
          url: `/pages/store/scan?orderId=${scene}`
        })
      }, 800)
    } else {
      // 正常启动，发放新用户优惠券
      // 🎁 自动为新用户发放欢迎优惠券
      this.initNewUser()
    }
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功，code:', res.code)
      }
    })
  },
  
  onShow(options) {
    // 🎫 检查是否从后台进入且携带 scene 参数
    const scene = options.scene || ''
    console.log('📱 小程序显示，Scene:', scene)
    
    if (scene && scene.startsWith('ORDER')) {
      console.log('🎫 从后台进入，检测到取件小程序码，订单号:', scene)
      
      // 跳转到门店扫码页面
      wx.reLaunch({
        url: `/pages/store/scan?orderId=${scene}`
      })
    }
  },
  
  // 🎁 初始化新用户（自动发放优惠券）
  async initNewUser() {
    try {
      console.log('🎁 开始初始化新用户...')
      
      const res = await wx.cloud.callFunction({
        name: 'initNewUser',
        data: {}
      })
      
      console.log('📤 云函数返回:', res)
      
      if (res.result && res.result.success) {
        if (res.result.isNewUser) {
          console.log('🎉 新用户欢迎！')
          console.log('  已发放优惠券:', res.result.couponsGiven, '张')
          
          // 显示欢迎提示（延迟2秒，避免与其他提示冲突）
          setTimeout(() => {
            wx.showModal({
              title: '欢迎使用！',
              content: `已为您发放${res.result.couponsGiven}张8折优惠券，快去查看吧！`,
              showCancel: false,
              confirmText: '去查看',
              confirmColor: '#4A6FA5',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.navigateTo({
                    url: '/pages/coupons/index'
                  })
                }
              }
            })
          }, 2000)
        } else {
          console.log('👋 欢迎回来！')
        }
      }
    } catch (err) {
      console.error('❌ 初始化新用户失败:', err)
      // 不影响正常使用，静默失败
    }
  },
  globalData: {
    userInfo: null,
    cloudEnv: 'cloud1-8gi23b6b06a44a37'  // 全局存储环境ID，方便其他页面使用
  }
})

