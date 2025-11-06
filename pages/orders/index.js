Page({
  data: {
    // 状态栏和导航栏高度
    statusBarHeight: 0,
    navBarHeight: 44,
    totalNavHeight: 0,
    
    // 租赁订单筛选
    rentFilters: ['全部','待支付','待取件','租赁中','检查中','已完成'],
    currentFilter: '',
    filterScrollLeft: 0,
    orders: [],
    
    // 订单数量统计
    allOrderCount: 0,
    pendingOrderCount: 0,
    pickupOrderCount: 0,
    rentingOrderCount: 0,
    checkingOrderCount: 0,
    completedOrderCount: 0,
    
    // 滑动切换相关
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    isSwiping: false,
    swipeOffset: 0,
    swipeOpacity: 1,
    swipeTransition: ''
  },
  // 工具：日期加天
  addDays(dateObj, days) {
    const d = new Date(dateObj)
    d.setDate(d.getDate() + Number(days))
    return d
  },
  // 工具：格式化日期 YYYY-MM-DD
  formatDate(dateObj) {
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },
  // 工具：格式化时间 YYYY-MM-DD HH:mm
  formatDateTime(dateObj) {
    const h = String(dateObj.getHours()).padStart(2, '0')
    const mi = String(dateObj.getMinutes()).padStart(2, '0')
    return `${this.formatDate(dateObj)} ${h}:${mi}`
  },
  // 工具：格式化为完整日期时间（年月日 + 营业时间）
  formatFullDateTime(dateStr, storeHours = '8:00-18:00') {
    if (!dateStr) return ''
    
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    return `${year}年${month}月${day}日 ${storeHours}`
  },
  onLoad(options) {
    // 获取系统信息，计算导航栏高度
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = 44
    const totalNavHeight = statusBarHeight + navBarHeight
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      totalNavHeight
    })
    
    // 如果有筛选参数，自动选中对应的筛选状态
    if (options && options.filter) {
      const filter = decodeURIComponent(options.filter)
      this.setData({ currentFilter: filter })
      
      // 延迟滚动到对应的筛选项
      setTimeout(() => {
        const index = this.data.rentFilters.indexOf(filter)
        if (index > 0) {
          this.scrollFilterToIndex(index)
        }
      }, 100)
    }
    
    // 加载订单统计和订单列表
    this.loadOrderStats()
    this.loadOrders()
  },
  onShow() {
    // 每次显示页面时重新加载订单统计和订单列表
    this.loadOrderStats()
    this.loadOrders()
  },
  // 🌟 加载订单统计数据
  async loadOrderStats() {
    console.log('📊 开始加载订单统计数据...')
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderStats',
        data: {}
      })
      
      if (res.result.success) {
        const stats = res.result.data
        this.setData({
          allOrderCount: stats.allOrderCount || 0,
          pendingOrderCount: stats.pendingOrderCount || 0,
          pickupOrderCount: stats.pickupOrderCount || 0,
          rentingOrderCount: stats.rentingOrderCount || 0,
          checkingOrderCount: stats.checkingOrderCount || 0,
          completedOrderCount: stats.completedOrderCount || 0
        })
        
        console.log('✅ 订单统计加载成功:', stats)
      } else {
        console.log('⚠️ 订单统计获取失败')
      }
    } catch (error) {
      console.error('❌ 调用 getOrderStats 云函数失败:', error)
      // 失败时使用默认值 0
      this.setData({
        allOrderCount: 0,
        pendingOrderCount: 0,
        pickupOrderCount: 0,
        rentingOrderCount: 0,
        checkingOrderCount: 0,
        completedOrderCount: 0
      })
    }
  },
  // 🌟 加载订单列表（云端化）
  async loadOrders() {
    const { currentFilter } = this.data
    
    console.log('📋 开始加载订单列表...')
    console.log('  当前筛选:', currentFilter || '全部')
    
    wx.showLoading({ title: '加载中...', mask: true })
    
    try {
      // ☁️ 调用云函数获取订单列表
      const res = await wx.cloud.callFunction({
        name: 'getOrders',
        data: {
          status: currentFilter || '全部',
          page: 1,
          pageSize: 100
        }
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        let orders = res.result.data || []
        
        console.log('✅ 加载成功！共', orders.length, '条订单')
        
        // 🔧 如果没有云端订单，不再使用本地测试数据，直接显示空列表
        if (orders.length === 0) {
          console.log('⚠️ 云端暂无订单，显示空列表')
          this.setData({ orders: [] })
          return
        }
        
        // 注释掉本地测试数据，以下代码已禁用
        /*
        if (false) {
          console.log('⚠️ 云端暂无订单，使用本地测试数据（已禁用）')
          const today = new Date()
        const demoOrders = [
          {
            orderId: `DEMO${Date.now()}_1`,
            orderType: 'rental',
            status: 'picked', // 租赁中
            payTime: this.formatDateTime(today),
            pickTime: this.formatDateTime(today),
            storeName: '南安普顿门店',
            storePhone: '023 8012 3456',
            storeAddress: '45 High Street, Southampton',
            storePostcode: 'SO14 2AE',
            productId: 'r1',
            productName: 'Sony A7 III 全画幅相机',
            productSubtitle: '标准变焦镜头套装',
            productImage: '/static/placeholder/p1.png',
            rentalStartDate: this.formatDate(today),
            rentalEndDate: this.formatDate(this.addDays(today, 3)),
            rentalDays: 3,
            pickupLocation: '南安普顿店',
            accessories: [],
            equipmentPrice: 60,
            accessoriesPrice: 0,
            totalPrice: 60,
            deposit: 100,
            totalAmount: 160,
            note: ''
          },
          {
            orderId: `DEMO${Date.now()}_2`,
            orderType: 'rental',
            status: 'paid', // 待取件
            payTime: this.formatDateTime(this.addDays(today, -1)),
            storeName: '伦敦门店',
            storePhone: '020 1234 5678',
            storeAddress: '123 Oxford Street, London',
            storePostcode: 'W1D 1BS',
            productId: 'r2',
            productName: 'Canon EOS R5 相机',
            productSubtitle: '专业拍摄',
            productImage: '/static/placeholder/p2.png',
            rentalStartDate: this.formatDate(this.addDays(today, 1)),
            rentalEndDate: this.formatDate(this.addDays(today, 4)),
            rentalDays: 3,
            pickupLocation: '伦敦店',
            accessories: [],
            equipmentPrice: 90,
            accessoriesPrice: 0,
            totalPrice: 90,
            deposit: 150,
            totalAmount: 240,
            note: ''
          },
          {
            orderId: `DEMO${Date.now()}_3`,
            orderType: 'rental',
            status: 'checking', // 检查中
            payTime: this.formatDateTime(this.addDays(today, -7)),
            pickTime: this.formatDateTime(this.addDays(today, -6)),
            returnTime: this.formatDateTime(this.addDays(today, -1)),
            storeName: '格拉斯哥门店',
            storePhone: '0141 234 5678',
            storeAddress: '78 Buchanan Street, Glasgow',
            storePostcode: 'G1 3HL',
            productId: 'r3',
            productName: 'DJI Mini 3 Pro 无人机',
            productSubtitle: '航拍套装',
            productImage: '/static/placeholder/p3.png',
            rentalStartDate: this.formatDate(this.addDays(today, -6)),
            rentalEndDate: this.formatDate(this.addDays(today, -1)),
            rentalDays: 5,
            pickupLocation: '格拉斯哥店',
            accessories: [],
            equipmentPrice: 100,
            accessoriesPrice: 0,
            totalPrice: 100,
            deposit: 200,
            totalAmount: 300,
            note: ''
          },
          {
            orderId: `DEMO${Date.now()}_4`,
            orderType: 'rental',
            status: 'completed', // 已完成
            payTime: this.formatDateTime(this.addDays(today, -15)),
            pickTime: this.formatDateTime(this.addDays(today, -14)),
            returnTime: this.formatDateTime(this.addDays(today, -10)),
            checkTime: this.formatDateTime(this.addDays(today, -9)),
            completeTime: this.formatDateTime(this.addDays(today, -8)),
            storeName: '爱丁堡门店',
            storePhone: '0131 234 5678',
            storeAddress: '56 Princes Street, Edinburgh',
            storePostcode: 'EH2 2YJ',
            productId: 'r4',
            productName: 'GoPro Hero 11 运动相机',
            productSubtitle: '极限运动',
            productImage: '/static/placeholder/p1.png',
            rentalStartDate: this.formatDate(this.addDays(today, -14)),
            rentalEndDate: this.formatDate(this.addDays(today, -10)),
            rentalDays: 4,
            pickupLocation: '爱丁堡店',
            accessories: [],
            equipmentPrice: 80,
            accessoriesPrice: 0,
            totalPrice: 80,
            deposit: 120,
            totalAmount: 200,
            note: ''
          },
          {
            orderId: `DEMO${Date.now()}_5`,
            orderType: 'rental',
            status: 'pending', // 待支付
            storeName: '南安普顿门店',
            storePhone: '023 8012 3456',
            storeAddress: '45 High Street, Southampton',
            storePostcode: 'SO14 2AE',
            productId: 'r5',
            productName: 'Nikon Z6 II 相机',
            productSubtitle: '全能型',
            productImage: '/static/placeholder/p2.png',
            rentalStartDate: this.formatDate(this.addDays(today, 2)),
            rentalEndDate: this.formatDate(this.addDays(today, 5)),
            rentalDays: 3,
            pickupLocation: '南安普顿店',
            accessories: [],
            equipmentPrice: 75,
            accessoriesPrice: 0,
            totalPrice: 75,
            deposit: 130,
            totalAmount: 205,
            note: '',
            paymentStatus: 'unpaid'
          },
          {
            orderId: `DEMO${Date.now()}_6`,
            orderType: 'rental',
            status: 'picked', // 租赁中
            payTime: this.formatDateTime(this.addDays(today, -2)),
            pickTime: this.formatDateTime(this.addDays(today, -1)),
            storeName: '伦敦门店',
            storePhone: '020 1234 5678',
            storeAddress: '123 Oxford Street, London',
            storePostcode: 'W1D 1BS',
            productId: 'r6',
            productName: 'Fujifilm X-T5 无反相机',
            productSubtitle: '街拍利器',
            productImage: '/static/placeholder/p3.png',
            rentalStartDate: this.formatDate(this.addDays(today, -1)),
            rentalEndDate: this.formatDate(this.addDays(today, 5)),
            rentalDays: 6,
            pickupLocation: '伦敦店',
            accessories: [],
            equipmentPrice: 120,
            accessoriesPrice: 0,
            totalPrice: 120,
            deposit: 180,
            totalAmount: 300,
            note: ''
          },
          {
            orderId: `DEMO${Date.now()}_7`,
            orderType: 'rental',
            status: 'picked', // 租赁中
            payTime: this.formatDateTime(this.addDays(today, -3)),
            pickTime: this.formatDateTime(this.addDays(today, -2)),
            storeName: '格拉斯哥门店',
            storePhone: '0141 234 5678',
            storeAddress: '78 Buchanan Street, Glasgow',
            storePostcode: 'G1 3HL',
            productId: 'r7',
            productName: 'MacBook Pro 16寸 M3 Max',
            productSubtitle: '顶级性能',
            productImage: '/static/placeholder/p1.png',
            rentalStartDate: this.formatDate(this.addDays(today, -2)),
            rentalEndDate: this.formatDate(this.addDays(today, 7)),
            rentalDays: 9,
            pickupLocation: '格拉斯哥店',
            accessories: [],
            equipmentPrice: 270,
            accessoriesPrice: 0,
            totalPrice: 270,
            deposit: 400,
            totalAmount: 670,
            note: ''
          },
          {
            orderId: `DEMO${Date.now()}_8`,
            orderType: 'rental',
            status: 'picked', // 租赁中
            payTime: this.formatDateTime(this.addDays(today, -1)),
            pickTime: this.formatDateTime(today),
            storeName: '爱丁堡门店',
            storePhone: '0131 234 5678',
            storeAddress: '56 Princes Street, Edinburgh',
            storePostcode: 'EH2 2YJ',
            productId: 'r8',
            productName: 'Insta360 X3 全景相机',
            productSubtitle: '运动记录',
            productImage: '/static/placeholder/p2.png',
            rentalStartDate: this.formatDate(today),
            rentalEndDate: this.formatDate(this.addDays(today, 4)),
            rentalDays: 4,
            pickupLocation: '爱丁堡店',
            accessories: [],
            equipmentPrice: 80,
            accessoriesPrice: 0,
            totalPrice: 80,
            deposit: 150,
            totalAmount: 230,
            note: ''
          }
        ]
        
        orders = demoOrders
      } */
      
      // 📊 格式化订单数据
      let formattedOrders = orders.map(order => {
        // 根据订单状态决定显示的时间信息
        let timeLabel = ''
        let timeValue = ''
        const storeHours = '8:00-18:00' // 默认营业时间
        
        switch(order.status) {
          case 'pending': // 待支付
            timeLabel = '预约时间'
            timeValue = this.formatFullDateTime(order.rentalStartDate, storeHours)
            break
          case 'paid': // 待取件
            timeLabel = '取货时间'
            timeValue = this.formatFullDateTime(order.rentalStartDate, storeHours)
            break
          case 'picked': // 租赁中
            timeLabel = '归还时间'
            timeValue = this.formatFullDateTime(order.rentalEndDate, storeHours)
            break
          case 'returning': // 归还中
            timeLabel = '归还时间'
            timeValue = this.formatFullDateTime(order.rentalEndDate, storeHours)
            break
          case 'checking': // 检查中
            timeLabel = '归还时间'
            timeValue = this.formatFullDateTime(order.rentalEndDate, storeHours)
            break
          case 'completed': // 已完成
            timeLabel = '完成时间'
            // 已完成订单显示完成的具体日期时间，不需要时间段
            if (order.completeTime) {
              timeValue = order.completeTime
            } else {
              timeValue = this.formatFullDateTime(order.rentalEndDate, storeHours)
            }
            break
          default:
            timeLabel = '预约时间'
            timeValue = this.formatFullDateTime(order.rentalStartDate, storeHours)
        }
        
        return {
          id: order.orderId,
          orderId: order.orderId,  // 📋 订单编号（用于显示）
          shop: order.storeName || order.pickupLocation || '租赁商品',
          storeAddress: order.storeAddress || '',
          status: this.getOrderStatusText(order.status),
          title: order.productName,
          image: order.productImage || '/static/placeholder/p1.png',
          amount: (order.totalAmount || 0).toFixed(2),
          rawStatus: order.status,
          paymentStatus: order.paymentStatus || (order.status === 'pending' ? 'unpaid' : 'paid'),
          type: order.type || 'rent',
          timeLabel: timeLabel,
          timeValue: timeValue
        }
      })
      // 按筛选状态过滤（默认全部）
      if (currentFilter && currentFilter !== '全部') {
        formattedOrders = formattedOrders.filter(it => it.status === currentFilter)
      }
      
      this.setData({ orders: formattedOrders })
      
      console.log('📊 显示订单数:', formattedOrders.length)
      
      } else {
        throw new Error(res.result?.message || '加载订单失败')
      }
      
    } catch (err) {
      console.error('❌ 加载订单失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
      this.setData({ orders: [] })
    }
  },
  // 获取订单状态文本
  getOrderStatusText(status) {
    const statusMap = {
      'pending': '待支付',
      'paid': '待取件',
      'picked': '租赁中',
      'returning': '归还中',
      'checking': '检查中',
      'completed': '已完成'
    }
    return statusMap[status] || status
  },
  goBack() { wx.navigateBack() },
  
  onFilterTap(e) {
    const key = e.currentTarget.dataset.key
    const index = e.currentTarget.dataset.index || 0
    
    this.setData({ currentFilter: key === '全部' ? '' : key })
    this.loadOrders()
    
    // 延迟执行滚动，确保 DOM 已更新
    setTimeout(() => {
      const query = wx.createSelectorQuery().in(this)
      query.select('.filters-container').scrollOffset()
      query.select('.filters-container').boundingClientRect()
      query.selectAll('.filter').boundingClientRect()
      query.exec((res) => {
        if (res && res[0] && res[1] && res[2] && res[2][index]) {
          const scrollLeft = res[0].scrollLeft
          const containerLeft = res[1].left
          const containerWidth = res[1].width
          const itemRect = res[2][index]
          const itemLeft = itemRect.left
          const itemWidth = itemRect.width
          
          // 计算目标滚动位置：让选中项居中
          const targetScrollLeft = scrollLeft + (itemLeft - containerLeft) - (containerWidth - itemWidth) / 2
          
          this.setData({
            filterScrollLeft: Math.max(0, targetScrollLeft)
          })
        }
      })
    }, 50)
  },
  // 订单操作按钮点击
  async onOrderAction(e) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.orders.find(item => item.id === orderId)
    
    if (!order) return
    
    // 待支付订单：跳转到确认订单页面（可以支付）
    if (order.rawStatus === 'pending') {
      console.log('💳 待支付订单，跳转到确认页面')
      console.log('  订单ID:', orderId)
      
      // 先从云端获取完整的订单数据
      wx.showLoading({ title: '加载中...', mask: true })
      
      try {
        const res = await wx.cloud.callFunction({
          name: 'getOrderDetail',
          data: { orderId: orderId }
        })
        
        wx.hideLoading()
        
        if (res.result && res.result.success) {
          const orderData = res.result.data
          console.log('✅ 获取订单数据成功:', orderData)
          
          // 构建传递给确认页面的数据（使用已有价格）
          const confirmData = {
            orderId: orderData.orderId,
            productId: orderData.productId,
            productName: orderData.productName,
            productImage: orderData.productImage,
            mainCategory: orderData.mainCategory,
            subCategory: orderData.subCategory,
            rentalStartDate: orderData.rentalStartDate,
            rentalEndDate: orderData.rentalEndDate,
            rentalDays: orderData.rentalDays,
            pickupLocation: orderData.pickupLocation,
            accessories: orderData.accessories || [],
            equipmentPrice: orderData.totalRent || 0,
            accessoriesPrice: orderData.accessoryFee || 0,
            totalPrice: (orderData.totalRent || 0) + (orderData.accessoryFee || 0) - (orderData.couponDiscount || 0),
            deposit: orderData.deposit || 0,
            totalAmount: orderData.totalAmount || 0,
            storeName: orderData.storeName,
            storeAddress: orderData.storeAddress,
            storePhone: orderData.storePhone,
            storePostcode: orderData.storePostcode,
            couponId: orderData.couponId,
            couponDiscount: orderData.couponDiscount || 0
          }
          
          console.log('📦 传递给确认页面的数据:', confirmData)
          
          // 跳转到确认页面
          wx.navigateTo({
            url: `/pages/rental/confirm?data=${encodeURIComponent(JSON.stringify(confirmData))}&isRepay=true`
          })
        } else {
          throw new Error(res.result?.message || '获取订单数据失败')
        }
      } catch (error) {
        console.error('❌ 获取订单数据失败:', error)
        wx.hideLoading()
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      }
    } else {
      // 其他状态订单：跳转到订单详情页面（只读）
      wx.navigateTo({
        url: `/pages/rental/order-detail?orderId=${orderId}`
      })
    }
  },

  // 触摸开始
  onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      this.setData({
        touchStartX: e.touches[0].pageX,
        touchStartY: e.touches[0].pageY,
        touchStartTime: Date.now(),
        isSwiping: false,
        swipeTransition: '' // 清除过渡动画，实现跟手效果
      })
    }
  },

  // 触摸移动 - iOS风格跟手效果
  onTouchMove(e) {
    if (!e.touches || e.touches.length === 0) return
    
    const touchX = e.touches[0].pageX
    const touchY = e.touches[0].pageY
    const deltaX = touchX - this.data.touchStartX
    const deltaY = touchY - this.data.touchStartY
    
    // 判断是否开始水平滑动
    if (!this.data.isSwiping && Math.abs(deltaX) > 10) {
      // 确保是水平滑动
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        this.setData({ isSwiping: true })
      }
    }
    
    // 如果正在进行水平滑动，实现跟手效果
    if (this.data.isSwiping) {
      // 添加阻尼效果：滑动距离越大，阻力越大
      const damping = 0.4 // 阻尼系数，值越小阻力越大
      const offset = deltaX * damping
      
      // 计算透明度：滑动时轻微降低透明度，营造层次感
      const maxOffset = 100
      const opacityChange = Math.min(Math.abs(offset) / maxOffset, 0.15)
      const opacity = 1 - opacityChange
      
      this.setData({
        swipeOffset: offset,
        swipeOpacity: opacity,
        swipeTransition: '' // 跟手时不需要过渡
      })
    }
  },

  // 触摸结束 - iOS风格弹性动画
  onTouchEnd(e) {
    if (!e.changedTouches || e.changedTouches.length === 0) {
      // 重置状态
      this.resetSwipeState()
      return
    }
    
    const touchEndX = e.changedTouches[0].pageX
    const touchEndY = e.changedTouches[0].pageY
    const touchEndTime = Date.now()
    
    const deltaX = touchEndX - this.data.touchStartX
    const deltaY = touchEndY - this.data.touchStartY
    const deltaTime = touchEndTime - this.data.touchStartTime
    
    // 判断是否为有效滑动
    const minSwipeDistance = 50
    const isHorizontalSwipe = this.data.isSwiping && 
                              Math.abs(deltaX) > minSwipeDistance && 
                              Math.abs(deltaX) > Math.abs(deltaY) * 1.5
    const isFastSwipe = deltaTime < 300
    
    if (isHorizontalSwipe && isFastSwipe) {
      const { rentFilters, currentFilter } = this.data
      const currentIndex = rentFilters.findIndex(f => {
        if (currentFilter === '' || currentFilter === '全部') {
          return f === '全部'
        }
        return f === currentFilter
      })
      
      let newIndex = currentIndex
      
      // 向右滑动 -> 切换到前一个状态
      if (deltaX > 0) {
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
      } 
      // 向左滑动 -> 切换到后一个状态
      else {
        newIndex = currentIndex < rentFilters.length - 1 ? currentIndex + 1 : currentIndex
      }
      
      // 切换到新状态
      if (newIndex !== currentIndex) {
        // iOS风格的滑出动画
        const slideOutDirection = deltaX > 0 ? 150 : -150
        this.setData({
          swipeTransition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          swipeOffset: slideOutDirection,
          swipeOpacity: 0
        })
        
        // 延迟切换内容，营造页面切换效果
        setTimeout(() => {
          const newFilter = rentFilters[newIndex]
          this.setData({ 
            currentFilter: newFilter === '全部' ? '' : newFilter,
            swipeOffset: -slideOutDirection * 0.3, // 从反方向滑入
            swipeOpacity: 0,
            swipeTransition: ''
          })
          this.loadOrders()
          
          // 滚动筛选栏到选中位置
          this.scrollFilterToIndex(newIndex)
          
          // 震动反馈
          wx.vibrateShort({ type: 'light' })
          
          // 滑入动画
          setTimeout(() => {
            this.setData({
              swipeTransition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              swipeOffset: 0,
              swipeOpacity: 1
            })
            
            // 显示提示
            wx.showToast({
              title: `${newFilter}`,
              icon: 'none',
              duration: 600
            })
          }, 50)
        }, 250)
      } else {
        // 已经是边界，弹性回弹
        this.bounceBack()
      }
    } else {
      // 不是有效滑动，弹性回弹
      this.bounceBack()
    }
  },

  // 弹性回弹动画
  bounceBack() {
    this.setData({
      swipeTransition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out',
      swipeOffset: 0,
      swipeOpacity: 1
    })
  },

  // 重置滑动状态
  resetSwipeState() {
    this.setData({
      isSwiping: false,
      swipeOffset: 0,
      swipeOpacity: 1,
      swipeTransition: ''
    })
  },

  // 滚动筛选栏到指定索引
  scrollFilterToIndex(index) {
    setTimeout(() => {
      const query = wx.createSelectorQuery().in(this)
      query.select('.filters-container').scrollOffset()
      query.select('.filters-container').boundingClientRect()
      query.selectAll('.filter').boundingClientRect()
      query.exec((res) => {
        if (res && res[0] && res[1] && res[2] && res[2][index]) {
          const scrollLeft = res[0].scrollLeft
          const containerLeft = res[1].left
          const containerWidth = res[1].width
          const itemRect = res[2][index]
          const itemLeft = itemRect.left
          const itemWidth = itemRect.width
          
          // 计算目标滚动位置：让选中项居中
          const targetScrollLeft = scrollLeft + (itemLeft - containerLeft) - (containerWidth - itemWidth) / 2
          
          this.setData({
            filterScrollLeft: Math.max(0, targetScrollLeft)
          })
        }
      })
    }, 50)
  }
})
