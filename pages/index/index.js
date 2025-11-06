// index.js
Page({
  data: {
    // 状态栏和导航栏高度
    statusBarHeight: 0,  // 状态栏高度
    navBarHeight: 44,    // 导航栏内容高度（固定44px）
    totalNavHeight: 0,   // 总高度（状态栏 + 导航栏）
    
    // 页面滑动切换
    pageSwipeOffset: 0,
    pageSwipeOpacity: 1,
    pageSwipeTransition: '',
    isPageSwiping: false,
    
    // 顶部城市
    cityName: '南安普顿',
    cities: ['伦敦','曼彻斯特','伯明翰','利兹','利物浦','布里斯托','谢菲尔德','纽卡斯尔','南安普顿','诺丁汉','爱丁堡','格拉斯哥','剑桥','牛津'],
    cityPickerVisible: false,
    
    // 主导航栏（1行5列）
    mainNavs: [
      { name: '全部', id: 'all', icon: '/static/icons/nav/all.png' },
      { name: '娱乐', id: 'entertainment', icon: '/static/icons/nav/entertainment.png' },
      { name: '摄影', id: 'photography', icon: '/static/icons/nav/photography.png' },
      { name: '户外', id: 'outdoor', icon: '/static/icons/nav/outdoor.png' },
      { name: '其他', id: 'other', icon: '/static/icons/nav/other.png', disabled: true }
    ],
    currentMainNav: 0,
    
    // 子分类配置（根据主导航动态切换）- 每个都包含"全部"
    subTabsConfig: {
      'entertainment': ['全部', '麻将', '德州扑克', '骰子', '蓝牙音箱', '投影仪', '其他'],
      'photography': ['全部', '运动相机', 'CCD', '投影仪', '配件'],
      'outdoor': ['全部', '野餐垫', '帐篷', '折叠椅', '其他']
    },
    
    // 当前显示的子分类tab
    currentSubTabs: [],
    currentSubTab: 0,
    showSubTabs: false,
    
    // 当前选中的分类
    currentMainCategory: '',  // 当前一级分类
    currentSubCategory: '',   // 当前二级分类
    
    // 所有商品（用于筛选）
    allProducts: [],
    
    // 显示的商品（筛选后）
    displayProducts: [],
    
    // 商品数据
    productList: [
      // 娱乐-麻将
      { id: 1, name: '自动麻将机 静音版', mainCategory: '娱乐', subCategory: '麻将', price: 50, image: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=400&h=400&fit=crop' },
      { id: 2, name: '手搓麻将 高档版', mainCategory: '娱乐', subCategory: '麻将', price: 25, image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop' },
      
      // 娱乐-德州扑克
      { id: 3, name: '德州扑克筹码套装（500片）', mainCategory: '娱乐', subCategory: '德州扑克', price: 20, image: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=400&h=400&fit=crop' },
      { id: 4, name: '专业扑克牌 防水版', mainCategory: '娱乐', subCategory: '德州扑克', price: 10, image: 'https://images.unsplash.com/photo-1606489584937-e6c9f03f8cd9?w=400&h=400&fit=crop' },
      
      // 娱乐-骰子
      { id: 5, name: '骰盅套装 专业版', mainCategory: '娱乐', subCategory: '骰子', price: 15, image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=400&fit=crop' },
      { id: 6, name: '豪华骰子套装（12颗）', mainCategory: '娱乐', subCategory: '骰子', price: 8, image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop' },
      
      // 娱乐-蓝牙音箱
      { id: 7, name: 'JBL Flip 6 蓝牙音箱', mainCategory: '娱乐', subCategory: '蓝牙音箱', price: 18, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop' },
      { id: 8, name: 'Bose SoundLink 便携音箱', mainCategory: '娱乐', subCategory: '蓝牙音箱', price: 22, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop' },
      
      // 娱乐-投影仪
      { id: 9, name: '明基投影仪 4K版', mainCategory: '娱乐', subCategory: '投影仪', price: 45, image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop' },
      { id: 10, name: '极米投影仪 智能版', mainCategory: '娱乐', subCategory: '投影仪', price: 38, image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=400&fit=crop' },
      
      // 摄影-运动相机
      { id: 11, name: 'GoPro Hero 11 运动相机', mainCategory: '摄影', subCategory: '运动相机', price: 35, image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop' },
      { id: 12, name: 'DJI Action 2 运动相机', mainCategory: '摄影', subCategory: '运动相机', price: 30, image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop' },
      
      // 摄影-CCD
      { id: 13, name: '富士 X100VI 复古CCD相机', mainCategory: '摄影', subCategory: 'CCD', price: 80, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop' },
      { id: 14, name: 'Sony Cyber-shot DSC-RX100', mainCategory: '摄影', subCategory: 'CCD', price: 60, image: 'https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=400&h=400&fit=crop' },
      
      // 摄影-投影仪
      { id: 15, name: '爱普生投影仪 商务版', mainCategory: '摄影', subCategory: '投影仪', price: 40, image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop' },
      
      // 摄影-配件
      { id: 16, name: 'Sony FE 24-70mm F2.8 GM II 镜头', mainCategory: '摄影', subCategory: '配件', price: 120, image: 'https://images.unsplash.com/photo-1606489584937-e6c9f03f8cd9?w=400&h=400&fit=crop' },
      { id: 17, name: 'Manfrotto 055 碳纤维三脚架', mainCategory: '摄影', subCategory: '配件', price: 80, image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop' },
      { id: 18, name: 'Godox SL-60W LED 补光灯', mainCategory: '摄影', subCategory: '配件', price: 90, image: 'https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=400&h=400&fit=crop' },
      
      // 户外-野餐垫
      { id: 19, name: '防潮野餐垫 加厚版', mainCategory: '户外', subCategory: '野餐垫', price: 12, image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&h=400&fit=crop' },
      { id: 20, name: '超大野餐垫 家庭款', mainCategory: '户外', subCategory: '野餐垫', price: 18, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
      
      // 户外-帐篷
      { id: 21, name: '自动充气帐篷 4人款', mainCategory: '户外', subCategory: '帐篷', price: 60, image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&h=400&fit=crop' },
      { id: 22, name: '双层防雨帐篷 6人款', mainCategory: '户外', subCategory: '帐篷', price: 75, image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop' },
      
      // 户外-折叠椅
      { id: 23, name: '户外折叠椅 便携款', mainCategory: '户外', subCategory: '折叠椅', price: 15, image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=400&fit=crop' },
      { id: 24, name: '钓鱼椅 舒适型', mainCategory: '户外', subCategory: '折叠椅', price: 20, image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop' }
    ]
  },

  onLoad(options) {
    // 🎫 检查是否携带 scene 参数（从小程序码扫描进入）
    const scene = decodeURIComponent(options.scene || '')
    console.log('📱 首页参数:', options)
    console.log('🔍 Scene 参数:', scene)
    
    if (scene && scene.startsWith('ORDER')) {
      // 检测到订单号，跳转到门店扫码页面
      console.log('🎫 检测到取件小程序码，订单号:', scene)
      
      wx.redirectTo({
        url: `/pages/store/scan?orderId=${scene}`
      })
      return
    }
    
    // 获取系统信息和胶囊按钮位置，动态计算导航栏高度
    try {
      const windowInfo = wx.getWindowInfo()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      const statusBarHeight = windowInfo.statusBarHeight
      // 导航栏高度 = 胶囊高度 + (胶囊top - 状态栏高度) * 2（上下留出相同间距）
      const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
      const totalNavHeight = statusBarHeight + navBarHeight
      
      // 保存所有商品到allProducts
      const allProducts = this.data.productList.slice()
      
      this.setData({
        statusBarHeight,
        navBarHeight,
        totalNavHeight,
        allProducts: allProducts
      })
      
      console.log('🎯 首页导航栏适配信息:')
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
      
      // 保存所有商品到allProducts
      const allProducts = this.data.productList.slice()
      
      this.setData({
        statusBarHeight,
        navBarHeight,
        totalNavHeight,
        allProducts: allProducts
      })
      
      console.log('⚠️ 首页使用兜底方案计算导航栏高度:', totalNavHeight)
    }
    
    // 恢复保存的城市
    // 优先从 CITY_NAME 读取，如果没有则从用户信息中读取
    let cityName = wx.getStorageSync('CITY_NAME')
    if (!cityName) {
      const userInfo = wx.getStorageSync('userInfo') || {}
      if (userInfo.city) {
        cityName = userInfo.city
        // 同步到 CITY_NAME
        wx.setStorageSync('CITY_NAME', cityName)
      }
    }
    if (cityName) {
      this.setData({ cityName })
      console.log('✅ 城市已恢复:', cityName)
    }
    
    // 🌟 从云端加载商品（替换原来的 filterProducts）
    this.loadProductsFromCloud()
  },

  onShow() {
    console.log('页面显示')
  },

  // 主导航点击事件
  onMainNavTap(e) {
    const index = e.currentTarget.dataset.index
    const nav = this.data.mainNavs[index]
    
    // 如果是禁用状态，显示提示
    if (nav.disabled) {
      return wx.showToast({
        title: '暂未开放',
        icon: 'none',
        duration: 1500
      })
    }
    
    // 如果点击"全部"，隐藏子分类tab，显示所有商品
    if (nav.id === 'all') {
      this.setData({
        currentMainNav: index,
        showSubTabs: false,
        currentSubTab: 0,
        currentMainCategory: '',
        currentSubCategory: ''
      }, () => {
        // 🌟 使用云端加载
        this.loadProductsFromCloud()
      })
      console.log('选择全部，显示所有商品')
    } else {
      // 根据主导航显示对应的子分类，默认选中"全部"
      const subTabs = this.data.subTabsConfig[nav.id] || []
      this.setData({
        currentMainNav: index,
        currentSubTabs: subTabs,
        showSubTabs: subTabs.length > 0,
        currentSubTab: 0,
        currentMainCategory: nav.name,
        currentSubCategory: '全部'  // 默认为全部
      }, () => {
        // 🌟 使用云端筛选
        this.filterProductsFromCloud()
      })
      console.log('选择主导航:', nav.name, '子分类:', subTabs)
    }
  },

  // 子分类tab点击事件
  onSubTabTap(e) {
    const index = e.currentTarget.dataset.index
    const subCategory = this.data.currentSubTabs[index]
    
    this.setData({
      currentSubTab: index,
      currentSubCategory: subCategory
    }, () => {
      // 🌟 使用云端筛选
      this.filterProductsFromCloud()
    })
    console.log('选择子分类:', subCategory)
  },

  // 商品筛选方法（本地筛选，作为备用）
  filterProducts() {
    const { allProducts, currentMainCategory, currentSubCategory } = this.data
    let filtered = allProducts
    
    // 如果选中了一级分类（非"全部"）
    if (currentMainCategory) {
      filtered = filtered.filter(item => item.mainCategory === currentMainCategory)
      
      // 如果选中了二级分类（非"全部"）
      if (currentSubCategory && currentSubCategory !== '全部') {
        filtered = filtered.filter(item => item.subCategory === currentSubCategory)
      }
    }
    
    this.setData({
      productList: filtered
    })
    
    console.log('筛选结果:', filtered.length, '个商品')
  },

  // 🌟 从云端加载商品（新增）
  async loadProductsFromCloud() {
    console.log('🌐 开始从云端加载商品...')
    
    // 显示加载提示
    wx.showLoading({ 
      title: '加载中...',
      mask: true 
    })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getProducts',
        data: {
          mainCategory: this.data.currentMainCategory || '',
          subCategory: this.data.currentSubCategory || '',
          page: 1,
          pageSize: 100  // 一次加载100个商品
        }
      })
      
      if (res.result && res.result.success) {
        const cloudProducts = res.result.data || []
        
        console.log('✅ 云端加载成功！共', cloudProducts.length, '件商品')
        console.log('📦 商品数据:', cloudProducts)
        
        // 更新商品列表
        this.setData({
          allProducts: cloudProducts,
          productList: cloudProducts
        })
        
        // 显示成功提示
        wx.showToast({
          title: `加载成功！共${cloudProducts.length}件商品`,
          icon: 'success',
          duration: 1500
        })
      } else {
        throw new Error(res.result?.message || '加载失败')
      }
    } catch (err) {
      console.error('❌ 云端加载失败:', err)
      
      // 显示错误提示
      wx.showToast({
        title: '加载失败，使用本地数据',
        icon: 'none',
        duration: 2000
      })
      
      // 失败时使用本地备份数据
      console.log('⚠️ 使用本地备份数据')
    } finally {
      wx.hideLoading()
    }
  },

  // 🌟 从云端筛选商品（新增）
  async filterProductsFromCloud() {
    console.log('🔍 从云端筛选商品...')
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getProducts',
        data: {
          mainCategory: this.data.currentMainCategory || '',
          subCategory: this.data.currentSubCategory || '',
          page: 1,
          pageSize: 100
        }
      })
      
      if (res.result && res.result.success) {
        const filtered = res.result.data || []
        
        this.setData({
          productList: filtered
        })
        
        console.log('✅ 筛选成功:', filtered.length, '件商品')
      } else {
        // 云端筛选失败，使用本地筛选
        console.log('⚠️ 云端筛选失败，使用本地筛选')
        this.filterProducts()
      }
    } catch (err) {
      console.error('❌ 云端筛选失败:', err)
      // 失败时使用本地筛选
      this.filterProducts()
    }
  },

  // 商品点击事件
  onProductTap(e) {
    const item = e.currentTarget.dataset.item
    console.log('点击商品:', item)
    
    // 🌟 使用 _id（云数据库ID）或 id（兼容本地数据）
    const productId = item._id || item.id
    
    console.log('商品ID:', productId)
    
    // 跳转到租赁商品详情页
    wx.navigateTo({
      url: `/pages/rental/detail?id=${productId}`
    })
  },

  // 底部导航切换事件
  onNavTap(e) {
    const page = e.currentTarget.dataset.page
    console.log('点击底部导航，page:', page)
    
    if (page === 'index') {
      console.log('当前已在首页')
      return
    }
    
    if (page === 'profile') {
      return wx.reLaunch({ url: '/pages/profile/index' })
    }
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
      // 只允许向左滑动（切换到我的页面）
      const damping = deltaX < 0 ? 0.5 : 0.2  // 向左阻尼小，向右阻尼大
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
    
    if (isHorizontalSwipe && deltaX < 0) {
      // 向左滑动 -> 滑出动画 -> 切换到"我的"页面
      this.setData({
        pageSwipeTransition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pageSwipeOffset: -400,
        pageSwipeOpacity: 0
      })
      
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/profile/index' })
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
  },

  // 搜索事件
  onSearchInput(e) {
    const value = e.detail.value
    console.log('搜索内容:', value)
    
    // 🌟 使用云端搜索（防抖处理）
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
    
    this.searchTimer = setTimeout(() => {
      this.searchProductsFromCloud(value)
    }, 500)  // 500ms 后执行搜索
  },

  // 🌟 从云端搜索商品（新增）
  async searchProductsFromCloud(keyword) {
    if (!keyword || keyword.trim() === '') {
      // 如果搜索词为空，重新加载所有商品
      this.loadProductsFromCloud()
      return
    }
    
    console.log('🔍 搜索:', keyword)
    wx.showLoading({ title: '搜索中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getProducts',
        data: {
          keyword: keyword,
          page: 1,
          pageSize: 50
        }
      })
      
      if (res.result && res.result.success) {
        const searchResults = res.result.data || []
        
        this.setData({
          productList: searchResults
        })
        
        console.log('✅ 搜索成功:', searchResults.length, '件商品')
        
        wx.showToast({
          title: `找到 ${searchResults.length} 件商品`,
          icon: 'success',
          duration: 1500
        })
      }
    } catch (err) {
      console.error('❌ 搜索失败:', err)
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 顶部城市选择
  onCityTap() {
    this.setData({ cityPickerVisible: !this.data.cityPickerVisible })
  },
  async onCitySelect(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ cityName: name, cityPickerVisible: false })
    wx.setStorageSync('CITY_NAME', name)
    
    // 🌟 同步到用户信息
    const userInfo = wx.getStorageSync('userInfo') || {}
    userInfo.city = name
    wx.setStorageSync('userInfo', userInfo)
    
    // 🌟 同步到云端
    try {
      await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: { city: name }
      })
      console.log('✅ 城市已同步到用户信息:', name)
    } catch (error) {
      console.error('❌ 城市同步到云端失败:', error)
    }
    
    wx.showToast({ title: `已切换到${name}`, icon: 'success' })
  },
  onCityMaskTap() {
    this.setData({ cityPickerVisible: false })
  },

  // ==========================================
  // 🧪 云开发测试代码
  // ==========================================

  // 测试云函数
  async testCloudFunctions() {
    console.log('🚀 开始测试云函数...')
    
    // 测试1：testCloud
    try {
      const testRes = await wx.cloud.callFunction({
        name: 'testCloud',
        data: { message: '来自小程序的测试' }
      })
      
      if (testRes.result.success) {
        console.log('✅ testCloud 测试成功!')
        console.log('📋 返回数据:', testRes.result)
        console.log('🆔 OpenID:', testRes.result.data.openid)
        console.log('🌐 环境:', testRes.result.data.env)
      }
    } catch (err) {
      console.error('❌ testCloud 测试失败:', err)
      wx.showToast({
        title: 'testCloud 失败: ' + err.errMsg,
        icon: 'none',
        duration: 3000
      })
    }
    
    // 测试2：getProducts
    try {
      const productsRes = await wx.cloud.callFunction({
        name: 'getProducts',
        data: {
          mainCategory: '娱乐',
          page: 1,
          pageSize: 10
        }
      })
      
      if (productsRes.result.success) {
        console.log('✅ getProducts 测试成功!')
        console.log('📊 商品总数:', productsRes.result.pagination.total)
        console.log('📦 商品列表:', productsRes.result.data)
        
        // 显示成功提示
        wx.showToast({
          title: `加载成功！共${productsRes.result.pagination.total}件商品`,
          icon: 'success',
          duration: 2000
        })
      }
    } catch (err) {
      console.error('❌ getProducts 测试失败:', err)
      wx.showToast({
        title: 'getProducts 失败: ' + err.errMsg,
        icon: 'none',
        duration: 3000
      })
    }
    
    console.log('🎉 云函数测试完成!')
  },

  // 测试数据库权限
  async testDatabasePermissions() {
    console.log('🔐 开始测试数据库权限...')
    const db = wx.cloud.database()
    
    // 测试1：读取 products（应该成功）
    try {
      const productsRes = await db.collection('products').limit(1).get()
      console.log('✅ 读取商品权限：通过（' + productsRes.data.length + '条）')
    } catch (err) {
      console.error('❌ 读取商品权限：失败', err)
    }
    
    // 测试2：读取 coupons（应该成功）
    try {
      const couponsRes = await db.collection('coupons').limit(1).get()
      console.log('✅ 读取优惠券权限：通过（' + couponsRes.data.length + '条）')
    } catch (err) {
      console.error('❌ 读取优惠券权限：失败', err)
    }
    
    // 测试3：写入 products（应该失败或 updated: 0）
    try {
      const addRes = await db.collection('products').add({
        data: { name: '测试商品' }
      })
      console.log('⚠️ 写入商品权限：通过（权限可能设置不正确）')
    } catch (err) {
      if (err.errMsg.includes('permission denied')) {
        console.log('✅ 写入商品权限：正确拒绝（权限设置正确）')
      } else {
        console.error('❌ 写入商品权限：其他错误', err)
      }
    }
    
    console.log('🎉 数据库权限测试完成!')
  }
})

