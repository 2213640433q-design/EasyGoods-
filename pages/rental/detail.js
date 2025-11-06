Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    product: {},
    currentImageIndex: 0,
    currentTab: 0, // 0:拍摄样片 1:产品介绍
    
    // 租期选项
    rentalOptions: [
      { days: 0, price: 8 },
      { days: 1, price: 7 },
      { days: 2, price: 6 },
      { days: 3, price: 5 },
      { days: '续租', price: 4 }  // 续租特殊处理
    ],
    selectedRentalIndex: 0,
    
    // 租赁流程（已删除，保留数据结构以防后续需要）
    rentalSteps: [
      { icon: '🛍️', title: '选择商品', desc: '浏览器材，选择心仪产品' },
      { icon: '📝', title: '确定租期', desc: '选择租期，系统自动计算价格' },
      { icon: '💰', title: '支付租金', desc: '在线支付押金和租金' },
      { icon: '📤', title: '归还/续租', desc: '快递归还或申请续租' }
    ],
    
    // 客户评价
    reviews: [],
    
    // 租赁滑窗相关
    showRentalSheet: false,
    pickupLocations: ['伦敦店', '南安普顿店', '格拉斯哥店', '爱丁堡店'],
    selectedPickupIndex: 0,
    rentalStartDate: '',
    rentalEndDate: '',
    rentalDays: 0,
    extraAccessories: [
      { id: 1, name: '64G SD卡', price: 2, selected: false },
      { id: 2, name: '备用电池', price: 3, selected: false },
      { id: 3, name: '三脚架', price: 5, selected: false },
      { id: 4, name: '相机包', price: 4, selected: false }
    ],
    totalPrice: 0,
    
    // 日历选择器相关
    showCalendar: false,
    currentYear: 2025,
    currentMonth: 10,
    calendarDates: [],
    calendarStartDate: '',
    calendarEndDate: '',
    calendarDays: 0,
    selectingStartDate: true,
    // 收藏状态
    collected: false
  },

  onLoad(options) {
    // 动态计算状态栏和导航栏高度
    try {
      const windowInfo = wx.getWindowInfo()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight,
        navBarHeight: menuButton.height + (menuButton.top - windowInfo.statusBarHeight) * 2
      })
    } catch (e) {
      const systemInfo = wx.getSystemInfoSync()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: menuButton.height + (menuButton.top - systemInfo.statusBarHeight) * 2
      })
    }

    const productId = options.id
    if (productId) {
      // 🌟 优先从云端加载商品详情
      this.loadProductDetailFromCloud(productId)
      
      // 🌟 记录浏览历史（异步执行，不阻塞页面加载）
      this.recordBrowseHistory(productId)
    }
  },

  // 页面卸载前处理
  onUnload() {
    // 确保关闭所有弹窗
    if (this.data.showCalendar) {
      this.setData({ showCalendar: false })
    }
    if (this.data.showRentalSheet) {
      this.setData({ showRentalSheet: false })
    }
  },

  // 🌟 从云端加载商品详情（新增）
  async loadProductDetailFromCloud(productId) {
    console.log('🌐 从云端加载商品详情，ID:', productId)
    
    // 显示加载提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getProductDetail',
        data: { productId: String(productId) }
      })
      
      if (res.result && res.result.success) {
        const cloudProduct = res.result.data
        
        console.log('✅ 云端加载成功:', cloudProduct.name)
        console.log('📦 商品数据:', cloudProduct)
        
        // 🔧 根据商品类别生成可选配件
        const accessories = this.generateAccessoriesByCategory(cloudProduct.mainCategory, cloudProduct.subCategory)
        console.log('🎒 生成配件列表:', accessories)
        
        // 设置商品数据
        this.setData({ 
          product: cloudProduct,
          pickupLocations: cloudProduct.stores || ['伦敦店', '南安普顿店'],
          extraAccessories: accessories  // 🔑 设置配件列表
        })
        
        // 评论功能暂时关闭
        // this.loadReviews(productId)
        
        // 同步收藏状态
        const favId = `rent-${cloudProduct._id}`
        const favorites = wx.getStorageSync('favorites') || []
        const isCollected = favorites.some(it => it.id === favId)
        this.setData({ collected: isCollected })
        
        wx.hideLoading()
      } else {
        throw new Error(res.result?.message || '加载失败')
      }
    } catch (err) {
      console.error('❌ 云端加载失败:', err)
      
      wx.hideLoading()
      wx.showToast({
        title: '加载失败，使用备用数据',
        icon: 'none',
        duration: 2000
      })
      
      // 失败时使用本地备份数据
      console.log('⚠️ 使用本地备份数据')
      this.loadRentalProduct(productId)
    }
  },
  
  // 🔧 根据商品类别生成可选配件
  generateAccessoriesByCategory(mainCategory, subCategory) {
    const accessoriesMap = {
      '娱乐': {
        '麻将': [
          { id: 1, name: '备用麻将牌', price: 5, selected: false },
          { id: 2, name: '防滑垫', price: 3, selected: false },
          { id: 3, name: '计分器', price: 4, selected: false }
        ],
        '德州扑克': [
          { id: 1, name: '额外筹码（100片）', price: 5, selected: false },
          { id: 2, name: '专业扑克牌', price: 3, selected: false },
          { id: 3, name: '计时器', price: 2, selected: false }
        ],
        '骰子': [
          { id: 1, name: '备用骰子', price: 2, selected: false },
          { id: 2, name: '骰盅', price: 3, selected: false }
        ],
        '蓝牙音箱': [
          { id: 1, name: '备用充电线', price: 2, selected: false },
          { id: 2, name: '便携包', price: 3, selected: false }
        ],
        '投影仪': [
          { id: 1, name: '投影幕布', price: 8, selected: false },
          { id: 2, name: 'HDMI线', price: 2, selected: false },
          { id: 3, name: '三脚架', price: 5, selected: false }
        ]
      },
      '摄影': {
        '运动相机': [
          { id: 1, name: '64G SD卡', price: 3, selected: false },
          { id: 2, name: '备用电池', price: 4, selected: false },
          { id: 3, name: '自拍杆', price: 3, selected: false },
          { id: 4, name: '防水壳', price: 5, selected: false }
        ],
        'CCD': [
          { id: 1, name: '32G SD卡', price: 2, selected: false },
          { id: 2, name: '备用电池', price: 3, selected: false },
          { id: 3, name: '相机包', price: 4, selected: false },
          { id: 4, name: '三脚架', price: 5, selected: false }
        ],
        '投影仪': [
          { id: 1, name: '投影幕布', price: 8, selected: false },
          { id: 2, name: 'HDMI线', price: 2, selected: false }
        ],
        '配件': [
          { id: 1, name: '镜头清洁套装', price: 2, selected: false },
          { id: 2, name: '摄影灯', price: 6, selected: false }
        ]
      },
      '户外': {
        '野餐垫': [
          { id: 1, name: '防水收纳袋', price: 2, selected: false },
          { id: 2, name: '固定钉（4个）', price: 1, selected: false }
        ],
        '帐篷': [
          { id: 1, name: '地钉（8个）', price: 2, selected: false },
          { id: 2, name: '防潮垫', price: 3, selected: false },
          { id: 3, name: '营锤', price: 2, selected: false }
        ],
        '折叠椅': [
          { id: 1, name: '便携包', price: 2, selected: false }
        ]
      }
    }
    
    // 获取对应类别的配件，如果没有则返回默认配件
    const categoryAccessories = accessoriesMap[mainCategory]
    if (categoryAccessories && categoryAccessories[subCategory]) {
      return categoryAccessories[subCategory]
    }
    
    // 如果没有匹配的，返回默认配件
    return [
      { id: 1, name: '便携包', price: 3, selected: false },
      { id: 2, name: '清洁套装', price: 2, selected: false }
    ]
  },

  // 🌟 记录浏览历史（新增）
  async recordBrowseHistory(productId) {
    try {
      // 先从云端获取商品信息（用于记录）
      const res = await wx.cloud.callFunction({
        name: 'getProductDetail',
        data: { productId: String(productId) }
      })
      
      if (res.result && res.result.success) {
        const product = res.result.data
        
        // 调用云函数记录浏览历史
        const viewRes = await wx.cloud.callFunction({
          name: 'updateProductView',
          data: {
            productId: product._id,
            productName: product.name,
            productImage: product.images && product.images.length > 0 ? product.images[0] : '',
            price: product.price
          }
        })
        
        if (viewRes.result && viewRes.result.success) {
          console.log('📖 浏览记录已保存:', viewRes.result.action)
        }
      }
    } catch (err) {
      // 记录浏览历史失败不影响页面正常显示
      console.log('⚠️ 记录浏览历史失败:', err)
    }
  },

  // 加载租赁商品详情（本地备份数据）
  loadRentalProduct(productId) {
    // 确保ID为字符串类型
    const id = String(productId)
    
    // 模拟租赁商品数据
    const allProducts = [
      {
        id: '1',
        name: '富士 X100VI 复古旁轴相机（6代）',
        subtitle: '人文',
        images: [
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop'
        ],
        deposit: 12500,
        rentedCount: 156,
        startRent: '自取0天起租（次日还）',
        accessories: '64G SD卡、充电器、电池*2、电脑USB读卡器、相机包、清洁套装',
        description: '温馨提示：\n①此型号提供的肩带为cam in 快拆肩带！\n②机身颜色随机发货！',
        specs: [
          { label: '型号', value: '富士X100VI' },
          { label: '上市时间', value: '2024年3月' },
          { label: '影像传感器', value: 'X-Processor 5' },
          { label: '像素', value: '4020 万' },
          { label: '防抖', value: '6.0档五轴防抖' },
          { label: '胶片模拟', value: '20个' },
          { label: '视频规格', value: '6.2K 30P' },
          { label: '对焦', value: 'AI智能对焦识别' }
        ],
        comparisonImages: [
          'https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=800&h=600&fit=crop'
        ],
        sampleImages: [
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop'
        ],
        stores: ['伦敦', '南安普顿', '格拉斯哥', '爱丁堡']
      },
      {
        id: '2',
        name: 'Sony A7M4 全画幅微单相机',
        subtitle: '专业',
        images: [
          'https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop'
        ],
        deposit: 15000,
        rentedCount: 203,
        startRent: '自取0天起租（次日还）',
        accessories: 'SD卡、充电器、备用电池*3、相机包',
        description: '温馨提示：\n①专业级全画幅微单\n②机身颜色随机发货',
        specs: [
          { label: '型号', value: 'Sony A7M4' },
          { label: '像素', value: '3300万' },
          { label: '防抖', value: '5.5档五轴防抖' },
          { label: '视频规格', value: '4K 60P' }
        ],
        comparisonImages: ['https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=800&h=600&fit=crop'],
        sampleImages: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop'],
        stores: ['伦敦', '南安普顿', '格拉斯哥', '爱丁堡']
      },
      {
        id: '3',
        name: 'Canon EOS R5 专业无反相机',
        subtitle: '摄影',
        images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop'],
        deposit: 18000,
        rentedCount: 89,
        startRent: '自取0天起租（次日还）',
        accessories: 'CFexpress卡、充电器、备用电池*2、相机包',
        description: '温馨提示：\n①高端专业机型\n②机身颜色随机发货',
        specs: [
          { label: '型号', value: 'Canon EOS R5' },
          { label: '像素', value: '4500万' },
          { label: '防抖', value: '8档防抖' },
          { label: '视频规格', value: '8K 30P' }
        ],
        comparisonImages: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop'],
        sampleImages: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop'],
        stores: ['伦敦', '南安普顿', '格拉斯哥', '爱丁堡']
      },
      {
        id: '4',
        name: 'DJI Mini 3 Pro 航拍无人机',
        subtitle: '航拍',
        images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=800&fit=crop'],
        deposit: 5000,
        rentedCount: 342,
        startRent: '自取0天起租（次日还）',
        accessories: '备用电池*3、充电管家、收纳包、备用桨叶',
        description: '温馨提示：\n①轻便型航拍无人机\n②需遵守当地飞行法规',
        specs: [
          { label: '型号', value: 'DJI Mini 3 Pro' },
          { label: '重量', value: '249克' },
          { label: '续航', value: '34分钟' },
          { label: '视频规格', value: '4K 60fps' }
        ],
        comparisonImages: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop'],
        sampleImages: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=600&fit=crop'],
        stores: ['伦敦', '南安普顿', '格拉斯哥', '爱丁堡']
      },
      {
        id: '5',
        name: 'DJI Mavic 3 Pro 专业航拍无人机',
        subtitle: '航拍',
        images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=800&fit=crop'],
        deposit: 12000,
        rentedCount: 127,
        startRent: '自取0天起租（次日还）',
        accessories: '备用电池*4、充电管家、专业收纳箱、ND滤镜套装',
        description: '温馨提示：\n①专业级航拍设备\n②需持有相关飞行资质',
        specs: [
          { label: '型号', value: 'DJI Mavic 3 Pro' },
          { label: '续航', value: '43分钟' },
          { label: '避障', value: '全向避障' },
          { label: '视频规格', value: '5.1K 50fps' }
        ],
        comparisonImages: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop'],
        sampleImages: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=600&fit=crop'],
        stores: ['伦敦', '南安普顿', '格拉斯哥', '爱丁堡']
      },
      {
        id: '6',
        name: 'DJI RS 3 Pro 专业手持云台',
        subtitle: '稳定器',
        images: ['https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=800&h=800&fit=crop'],
        deposit: 3500,
        rentedCount: 215,
        startRent: '自取0天起租（次日还）',
        accessories: '多功能提壶手柄、延长杆、收纳箱',
        description: '温馨提示：\n①支持多种相机型号\n②附带快速释放板',
        specs: [
          { label: '型号', value: 'DJI RS 3 Pro' },
          { label: '负载', value: '4.5kg' },
          { label: '续航', value: '12小时' },
          { label: '轴数', value: '三轴' }
        ],
        comparisonImages: ['https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=800&h=600&fit=crop'],
        sampleImages: ['https://images.unsplash.com/photo-1606390289279-c4e71fbb96e8?w=600&h=600&fit=crop'],
        stores: ['伦敦', '南安普顿', '格拉斯哥', '爱丁堡']
      }
    ]

    const product = allProducts.find(p => p.id === id) || allProducts[0]
    
    // 🔧 生成默认配件（本地备份数据没有类别信息，使用通用配件）
    const accessories = [
      { id: 1, name: '64G SD卡', price: 2, selected: false },
      { id: 2, name: '备用电池', price: 3, selected: false },
      { id: 3, name: '三脚架', price: 5, selected: false },
      { id: 4, name: '相机包', price: 4, selected: false }
    ]
    
    // 评论功能暂时关闭
    // this.loadReviews(productId)
    
    this.setData({ 
      product: product,
      extraAccessories: accessories  // 🔑 设置配件列表
    })

    // 同步收藏状态
    const favId = `rent-${product.id}`
    const favorites = wx.getStorageSync('favorites') || []
    const isCollected = favorites.some(it => it.id === favId)
    this.setData({ collected: isCollected })
  },

  // 加载评价数据（评论功能暂时关闭）
  // loadReviews(productId) {
  //   // 评论系统待开发
  // },

  // 返回
  goBack() {
    // 优先关闭打开的弹窗
    if (this.data.showCalendar) {
      this.closeCalendar()
      return
    }
    if (this.data.showRentalSheet) {
      this.closeRentalSheet()
      return
    }
    // 如果没有弹窗，则返回上一页
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果无法返回（页面栈为空），则跳转到首页
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }
    })
  },

  // 切换图片
  onImageChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  // 切换Tab
  onTabChange(e) {
    this.setData({
      currentTab: Number(e.currentTarget.dataset.index)
    })
  },

  // 选择租期
  onRentalOptionTap(e) {
    this.setData({
      selectedRentalIndex: Number(e.currentTarget.dataset.index)
    })
  },

  // 立即租赁 - 打开滑窗
  onRentNow() {
    // 获取用户城市，设置默认取货地点
    const userCity = wx.getStorageSync('cityName') || '南安普顿'
    const cityToStoreMap = {
      '伦敦': 0,
      '南安普顿': 1,
      '格拉斯哥': 2,
      '爱丁堡': 3
    }
    const defaultPickupIndex = cityToStoreMap[userCity] !== undefined ? cityToStoreMap[userCity] : 1
    
    // 只在第一次打开时初始化，之后保持用户选择的值
    this.setData({
      showRentalSheet: true,
      selectedPickupIndex: defaultPickupIndex
    })
    
    // 如果已有日期选择，则计算价格
    if (this.data.rentalStartDate && this.data.rentalEndDate) {
      this.calculateTotalPrice()
    }
  },

  // 关闭滑窗
  closeRentalSheet() {
    this.setData({
      showRentalSheet: false
    })
  },

  // 选择取货地点
  onPickupLocationChange(e) {
    this.setData({
      selectedPickupIndex: Number(e.detail.value)
    })
  },

  // 选择租赁开始日期
  onStartDateChange(e) {
    const startDate = e.detail.value
    const endDate = this.data.rentalEndDate
    
    // 如果开始日期晚于结束日期，自动调整结束日期为开始日期+1天
    if (startDate >= endDate) {
      const nextDay = new Date(startDate)
      nextDay.setDate(nextDay.getDate() + 1)
      const newEndDate = nextDay.toISOString().split('T')[0]
      this.setData({
        rentalStartDate: startDate,
        rentalEndDate: newEndDate
      })
    } else {
      this.setData({
        rentalStartDate: startDate
      })
    }
    
    this.calculateRentalDays()
  },

  // 选择租赁结束日期
  onEndDateChange(e) {
    const endDate = e.detail.value
    const startDate = this.data.rentalStartDate
    
    // 结束日期必须晚于开始日期
    if (endDate <= startDate) {
      wx.showToast({ title: '结束日期必须晚于开始日期', icon: 'none' })
      return
    }
    
    this.setData({
      rentalEndDate: endDate
    })
    
    this.calculateRentalDays()
  },

  // 计算租赁天数
  calculateRentalDays() {
    const { rentalStartDate, rentalEndDate } = this.data
    if (!rentalStartDate || !rentalEndDate) return
    
    const start = new Date(rentalStartDate)
    const end = new Date(rentalEndDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    this.setData({
      rentalDays: diffDays
    })
    
    this.calculateTotalPrice()
  },

  // 切换付费配件
  onAccessoryToggle(e) {
    const index = e.currentTarget.dataset.index
    const accessories = this.data.extraAccessories
    accessories[index].selected = !accessories[index].selected
    
    this.setData({
      extraAccessories: accessories
    })
    
    this.calculateTotalPrice()
  },

  // 计算总价
  calculateTotalPrice() {
    const days = this.data.rentalDays
    const selectedOption = this.data.rentalOptions[this.data.selectedRentalIndex]
    let basePrice = selectedOption.price * days
    
    // 计算配件价格
    let accessoryPrice = 0
    this.data.extraAccessories.forEach(item => {
      if (item.selected) {
        accessoryPrice += item.price * days
      }
    })
    
    const totalPrice = basePrice + accessoryPrice
    
    this.setData({
      totalPrice: totalPrice
    })
  },

  // 下一步
  onNextStep() {
    const { 
      selectedPickupIndex, 
      pickupLocations, 
      rentalStartDate, 
      rentalEndDate, 
      rentalDays, 
      totalPrice,
      extraAccessories,
      product,
      rentalOptions,
      selectedRentalIndex
    } = this.data
    
    if (!rentalStartDate || !rentalEndDate) {
      return wx.showToast({ title: '请选择租赁时间', icon: 'none' })
    }
    
    // 获取选中的配件
    const selectedAccessories = extraAccessories.filter(item => item.selected)
    
    // 计算基础价格（不含配件）
    const basePrice = rentalOptions[selectedRentalIndex].price
    
    // 准备订单数据
    const orderData = {
      productId: product.id || product._id,
      productName: product.name,
      productSubtitle: product.subtitle || product.subCategory,
      productImage: product.images[0],
      mainCategory: product.mainCategory || '摄影',  // 🔑 添加一级分类
      subCategory: product.subCategory || 'CCD',      // 🔑 添加二级分类
      pickupLocation: pickupLocations[selectedPickupIndex],
      selectedPickupIndex: selectedPickupIndex,
      rentalStartDate: rentalStartDate,
      rentalEndDate: rentalEndDate,
      rentalDays: rentalDays,
      basePrice: basePrice,
      accessories: selectedAccessories,
      deposit: product.deposit,
      totalPrice: totalPrice
    }
    
    // 关闭滑窗
    this.closeRentalSheet()
    
    // 跳转到确认订单页面
    wx.navigateTo({
      url: `/pages/rental/confirm?data=${encodeURIComponent(JSON.stringify(orderData))}`
    })
  },

  // 收藏/取消收藏（与商品收藏一致）
  onToggleCollect() {
    const { product, collected } = this.data
    const favId = `rent-${product.id}`
    const favorites = wx.getStorageSync('favorites') || []

    if (collected) {
      const next = favorites.filter(i => i.id !== favId)
      wx.setStorageSync('favorites', next)
      this.setData({ collected: false })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      const item = {
        id: favId,
        bizId: product.id,
        type: 'rental',
        title: product.name,
        image: product.images && product.images[0],
        price: this.data.rentalOptions[this.data.selectedRentalIndex].price,
        currency: '£',
        publisher: '兰拓科技 IRENTALS',
        status: 'valid',
        favTime: Date.now()
      }
      favorites.unshift(item)
      wx.setStorageSync('favorites', favorites)
      this.setData({ collected: true })
      wx.showToast({ title: '已收藏', icon: 'success' })
    }
  },

  // ============ 日历选择器相关方法 ============
  
  // 打开日历
  openCalendar() {
    const today = new Date()
    this.setData({
      showCalendar: true,
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1,
      calendarStartDate: this.data.rentalStartDate || '',
      calendarEndDate: this.data.rentalEndDate || '',
      selectingStartDate: true
    })
    this.generateCalendar()
  },

  // 关闭日历
  closeCalendar() {
    this.setData({
      showCalendar: false
    })
  },

  // 上一月
  prevMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
    this.setData({
      currentYear,
      currentMonth
    })
    this.generateCalendar()
  },

  // 下一月
  nextMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    this.setData({
      currentYear,
      currentMonth
    })
    this.generateCalendar()
  },

  // 生成日历数据
  generateCalendar() {
    const { currentYear, currentMonth, calendarStartDate, calendarEndDate } = this.data
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    const daysInMonth = lastDay.getDate()
    const firstDayOfWeek = firstDay.getDay()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const days = []
    
    // 上个月的日期（填充）
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const date = new Date(currentYear, currentMonth - 2, day)
      days.push({
        day,
        date: this.formatDate(date),
        isOtherMonth: true,
        isPast: date < today
      })
    }
    
    // 当前月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth - 1, i)
      const dateStr = this.formatDate(date)
      const isToday = date.getTime() === today.getTime()
      const isStart = dateStr === calendarStartDate
      const isEnd = dateStr === calendarEndDate
      const isInRange = calendarStartDate && calendarEndDate && dateStr > calendarStartDate && dateStr < calendarEndDate
      
      days.push({
        day: i,
        date: dateStr,
        isOtherMonth: false,
        isToday,
        isStart,
        isEnd,
        isInRange,
        isPast: date < today
      })
    }
    
    // 下个月的日期（填充到6行）
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentYear, currentMonth, i)
      days.push({
        day: i,
        date: this.formatDate(date),
        isOtherMonth: true,
        isPast: date < today
      })
    }
    
    this.setData({
      calendarDates: days
    })
  },

  // 日期点击
  onDateTap(e) {
    const { date } = e.currentTarget.dataset
    const { calendarStartDate, calendarEndDate, selectingStartDate } = this.data
    
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 不能选择过去的日期
    if (selectedDate < today) {
      wx.showToast({ title: '不能选择过去的日期', icon: 'none' })
      return
    }
    
    // 选择逻辑：先选开始，再选结束
    if (!calendarStartDate || (calendarStartDate && calendarEndDate)) {
      // 重新开始选择
      this.setData({
        calendarStartDate: date,
        calendarEndDate: '',
        calendarDays: 0,
        selectingStartDate: false
      })
    } else {
      // 选择结束日期
      if (date <= calendarStartDate) {
        wx.showToast({ title: '归还日期必须晚于取货日期', icon: 'none' })
        return
      }
      
      // 计算天数
      const start = new Date(calendarStartDate)
      const end = new Date(date)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      this.setData({
        calendarEndDate: date,
        calendarDays: diffDays,
        selectingStartDate: true
      })
    }
    
    this.generateCalendar()
  },

  // 确认日历选择
  confirmCalendar() {
    const { calendarStartDate, calendarEndDate } = this.data
    
    if (!calendarStartDate || !calendarEndDate) {
      wx.showToast({ title: '请选择完整的租赁时间段', icon: 'none' })
      return
    }
    
    const start = new Date(calendarStartDate)
    const end = new Date(calendarEndDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    this.setData({
      rentalStartDate: calendarStartDate,
      rentalEndDate: calendarEndDate,
      rentalDays: diffDays,
      showCalendar: false
    })
    
    this.calculateTotalPrice()
  },

  // 重置日历选择
  resetCalendar() {
    this.setData({
      calendarStartDate: '',
      calendarEndDate: '',
      calendarDays: 0,
      rentalStartDate: '',
      rentalEndDate: '',
      rentalDays: 0,
      selectingStartDate: true
    })
    this.generateCalendar()
    wx.showToast({ title: '已重置选择', icon: 'success', duration: 1500 })
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})

