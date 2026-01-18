Page({
  data: {
    // 状态栏和导航栏高度（动态计算，基于胶囊按钮位置）
    statusBarHeight: 0,  // 状态栏高度
    navBarHeight: 0,     // 导航栏内容高度（动态计算）
    totalNavHeight: 0,   // 总高度（状态栏 + 导航栏）
    menuButtonRightPadding: 16, // 右侧安全区域 padding（避免与胶囊重叠）
    
    userInfo: {
      nickname: '',
      avatar: '',
      gender: '',
      birthday: '',
      school: '',
      city: '',
      postcode: '',
      phone: ''
    },
    
    maskedPhone: ''  // 隐藏中间四位的手机号
  },

  async onLoad() {
    console.log('📋 加载用户信息编辑页面...')
    
    // 获取系统信息和胶囊按钮位置，动态计算导航栏高度
    try {
      const windowInfo = wx.getWindowInfo()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      const statusBarHeight = windowInfo.statusBarHeight
      // 导航栏高度 = 胶囊高度 + (胶囊top - 状态栏高度) * 2（上下留出相同间距）
      const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
      const totalNavHeight = statusBarHeight + navBarHeight
      
      // 计算右侧安全区域 padding（避免与胶囊重叠）
      const menuButtonRightPadding = windowInfo.screenWidth - menuButton.left + 8
      
      this.setData({
        statusBarHeight,
        navBarHeight,
        totalNavHeight,
        menuButtonRightPadding
      })
      
      console.log('🎯 编辑页导航栏适配信息:')
      console.log('  状态栏高度:', statusBarHeight)
      console.log('  胶囊按钮 - left:', menuButton.left, 'top:', menuButton.top, 'width:', menuButton.width, 'height:', menuButton.height)
      console.log('  导航栏内容高度:', navBarHeight)
      console.log('  导航栏总高度:', totalNavHeight)
      console.log('  右侧安全区域 padding:', menuButtonRightPadding)
    } catch (e) {
      // 兜底方案
      const systemInfo = wx.getSystemInfoSync()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      const statusBarHeight = systemInfo.statusBarHeight || 0
      const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
      const totalNavHeight = statusBarHeight + navBarHeight
      const menuButtonRightPadding = systemInfo.screenWidth - menuButton.left + 8
      
      this.setData({
        statusBarHeight,
        navBarHeight,
        totalNavHeight,
        menuButtonRightPadding
      })
      
      console.log('⚠️ 使用兜底方案计算导航栏高度:', totalNavHeight)
      console.log('  右侧安全区域 padding:', menuButtonRightPadding)
    }
    
    // 先从本地存储读取
    const localUserInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ 
      userInfo: localUserInfo,
      maskedPhone: this.maskPhoneNumber(localUserInfo.phone)
    })
    
    // 然后从云端加载最新数据
    await this.loadUserInfoFromCloud()
  },
  
  // 🌟 手机号隐藏中间四位
  maskPhoneNumber(phone) {
    if (!phone || phone.length < 7) {
      return phone || '未设置'
    }
    // 格式：182****0561（隐藏中间4位）
    return phone.substring(0, 3) + '****' + phone.substring(7)
  },
  
  // 🌟 从云端加载用户信息
  async loadUserInfoFromCloud() {
    try {
      wx.showLoading({ title: '加载中...', mask: true })
      
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      
      console.log('☁️ 云端用户信息:', res.result)
      
      if (res.result.success && res.result.data) {
        const cloudUserInfo = res.result.data
        
        // 如果云端没有城市信息，从首页的城市选择中读取
        if (!cloudUserInfo.city) {
          const savedCity = wx.getStorageSync('CITY_NAME')
          if (savedCity) {
            cloudUserInfo.city = savedCity
          }
        }
        
        // 合并本地和云端数据（云端优先）
        const mergedUserInfo = {
          ...this.data.userInfo,
          ...cloudUserInfo
        }
        
        this.setData({ 
          userInfo: mergedUserInfo,
          maskedPhone: this.maskPhoneNumber(mergedUserInfo.phone)
        })
        
        // 更新本地存储
        wx.setStorageSync('userInfo', mergedUserInfo)
        
        console.log('✅ 用户信息同步完成')
      } else {
        console.log('⚠️ 云端暂无用户信息')
        
        // 从首页的城市选择中读取
        const savedCity = wx.getStorageSync('CITY_NAME')
        if (savedCity) {
          const userInfo = { ...this.data.userInfo, city: savedCity }
          this.setData({ userInfo })
        }
      }
      
      wx.hideLoading()
      
    } catch (error) {
      console.error('❌ 加载云端用户信息失败:', error)
      wx.hideLoading()
      wx.showToast({ 
        title: '加载失败，请重试', 
        icon: 'none',
        duration: 2000
      })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  // 编辑昵称
  editNickname() {
    wx.showActionSheet({
      itemList: ['手动输入昵称', '使用微信昵称'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          // 手动输入
          wx.showModal({
            title: '编辑昵称',
            editable: true,
            placeholderText: '请输入昵称',
            content: this.data.userInfo.nickname || '',
            success: async (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                const userInfo = { ...this.data.userInfo, nickname: modalRes.content }
                this.setData({ userInfo })
                wx.setStorageSync('userInfo', userInfo)
                wx.showToast({ title: '已保存', icon: 'success', duration: 1000 })
                
                // 🌟 自动保存到云端
                await this.saveToCloud({ nickname: modalRes.content })
              }
            }
          })
        } else if (res.tapIndex === 1) {
          // 使用微信昵称
          await this.getWeChatNickname()
        }
      }
    })
  },
  
  // 🌟 获取微信昵称
  async getWeChatNickname() {
    try {
      const profileRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '获取微信昵称',
          success: resolve,
          fail: reject
        })
      })
      
      const { nickName } = profileRes.userInfo
      console.log('✅ 获取微信昵称:', nickName)
      
      const userInfo = { ...this.data.userInfo, nickname: nickName }
      this.setData({ userInfo })
      wx.setStorageSync('userInfo', userInfo)
      wx.showToast({ title: '已使用微信昵称', icon: 'success', duration: 1000 })
      
      // 🌟 自动保存到云端
      await this.saveToCloud({ nickname: nickName })
      
    } catch (error) {
      console.error('❌ 获取微信昵称失败:', error)
      if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
        wx.showToast({ title: '您拒绝了授权', icon: 'none', duration: 2000 })
      }
    }
  },

  // 编辑头像 - 上传到云存储
  async editAvatar() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照', '使用微信头像'],
      success: async (res) => {
        if (res.tapIndex === 0 || res.tapIndex === 1) {
          // 从相册选择或拍照
          await this.uploadCustomAvatar(res.tapIndex === 0 ? 'album' : 'camera')
        } else if (res.tapIndex === 2) {
          // 使用微信头像
          await this.getWeChatAvatar()
        }
      }
    })
  },
  
  // 🌟 上传自定义头像
  async uploadCustomAvatar(sourceType) {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: [sourceType],
        sizeType: ['compressed']
      })
      
      const tempFilePath = res.tempFiles[0].tempFilePath
      
      wx.showLoading({ title: '上传中...', mask: true })
      
      // 上传到云存储
      const timestamp = Date.now()
      const cloudPath = `avatars/user_${timestamp}.png`
      
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath
      })
      
      console.log('☁️ 头像上传成功:', uploadResult.fileID)
      
      const userInfo = { ...this.data.userInfo, avatar: uploadResult.fileID }
      this.setData({ userInfo })
      wx.setStorageSync('userInfo', userInfo)
      
      wx.hideLoading()
      wx.showToast({ title: '头像已更新', icon: 'success' })
      
      // 🌟 自动保存到云端
      await this.saveToCloud({ avatar: uploadResult.fileID })
      
    } catch (error) {
      console.error('❌ 上传头像失败:', error)
      wx.hideLoading()
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },
  
  // 🌟 获取微信头像
  async getWeChatAvatar() {
    try {
      const profileRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '获取微信头像',
          success: resolve,
          fail: reject
        })
      })
      
      const { avatarUrl } = profileRes.userInfo
      console.log('✅ 获取微信头像:', avatarUrl)
      
      const userInfo = { ...this.data.userInfo, avatar: avatarUrl }
      this.setData({ userInfo })
      wx.setStorageSync('userInfo', userInfo)
      wx.showToast({ title: '已使用微信头像', icon: 'success', duration: 1000 })
      
      // 🌟 自动保存到云端
      await this.saveToCloud({ avatar: avatarUrl })
      
    } catch (error) {
      console.error('❌ 获取微信头像失败:', error)
      if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
        wx.showToast({ title: '您拒绝了授权', icon: 'none', duration: 2000 })
      }
    }
  },

  // 编辑性别
  // 性别选择（通过按钮点击触发）
  async onGenderSelect(e) {
    const gender = e.currentTarget.dataset.gender
    console.log('✏️ 用户选择性别:', gender)
    
    const userInfo = { ...this.data.userInfo, gender }
    this.setData({ userInfo })
    wx.setStorageSync('userInfo', userInfo)
    
    wx.showToast({ title: '已保存', icon: 'success', duration: 1000 })
    
    // 🌟 自动保存到云端
    await this.saveToCloud({ gender })
  },

  // 编辑生日
  editBirthday() {
    wx.showModal({
      title: '编辑生日',
      editable: true,
      placeholderText: '例如：1995-01-15',
      content: this.data.userInfo.birthday || '',
      success: async (res) => {
        if (res.confirm && res.content) {
          const userInfo = { ...this.data.userInfo, birthday: res.content }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
          wx.showToast({ title: '已保存', icon: 'success', duration: 1000 })
          
          // 🌟 自动保存到云端
          await this.saveToCloud({ birthday: res.content })
        }
      }
    })
  },

  // 编辑院校
  editSchool() {
    wx.showModal({
      title: '编辑院校',
      editable: true,
      placeholderText: '请输入院校名称',
      content: this.data.userInfo.school || '',
      success: async (res) => {
        if (res.confirm && res.content) {
          const userInfo = { ...this.data.userInfo, school: res.content }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
          wx.showToast({ title: '已保存', icon: 'success', duration: 1000 })
          
          // 🌟 自动保存到云端
          await this.saveToCloud({ school: res.content })
        }
      }
    })
  },

  // 编辑城市
  editCity() {
    const cities = ['伦敦', '曼彻斯特', '伯明翰', '利兹', '利物浦', '布里斯托', '谢菲尔德', '纽卡斯尔', '南安普顿', '诺丁汉', '爱丁堡', '格拉斯哥', '剑桥', '牛津']
    
    wx.showActionSheet({
      itemList: cities,
      success: async (res) => {
        const selectedCity = cities[res.tapIndex]
        const userInfo = { ...this.data.userInfo, city: selectedCity }
        
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
        
        // 🌟 同步到首页的城市选择
        wx.setStorageSync('CITY_NAME', selectedCity)
        console.log('✅ 城市已同步到首页:', selectedCity)
        
        wx.showToast({ title: '已保存', icon: 'success', duration: 1000 })
        
        // 🌟 自动保存到云端
        await this.saveToCloud({ city: selectedCity })
      }
    })
  },

  // 编辑邮编
  editPostcode() {
    wx.showModal({
      title: '编辑邮编',
      editable: true,
      placeholderText: '例如：SO17 1BJ',
      content: this.data.userInfo.postcode || '',
      success: async (res) => {
        if (res.confirm && res.content) {
          const userInfo = { ...this.data.userInfo, postcode: res.content }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
          wx.showToast({ title: '已保存', icon: 'success', duration: 1000 })
          
          // 🌟 自动保存到云端
          await this.saveToCloud({ postcode: res.content })
        }
      }
    })
  },

  // 编辑手机号
  editPhone() {
    console.log('ℹ️ 查看手机号')
    
    wx.showModal({
      title: '手机号',
      content: `您的手机号：${this.data.userInfo.phone || '未设置'}\n\n手机号是登录时授权获取的，如需修改请退出登录后重新授权。`,
      showCancel: false,
      confirmText: '知道了'
    })
  },
  
  // 🌟 通用保存方法 - 自动保存单个字段到云端
  async saveToCloud(data) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: data
      })
      
      if (res.result.success) {
        console.log('✅ 已同步到云端:', Object.keys(data).join(', '))
      } else {
        console.error('❌ 云端保存失败:', res.result.message)
      }
      
    } catch (error) {
      console.error('❌ 云端保存失败:', error)
    }
  },
  
  // 🌟 退出登录
  onLogout() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👋 用户点击退出登录')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 清除本地存储的用户信息
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    
    console.log('✅ 本地存储已清除:')
    console.log('  - userInfo 已删除')
    console.log('  - openid 已删除')
    
    // 🌟 清空页面数据（留在编辑页面，但显示空状态）
    this.setData({
      userInfo: {
        nickname: '',
        avatar: '',
        gender: '',
        birthday: '',
        school: '',
        city: '',
        postcode: '',
        phone: ''
      }
    })
    
    console.log('✅ 页面数据已重置为空')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 提示退出成功
    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    })
  }
})
