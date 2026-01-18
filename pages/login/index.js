// 登录授权页面
Page({
  data: {},

  onLoad() {
    console.log('📱 进入登录授权页面')
  },

  // 📱 手机号一键登录
  async onGetPhoneNumber(e) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📱 用户点击手机号一键登录')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // 检查用户是否授权
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      console.log('❌ 用户拒绝授权手机号')
      wx.showToast({
        title: '需要授权手机号才能继续',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 检查错误码（额度不足等）
    if (e.detail.errno) {
      console.error('❌ 获取手机号失败，错误码:', e.detail.errno)

      if (e.detail.errno === 1400001) {
        // 额度不足
        wx.showModal({
          title: '提示',
          content: '该功能使用次数已达上限，请联系客服',
          showCancel: false
        })
      } else {
        wx.showToast({
          title: '登录失败，请稍后重试',
          icon: 'none'
        })
      }
      return
    }

    const code = e.detail.code
    console.log('✅ 获取到动态令牌:', code)

    try {
      wx.showLoading({ title: '登录中...', mask: true })

      // 调用云函数获取手机号
      console.log('📋 调用云函数 getPhoneNumber...')
      const res = await wx.cloud.callFunction({
        name: 'getPhoneNumber',
        data: { code }
      })

      console.log('📤 云函数返回:', res)

      if (res.result.success && res.result.data) {
        const phoneData = res.result.data
        console.log('✅ 手机号获取成功:', phoneData.purePhoneNumber)

        // 保存用户信息（使用手机号作为默认用户名）
        const userInfo = {
          nickname: phoneData.purePhoneNumber,  // 使用手机号作为用户名/昵称
          phone: phoneData.purePhoneNumber,     // 保存手机号
          avatar: '',  // 手机号登录暂无头像（用户中心会显示默认头像）
          gender: '保密'
        }

        // 保存到本地存储
        wx.setStorageSync('userInfo', userInfo)
        wx.setStorageSync('isLoggedIn', true)  // 标记已登录
        
        console.log('✅ 用户信息已保存到本地:')
        console.log('  用户名（手机号）:', userInfo.nickname)
        console.log('  手机号:', userInfo.phone)

        // 同步到云端
        console.log('📋 同步用户信息到云端...')
        await wx.cloud.callFunction({
          name: 'updateUserInfo',
          data: userInfo
        })

        wx.hideLoading()
        
        // 显示欢迎提示
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        console.log('✅ 手机号登录完成，准备跳转首页')

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          // 跳转到首页
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 1500)

      } else {
        throw new Error(res.result.errMsg || '获取手机号失败')
      }

    } catch (err) {
      console.error('❌ 手机号登录失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '登录失败，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    }
  },


  // 跳转到用户协议
  goAgreement() {
    wx.navigateTo({
      url: '/pages/about/agreement'
    })
  },

  // 跳转到隐私政策
  goPrivacy() {
    wx.navigateTo({
      url: '/pages/about/privacy'
    })
  }
})
