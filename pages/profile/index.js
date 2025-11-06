Page({
  data: {
    // 状态栏和导航栏高度（动态计算，基于胶囊按钮位置）
    statusBarHeight: 0,  // 状态栏高度
    navBarHeight: 0,     // 导航栏内容高度（动态计算）
    totalNavHeight: 0,   // 总高度（状态栏 + 导航栏）
    menuButtonRightPadding: 16, // 右侧安全区域 padding（避免与胶囊重叠）
    
    campus: '',
    userInfo: {},
    openid: '',  // 用户openid
    isModalVisible: false,
    modalTitle: '',
    modalContent: '',
    
    // 常用栏目数量
    favoriteCount: 0,   // 我的收藏
    historyCount: 0,    // 浏览记录
    couponCount: 0,     // 红包卡券
    
    // 订单数量
    allOrderCount: 0,      // 全部订单
    pendingOrderCount: 0,  // 待支付
    pickupOrderCount: 0,   // 待取件
    rentingOrderCount: 0,  // 租赁中
    
    // 页面滑动切换
    pageSwipeOffset: 0,
    pageSwipeOpacity: 1,
    pageSwipeTransition: '',
    isPageSwiping: false
  },

  async onLoad() {
    // 获取系统信息和胶囊按钮位置，动态计算导航栏高度
    try {
      const windowInfo = wx.getWindowInfo()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      const statusBarHeight = windowInfo.statusBarHeight
      // 导航栏高度 = 胶囊高度 + (胶囊top - 状态栏高度) * 2（上下留出相同间距）
      const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
      const totalNavHeight = statusBarHeight + navBarHeight
      
      // 计算右侧安全区域 padding（避免与胶囊重叠）
      // 右侧预留空间 = 屏幕宽度 - 胶囊左边距 + 额外间距
      const menuButtonRightPadding = windowInfo.screenWidth - menuButton.left + 8
      
      this.setData({
        statusBarHeight,
        navBarHeight,
        totalNavHeight,
        menuButtonRightPadding
      })
      
      console.log('🎯 导航栏适配信息:')
      console.log('  状态栏高度:', statusBarHeight)
      console.log('  胶囊按钮 - top:', menuButton.top, 'height:', menuButton.height, 'bottom:', menuButton.bottom)
      console.log('  导航栏内容高度:', navBarHeight)
      console.log('  导航栏总高度:', totalNavHeight)
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
    }
    
    // 先从本地加载
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })
    
    // 加载数据数量
    this.loadCounts()
    
    // 🌟 只有当本地有用户信息时，才执行同步操作
    // 判断依据：检查是否有头像（登录后一定有头像）
    if (userInfo && userInfo.avatar) {
      console.log('📋 检测到本地有用户信息（有头像），开始同步...')
      
      // 获取 openid
      await this.getOpenId()
      
      // 从云端同步用户信息
      await this.syncUserInfoFromCloud()
    } else {
      console.log('⚠️ 本地无用户信息（无头像），显示未登录状态')
    }
  },

  async onShow() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📱 我的页面 onShow() 触发')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 从本地存储读取
    const userInfoStorage = wx.getStorageSync('userInfo')
    const openidStorage = wx.getStorageSync('openid')
    
    console.log('📋 从本地存储读取:')
    console.log('  - userInfo storage:', userInfoStorage)
    console.log('  - openid storage:', openidStorage)
    
    // 🌟 关键：如果本地存储为空或没有头像，清空页面数据
    if (!userInfoStorage || Object.keys(userInfoStorage).length === 0 || !userInfoStorage.avatar) {
      console.log('⚠️ 本地存储为空或无头像，重置为未登录状态')
      this.setData({ 
        userInfo: {},
        openid: ''
      })
      
      // 刷新数据数量
      this.loadCounts()
      
      console.log('✅ 页面已重置为未登录状态')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return  // 直接返回，不执行后续同步
    }
    
    // 有本地数据，正常加载
    const userInfo = userInfoStorage
    this.setData({ userInfo })
    
    // 刷新数据数量
    this.loadCounts()
    
    // 🌟 只有当有头像时，才从云端同步（登录后一定有头像）
    if (userInfo.avatar) {
      console.log('✅ 检测到本地有用户信息（有头像），从云端同步...')
      await this.syncUserInfoFromCloud()
      await this.getOpenId()
    } else {
      console.log('⚠️ 无头像，保持当前状态（未登录）')
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  },
  
  // 🌟 获取用户 openid
  async getOpenId() {
    try {
      // 先从缓存读取
      let openid = wx.getStorageSync('openid')
      
      if (!openid) {
        // 如果缓存没有，调用云函数获取
        const res = await wx.cloud.callFunction({
          name: 'getUserInfo',
          data: {}
        })
        
        if (res.result.success && res.result.data && res.result.data._openid) {
          openid = res.result.data._openid
          // 保存到缓存
          wx.setStorageSync('openid', openid)
        }
      }
      
      // 截取 openid 前8位显示
      const displayOpenid = openid ? openid.substring(0, 8) + '...' : ''
      
      this.setData({ openid: displayOpenid })
      console.log('👤 用户 openid:', displayOpenid)
      
    } catch (error) {
      console.error('❌ 获取 openid 失败:', error)
    }
  },
  
  // 🌟 从云端同步用户信息
  async syncUserInfoFromCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      
      if (res.result.success && res.result.data) {
        const cloudUserInfo = res.result.data
        
        // 合并本地和云端数据
        const mergedUserInfo = {
          ...this.data.userInfo,
          ...cloudUserInfo
        }
        
        this.setData({ userInfo: mergedUserInfo })
        wx.setStorageSync('userInfo', mergedUserInfo)
        
        console.log('✅ 用户信息同步完成')
      }
    } catch (error) {
      console.error('❌ 同步用户信息失败:', error)
      // 静默失败，不影响用户使用
    }
  },
  
  // 🌟 加载各个板块的数据数量
  async loadCounts() {
    console.log('📊 开始加载数据数量...')
    
    // 🔐 数据隔离：检查是否已登录
    // 重新从本地存储读取，确保使用最新的状态
    const userInfo = wx.getStorageSync('userInfo') || {}
    const isLoggedIn = !!userInfo.avatar  // 有头像 = 已登录
    
    console.log('🔍 登录状态检查:')
    console.log('  - userInfo.avatar:', userInfo.avatar ? '有' : '无')
    console.log('  - isLoggedIn:', isLoggedIn)
    
    if (!isLoggedIn) {
      console.log('⚠️ 用户未登录，数据数量全部设为 0')
      this.setData({
        favoriteCount: 0,
        historyCount: 0,
        couponCount: 0,
        allOrderCount: 0,
        pendingOrderCount: 0,
        pickupOrderCount: 0,
        rentingOrderCount: 0
      })
      return  // 直接返回，不查询数据
    }
    
    console.log('✅ 用户已登录，开始加载真实数据...')
    
    try {
      const db = wx.cloud.database()
      
      // 🔍 查询浏览记录数量
      const historyCount = await db.collection('browse_history')
        .count()
        .then(res => res.total)
        .catch(() => 0)
      
      // 🔍 查询优惠券数量（未使用的）
      const couponCount = await db.collection('user_coupons')
        .where({ status: 'unused' })
        .count()
        .then(res => res.total)
        .catch(() => 0)
      
      // 🔍 查询收藏数量（本地存储）
      const favorites = wx.getStorageSync('favorites') || []
      const favoriteCount = favorites.filter(f => f.type === 'rent' || f.type === 'rental').length
      
      // 🔍 查询订单数量（通过云函数，避免权限问题）
      console.log('📦 开始查询订单数量（调用云函数）...')
      
      let allOrderCount = 0
      let pendingOrderCount = 0
      let pickupOrderCount = 0
      let rentingOrderCount = 0
      
      try {
        const orderStatsRes = await wx.cloud.callFunction({
          name: 'getOrderStats',
          data: {}
        })
        
        if (orderStatsRes.result.success) {
          const stats = orderStatsRes.result.data
          allOrderCount = stats.allOrderCount || 0
          pendingOrderCount = stats.pendingOrderCount || 0
          pickupOrderCount = stats.pickupOrderCount || 0
          rentingOrderCount = stats.rentingOrderCount || 0
          // 注：检查中和已完成状态不在"我的"页面显示，但也获取了
          
          console.log('✅ 订单统计获取成功（云函数）:', stats)
        } else {
          console.log('⚠️ 订单统计获取失败，使用默认值 0')
        }
      } catch (error) {
        console.error('❌ 调用 getOrderStats 云函数失败:', error)
        // 使用默认值 0
      }
      
      console.log('✅ 数据数量加载完成:')
      console.log('  我的收藏:', favoriteCount)
      console.log('  浏览记录:', historyCount)
      console.log('  红包卡券:', couponCount)
      console.log('  全部订单:', allOrderCount)
      console.log('  待支付:', pendingOrderCount)
      console.log('  待取件:', pickupOrderCount)
      console.log('  租赁中:', rentingOrderCount)
      
      // 更新数据
      this.setData({
        favoriteCount: favoriteCount,
        historyCount: historyCount,
        couponCount: couponCount,
        allOrderCount: allOrderCount,
        pendingOrderCount: pendingOrderCount,
        pickupOrderCount: pickupOrderCount,
        rentingOrderCount: rentingOrderCount
      })
      
    } catch (err) {
      console.error('❌ 加载数据数量失败:', err)
      // 失败时使用默认值0
      this.setData({
        favoriteCount: 0,
        historyCount: 0,
        couponCount: 0,
        allOrderCount: 0,
        pendingOrderCount: 0,
        pickupOrderCount: 0,
        rentingOrderCount: 0
      })
    }
  },
  
  // 登录/完善资料
  async onLogin() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 用户点击登录，开始授权流程...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    try {
      // 🌟 第一步：通过 getUserProfile 获取用户信息（昵称和头像）
      console.log('📋 第一步：调用 wx.getUserProfile() 获取用户信息...')
      
      const profileRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '获取用户信息用于完善用户资料',
          success: resolve,
          fail: reject
        })
      })
      
      console.log('✅ 用户信息获取成功:')
      console.log('  昵称:', profileRes.userInfo.nickName)
      console.log('  头像:', profileRes.userInfo.avatarUrl)
      console.log('  性别:', profileRes.userInfo.gender)
      console.log('  国家:', profileRes.userInfo.country)
      console.log('  省份:', profileRes.userInfo.province)
      console.log('  城市:', profileRes.userInfo.city)
      
      const { nickName, avatarUrl, gender, country, province, city } = profileRes.userInfo
      
      // 🌟 第二步：获取登录授权码（loginCode）
      console.log('📋 第二步：调用 wx.login() 获取授权码...')
      
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })
      
      if (loginRes.errMsg !== 'login:ok') {
        throw new Error('获取授权码失败')
      }
      
      console.log('✅ 授权码获取成功:', loginRes.code)
      
      // 🌟 第三步：封装用户信息
      console.log('📋 第三步：封装用户信息...')
      console.log('  ⚠️ 注意：登录后不自动使用微信昵称，默认显示 openid')
      console.log('  ⚠️ 用户可在编辑页面手动修改昵称')
      
      // 性别转换：0-未知，1-男，2-女
      const genderMap = { 0: '保密', 1: '男', 2: '女' }
      
      const userInfo = {
        // 🌟 不保存微信昵称，让页面显示 openid
        nickname: '',  // 留空，页面会显示 openid
        avatar: avatarUrl,  // 保存头像
        gender: genderMap[gender] || '保密',
        // 从微信信息中读取城市（如果有）
        city: city || ''
      }
      
      console.log('📦 封装的用户信息（昵称留空）:', userInfo)
      
      // 🌟 先保存到本地存储（关键：确保数据先保存）
      wx.setStorageSync('userInfo', userInfo)
      
      // 🌟 再更新页面数据
      this.setData({ userInfo })
      
      // 🌟 第四步：同步到云端（云函数会自动获取 openid）
      console.log('📋 第四步：调用云函数保存到云端...')
      console.log('  ⚠️ 注意：使用微信云开发，云函数会自动获取 openid')
      console.log('  ⚠️ 无需手动调用 jscode2session 接口')
      
      wx.showLoading({ title: '登录中...', mask: true })
      
      const cloudRes = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          // nickname: nickName,  // 🌟 不保存昵称，让用户自己修改
          avatar: avatarUrl,
          gender: genderMap[gender] || '保密',
          city: city || ''
        }
      })
      
      wx.hideLoading()
      
      console.log('☁️ 云函数返回结果:', cloudRes.result)
      
      if (cloudRes.result.success) {
        console.log('✅ 用户信息已保存到云端')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🎉 登录流程完成！')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        // 如果用户选择了城市，同步到首页
        if (city) {
          wx.setStorageSync('CITY_NAME', city)
          console.log('✅ 城市已同步到首页:', city)
        }
        
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        })
        
        // 🌟 刷新页面数据
        await this.syncUserInfoFromCloud()
        await this.getOpenId()
        
        // 🌟 重新加载数据数量（关键！）
        console.log('📊 登录成功，重新加载数据数量...')
        await this.loadCounts()
        console.log('✅ 数据数量已刷新')
        
      } else {
        throw new Error(cloudRes.result.message || '保存失败')
      }
      
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ 登录失败:', error)
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      wx.hideLoading()
      
      if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
        // 用户拒绝授权
        console.log('⚠️ 用户拒绝了授权')
        wx.showToast({
          title: '您拒绝了授权',
          icon: 'none',
          duration: 2000
        })
      } else {
        // 其他错误
        console.error('⚠️ 其他错误:', error.message)
        wx.showModal({
          title: '登录失败',
          content: error.message || '网络错误，请稍后重试',
          showCancel: false
        })
      }
    }
  },
  
  goEditProfile() {
    wx.navigateTo({ url: '/pages/profile/edit' })
  },
  
  onShortcut(e) {
    // 🔐 数据隔离：检查是否已登录
    const isLoggedIn = !!(this.data.userInfo && this.data.userInfo.avatar)
    
    if (!isLoggedIn) {
      console.log('⚠️ 用户未登录，提示先登录')
      wx.showModal({
        title: '提示',
        content: '请先登录后查看个人数据',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 触发登录
            this.onLogin()
          }
        }
      })
      return
    }
    
    const key = e.currentTarget.dataset.key
    if (key === 'favorite') return wx.navigateTo({ url: '/pages/favorites/index' })
    if (key === 'history') return wx.navigateTo({ url: '/pages/history/index' })
    if (key === 'coupon') return wx.navigateTo({ url: '/pages/coupons/index' })
    wx.showToast({ title: `${key}（占位）`, icon: 'none' })
  },
  
  onTrade(e) {
    const key = e.currentTarget.dataset.key
    const map = {
      'address': '收货地址',
      'verify': '实名认证',
      'deposit': '我的押金',
      'service': '在线客服'
    }
    
    // 在线客服 - 跳转到消息页面
    if (key === 'service') {
      return wx.reLaunch({ url: '/pages/message/message' })
    }
    
    // 其他功能开发中
    wx.showToast({ 
      title: `${map[key]}功能开发中`, 
      icon: 'none',
      duration: 1500
    })
  },
  
  // 📦 跳转到门店管理（先登录，再进入后台）
  goStoreScan() {
    console.log('🏪 跳转到门店管理')
    
    // 检查是否已登录门店
    const currentStore = wx.getStorageSync('currentStore')
    
    if (currentStore) {
      // 已登录，直接进入门店管理首页
      wx.navigateTo({
        url: '/pages/store/home'
      })
    } else {
      // 未登录，跳转到登录页
      wx.navigateTo({
        url: '/pages/store/login'
      })
    }
  },
  
  goAllOrders() {
    // 🔐 数据隔离：检查是否已登录
    const isLoggedIn = !!(this.data.userInfo && this.data.userInfo.avatar)
    
    if (!isLoggedIn) {
      console.log('⚠️ 用户未登录，提示先登录')
      wx.showModal({
        title: '提示',
        content: '请先登录后查看订单',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.onLogin()
          }
        }
      })
      return
    }
    
    wx.navigateTo({ url: '/pages/orders/index' })
  },

  // 跳转到订单状态页面
  goOrderStatus(e) {
    // 🔐 数据隔离：检查是否已登录
    const isLoggedIn = !!(this.data.userInfo && this.data.userInfo.avatar)
    
    if (!isLoggedIn) {
      console.log('⚠️ 用户未登录，提示先登录')
      wx.showModal({
        title: '提示',
        content: '请先登录后查看订单',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.onLogin()
          }
        }
      })
      return
    }
    
    const status = e.currentTarget.dataset.status
    
    // 如果是全部订单，不带参数
    if (!status || status === '') {
      return wx.navigateTo({ url: '/pages/orders/index' })
    }
    
    // 跳转到订单页面，并自动选中对应的筛选状态
    wx.navigateTo({ 
      url: `/pages/orders/index?filter=${encodeURIComponent(status)}` 
    })
  },
  
  onService(e) {
    const key = e.currentTarget.dataset.key
    const map = {
      city: {
        title: '入驻城市',
        content: '我们已在英国核心城市提供服务：\n英格兰：伦敦、南安普顿、曼彻斯特等\n苏格兰：格拉斯哥、爱丁堡\n更多城市持续开通中，敬请期待'
      },
      customer: {
        title: '客服中心',
        content: '服务时间：每日 09:00-21:00\n联系方式：\n- 在线客服：消息页-联系客服\n- 邮箱：support@easygoods.uk\n- 紧急电话：+44 020 1234 5678'
      },
      about: null,
      business: {
        title: '商务合作',
        content: '官方邮箱：support@easygoods.uk\n商务热线：+44 7389003857'
      }
    }
    if (key === 'about') {
      return wx.navigateTo({ url: '/pages/about/index' })
    }
    const data = map[key]
    if (!data) return
    this.setData({ isModalVisible: true, modalTitle: data.title, modalContent: data.content })
  },
  
  onModalConfirm() { 
    this.setData({ isModalVisible: false }) 
  },
  
  onAvatarTap() {
    const current = this.data.userInfo.avatar || '/static/placeholder/a1.png'
    wx.showActionSheet({
      itemList: ['查看头像', '上传头像'],
      success: (res) => {
        const idx = res.tapIndex
        if (idx === 0) {
          wx.previewImage({ urls: [current], current })
        } else if (idx === 1) {
          wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (r) => {
              if (r.tempFiles && r.tempFiles.length > 0) {
                const filePath = r.tempFiles[0].tempFilePath
                const userInfo = wx.getStorageSync('userInfo') || {}
                userInfo.avatar = filePath
                wx.setStorageSync('userInfo', userInfo)
                this.setData({ userInfo })
                wx.showToast({ title: '头像已更新', icon: 'success' })
              }
            }
          })
        }
      }
    })
  },
  
  onNavTap(e) {
    const page = e.currentTarget.dataset.page
    if (page === 'index') return wx.reLaunch({ url: '/pages/index/index' })
    if (page === 'profile') return
  },

  // 页面滑动切换 - 触摸开始
  onPageTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      this.pageTouchStartX = e.touches[0].pageX
      this.pageTouchStartY = e.touches[0].pageY
      this.setData({
        isPageSwiping: false,
        pageSwipeTransition: ''
      })
    }
  },

  // 页面滑动切换 - 触摸移动（iOS风格跟手）
  onPageTouchMove(e) {
    if (!e.touches || e.touches.length === 0) return
    
    const touchX = e.touches[0].pageX
    const touchY = e.touches[0].pageY
    const deltaX = touchX - this.pageTouchStartX
    const deltaY = touchY - this.pageTouchStartY
    
    // 判断是否开始水平滑动
    if (!this.data.isPageSwiping && Math.abs(deltaX) > 10) {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        this.setData({ isPageSwiping: true })
      }
    }
    
    // iOS风格跟手效果
    if (this.data.isPageSwiping) {
      // 只允许向右滑动（切换到首页）
      const damping = deltaX > 0 ? 0.5 : 0.2  // 向右阻尼小，向左阻尼大
      const offset = deltaX * damping
      
      // 透明度变化
      const maxOffset = 150
      const opacityChange = Math.min(Math.abs(offset) / maxOffset, 0.2)
      const opacity = 1 - opacityChange
      
      this.setData({
        pageSwipeOffset: offset,
        pageSwipeOpacity: opacity,
        pageSwipeTransition: ''
      })
    }
  },

  // 页面滑动切换 - 触摸结束（iOS风格动画）
  onPageTouchEnd(e) {
    if (!e.changedTouches || e.changedTouches.length === 0) {
      this.resetPageSwipe()
      return
    }
    
    const touchEndX = e.changedTouches[0].pageX
    const touchEndY = e.changedTouches[0].pageY
    
    const deltaX = touchEndX - this.pageTouchStartX
    const deltaY = touchEndY - this.pageTouchStartY
    
    // 判断是否为有效的左右滑动
    const minSwipeDistance = 80
    const isHorizontalSwipe = this.data.isPageSwiping &&
                              Math.abs(deltaX) > minSwipeDistance && 
                              Math.abs(deltaX) > Math.abs(deltaY) * 2
    
    if (isHorizontalSwipe && deltaX > 0) {
      // 向右滑动 -> 滑出动画 -> 切换到"首页"
      this.setData({
        pageSwipeTransition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pageSwipeOffset: 400,
        pageSwipeOpacity: 0
      })
      
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' })
      }, 300)
    } else {
      // 弹性回弹
      this.bounceBackPage()
    }
  },

  // 弹性回弹
  bounceBackPage() {
    this.setData({
      pageSwipeTransition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out',
      pageSwipeOffset: 0,
      pageSwipeOpacity: 1
    })
  },

  // 重置页面滑动状态
  resetPageSwipe() {
    this.setData({
      isPageSwiping: false,
      pageSwipeOffset: 0,
      pageSwipeOpacity: 1,
      pageSwipeTransition: ''
    })
  }
})

