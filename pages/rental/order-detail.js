Page({
  data: {
    statusBarHeight: 0,
    orderId: '',
    
    // 🎫 取件码相关
    showQRCode: false, // 是否展开取件码
    qrcodeUrl: '', // 取件二维码URL
    
    // 🎫 归还码相关
    showReturnQRCode: false, // 是否展开归还码
    returnQrcodeUrl: '', // 归还二维码URL
    
    // 🔄 续租相关
    showRenewModal: false, // 是否显示续租日历
    renewEndDate: '', // 续租结束日期
    minRenewDate: '', // 最小可选日期（当前结束日期+1天）
    renewDays: 0, // 续租天数
    renewPrice: 0, // 续租费用
    dailyRate: 0, // 每日租金
    
    // 日历相关
    currentYear: 2025,
    currentMonth: 11,
    calendarDates: [], // 日历日期数组
    
    // 门店信息
    storeName: '',
    storePhone: '',
    storeAddress: '',
    storePostcode: '',
    storeHours: '10:00-19:30',
    
    // 商品信息
    productId: '',
    productName: '',
    productSubtitle: '',
    productImage: '',
    mainCategory: '', // 一级分类
    subCategory: '', // 二级分类
    
    // 租赁信息
    rentalStartDate: '',
    rentalEndDate: '',
    rentalDays: 0,
    pickupLocation: '',
    
    // 配件信息
    selectedAccessories: [],
    accessoriesText: '',
    
    // 价格信息
    equipmentPrice: 0,
    accessoriesPrice: 0,
    totalPrice: 0,
    deposit: 0,
    totalAmount: 0,
    
    // 🎟️ 优惠券信息
    couponId: null,
    couponDiscount: 0,
    
    // 备注
    note: '',
    
    // 订单状态
    orderStatus: '',
    orderStatusText: '',
    
    // 订单时间信息
    createTime: '',
    payTime: '',
    
    // 进度条
    currentStep: 1,
    progressSteps: [],
    
    // 取消订单相关
    showCancelReasonSheet: false,
    cancelReasons: [
      '我有事去不了了',
      '不想租了',
      '找到其他更便宜的',
      '商品信息不符',
      '其他原因'
    ],
    selectedCancelReason: ''
  },

  onLoad(options) {
    // 获取系统信息
    try {
      const w = wx.getWindowInfo()
      this.setData({ statusBarHeight: w.statusBarHeight })
    } catch(e) {
      this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 0 })
    }

    // 加载订单数据
    if (options.orderId) {
      this.setData({ orderId: options.orderId })
      this.loadOrderData(options.orderId)
    }
  },

  // 🌟 加载订单数据（云端化）
  async loadOrderData(orderId) {
    console.log('📋 开始加载订单详情:', orderId)
    
    wx.showLoading({ title: '加载中...', mask: true })
    
    try {
      // ☁️ 调用云函数获取订单详情
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: orderId }
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (!res.result || !res.result.success) {
        throw new Error(res.result?.message || '订单不存在')
      }
      
      const order = res.result.data
      console.log('✅ 订单加载成功:', order.orderId)
      
      // 🔍 调试：输出云函数返回的原始数据
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📦 云函数返回的订单数据:')
      console.log('  productName:', order.productName)
      console.log('  totalRent:', order.totalRent)
      console.log('  accessoryFee:', order.accessoryFee)
      console.log('  deposit:', order.deposit)
      console.log('  totalAmount:', order.totalAmount)
      console.log('  rentalStartDate:', order.rentalStartDate)
      console.log('  rentalEndDate:', order.rentalEndDate)
      console.log('  rentalDays:', order.rentalDays)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 获取订单状态文本（用于底部按钮）
    const statusTextMap = {
      'pending': '待支付',
      'paid': '待取件',
      'picked': '租赁中',
      'returning': '归还中',
      'checking': '检查中',
      'completed': '已完成'
    }
    const orderStatusText = statusTextMap[order.status] || '未知状态'

    // 当前所在步骤索引（-1 代表还未开始，第0步是取件）
    const statusIndexMap = {
      'pending': -1,
      'paid': 0,
      'picked': 1,
      'returning': 2,
      'checking': 3,
      'completed': 4
    }
    const currentIndex = statusIndexMap[order.status] ?? -1

    // 进度节点基础配置：每个节点的三态文案
    const stepConfigs = [
      { key: 'paid',      pending: '待取件', current: '取件中',   done: '已取件',   time: order.payTime || '' },
      { key: 'picked',    pending: '待租赁', current: '租赁中',   done: '已租赁',   time: order.pickTime || '' },
      { key: 'returning', pending: '待归还', current: '归还中',   done: '已归还',   time: order.returnTime || '' },
      { key: 'checking',  pending: '待检查', current: '检查中',   done: '已检查',   time: order.checkTime || '' },
      // 完成节点特殊：只有“未完成/已完成”两种
      { key: 'completed', pending: '未完成', current: '已完成',   done: '已完成',   time: order.completeTime || '' }
    ]

    // 根据 currentIndex 生成每个节点的显示名称
    const progressSteps = stepConfigs.map((cfg, idx) => {
      let name = cfg.pending
      if (currentIndex > idx) {
        // 之前的节点全部“已XX”
        name = cfg.done
      } else if (currentIndex === idx) {
        // 正在进行的节点为“XX中”；完成节点特殊：显示“已完成”
        name = cfg.current
      } else {
        // 之后的节点保持“待XX”；完成节点为“未完成”
        name = cfg.pending
      }
      return { id: idx + 1, name, time: cfg.time }
    })

    // 转换为用于样式判断的 currentStep（1..N；0 表示都未开始）
    const currentStep = Math.max(0, currentIndex + 1)
    
    // 计算日单价（器材/配件）
    const equipmentDaily = order.rentalDays > 0 ? (order.equipmentPrice || 0) / order.rentalDays : 0
    const accessoriesDaily = order.rentalDays > 0 ? (order.accessoriesPrice || 0) / order.rentalDays : 0

      // 计算实际租金小计（扣除优惠券后）
      const rentSubtotal = (order.totalRent || 0) + (order.accessoryFee || 0) - (order.couponDiscount || 0)
      
      // 格式化时间
      const formatTime = (timeObj) => {
        if (!timeObj) return ''
        const date = new Date(timeObj)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hour}:${minute}`
      }
      
      this.setData({
        storeName: order.storeName || order.pickupLocation || '租赁商品',
        storePhone: order.storePhone || '',
        storeAddress: order.storeAddress || '',
        storePostcode: order.storePostcode || 'SO14 2AE',
        productId: order.productId,
        productName: order.productName,
        productSubtitle: order.subCategory || '人文',
        productImage: order.productImage,
        mainCategory: order.mainCategory || '娱乐', // 一级分类
        subCategory: order.subCategory || '麻将', // 二级分类
        rentalStartDate: order.rentalStartDate,
        rentalEndDate: order.rentalEndDate,
        rentalDays: order.rentalDays,
        pickupLocation: order.pickupLocation,
        selectedAccessories: order.accessories || [],
        accessoriesText: (order.accessories || []).map(item => item.name).join('、') || '无',
        equipmentPrice: order.totalRent || 0,
        accessoriesPrice: order.accessoryFee || 0,
        totalPrice: rentSubtotal, // 🎟️ 扣除优惠券后的小计
        deposit: order.deposit,
        totalAmount: order.totalAmount,
        couponId: order.couponId || null, // 🎟️ 优惠券ID
        couponDiscount: order.couponDiscount || 0, // 🎟️ 优惠券优惠金额
        note: order.note || '',
        orderStatus: order.status,
        orderStatusText: orderStatusText,
        createTime: formatTime(order.createTime), // 📅 创建时间
        payTime: formatTime(order.payTime), // 📅 支付时间
        currentStep: currentStep,
        progressSteps: progressSteps
      })
      this.setData({
        showRenewBar: order.status === 'picked',
        equipmentDaily: Number(equipmentDaily.toFixed(2)),
        accessoriesDaily: Number(accessoriesDaily.toFixed(2))
      })
      
      // 🔍 调试：输出 setData 后的数据
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ setData 完成，检查页面数据:')
      console.log('  productName:', this.data.productName)
      console.log('  equipmentPrice:', this.data.equipmentPrice)
      console.log('  totalPrice:', this.data.totalPrice)
      console.log('  deposit:', this.data.deposit)
      console.log('  totalAmount:', this.data.totalAmount)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
      
    } catch (err) {
      console.error('❌ 加载订单详情失败:', err)
      wx.hideLoading()
      wx.showModal({
        title: '加载失败',
        content: err.message || '订单不存在或加载失败',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  // 一键续租
  onRenewTap() {
    // 预设续租天数选项
    const options = ['延长1天', '延长2天', '延长3天', '延长7天']
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const idx = res.tapIndex
        const days = [1,2,3,7][idx]
        if (!days) return
        const payAmount = Number(((this.data.equipmentDaily + this.data.accessoriesDaily) * days).toFixed(2))

        // 支付方式选择
        wx.showActionSheet({
          itemList: ['微信支付', '线下现金支付'],
          success: () => {
            // 更新本地订单数据
            this.extendOrder(days, payAmount)
          }
        })
      }
    })
  },

  // 延长订单并保存
  extendOrder(extendDays, payAmount) {
    try {
      const orders = wx.getStorageSync('rentalOrders') || []
      const idx = orders.findIndex(o => o.orderId === this.data.orderId)
      if (idx < 0) return
      const order = orders[idx]

      // 计算新结束日期
      const newEnd = this.addDays(order.rentalEndDate, extendDays)

      // 更新价格与天数
      const addEquip = Number((this.data.equipmentDaily * extendDays).toFixed(2))
      const addAcc = Number((this.data.accessoriesDaily * extendDays).toFixed(2))
      order.rentalEndDate = newEnd
      order.rentalDays = Number(order.rentalDays) + extendDays
      order.equipmentPrice = Number((order.equipmentPrice || 0) + addEquip)
      order.accessoriesPrice = Number((order.accessoriesPrice || 0) + addAcc)
      order.totalPrice = Number(order.equipmentPrice + (order.accessoriesPrice || 0))
      order.totalAmount = Number(order.totalPrice + (order.deposit || 0))

      // 保存
      orders[idx] = order
      wx.setStorageSync('rentalOrders', orders)

      // 更新当前页
      this.setData({
        rentalEndDate: order.rentalEndDate,
        rentalDays: order.rentalDays,
        equipmentPrice: order.equipmentPrice,
        accessoriesPrice: order.accessoriesPrice || 0,
        totalPrice: order.totalPrice,
        totalAmount: order.totalAmount
      })

      wx.showToast({ title: `续租成功，支付£${payAmount}`, icon: 'success' })
    } catch(e) {
      wx.showToast({ title: '续租失败', icon: 'none' })
    }
  },

  // 日期加天工具
  addDays(dateStr, days) {
    const d = new Date(dateStr.replace(/-/g,'/'))
    d.setDate(d.getDate() + Number(days))
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const da = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${da}`
  },

  // 💳 继续支付
  onPayNow() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💳 继续支付 - 开始')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const { 
      orderId,
      productId, productName, productImage,
      rentalStartDate, rentalEndDate, rentalDays,
      selectedAccessories,
      equipmentPrice, accessoriesPrice, totalPrice,
      deposit, totalAmount,
      storeName, storeAddress, storePhone, storePostcode,
      couponId, couponDiscount
    } = this.data
    
    // 🔍 调试：检查关键字段
    console.log('📋 检查关键数据字段:')
    console.log('  orderId:', orderId || '❌ 空')
    console.log('  productName:', productName || '❌ 空')
    console.log('  equipmentPrice:', equipmentPrice ?? '❌ 空')
    console.log('  totalPrice:', totalPrice ?? '❌ 空')
    console.log('  deposit:', deposit ?? '❌ 空')
    console.log('  totalAmount:', totalAmount ?? '❌ 空')
    console.log('  storeName:', storeName || '❌ 空')
    
    // 检查是否有缺失的必要字段
    if (!orderId || !productName || totalAmount === undefined) {
      console.error('❌ 关键数据缺失！')
      wx.showModal({
        title: '数据错误',
        content: '订单数据不完整，无法继续支付',
        showCancel: false
      })
      return
    }
    
    // 构建订单数据
    const orderData = {
      orderId: orderId,
      productId: productId,
      productName: productName,
      productImage: productImage,
      rentalStartDate: rentalStartDate,
      rentalEndDate: rentalEndDate,
      rentalDays: rentalDays,
      accessories: selectedAccessories || [],
      equipmentPrice: equipmentPrice || 0,
      accessoriesPrice: accessoriesPrice || 0,
      totalPrice: totalPrice || 0,
      deposit: deposit || 0,
      totalAmount: totalAmount || 0,
      storeName: storeName,
      storeAddress: storeAddress,
      storePhone: storePhone,
      storePostcode: storePostcode,
      couponId: couponId,
      couponDiscount: couponDiscount || 0
    }
    
    console.log('📦 构建的订单数据:', JSON.stringify(orderData, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 跳转到订单确认页面（重新支付）
    // 注意：参数名必须是 data，与 confirm.js 的 onLoad 中的 options.data 对应
    const url = `/pages/rental/confirm?data=${encodeURIComponent(JSON.stringify(orderData))}&isRepay=true`
    console.log('🔗 跳转 URL 长度:', url.length)
    
    wx.navigateTo({
      url: url,
      fail: (err) => {
        console.error('❌ 页面跳转失败:', err)
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        })
      }
    })
  },
  
  // 🚫 打开取消订单原因选择框
  openCancelSheet() {
    this.setData({ showCancelReasonSheet: true })
  },
  
  // 🚫 关闭取消订单原因选择框
  closeCancelSheet() {
    this.setData({ 
      showCancelReasonSheet: false,
      selectedCancelReason: ''
    })
  },
  
  // 🚫 选择取消原因
  onSelectCancelReason(e) {
    const reason = e.currentTarget.dataset.reason
    this.setData({ selectedCancelReason: reason })
    
    // 显示确认弹窗
    wx.showModal({
      title: '确认取消订单',
      content: `取消原因：${reason}\n\n确定要取消这个订单吗？`,
      confirmText: '确认取消',
      cancelText: '再想想',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          this.cancelOrder(reason)
        } else {
          // 用户点击"再想想"，关闭弹窗
          this.closeCancelSheet()
        }
      }
    })
  },
  
  // 🚫 取消订单（调用云函数）
  async cancelOrder(reason) {
    const { orderId, orderStatus } = this.data
    
    // 关闭原因选择框
    this.closeCancelSheet()
    
    // 检查订单状态
    if (orderStatus !== 'pending' && orderStatus !== 'paid') {
      wx.showToast({
        title: '当前订单状态不允许取消',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    wx.showLoading({ title: '取消中...', mask: true })
    
    try {
      console.log('🚫 开始取消订单...')
      console.log('  订单ID:', orderId)
      console.log('  取消原因:', reason)
      
      // 调用云函数取消订单
      const res = await wx.cloud.callFunction({
        name: 'cancelOrder',
        data: {
          orderId: orderId,
          cancelReason: reason
        }
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        console.log('✅ 订单取消成功（已删除）')
        
        // 确定跳转的筛选栏（根据原订单状态）
        let targetFilter = ''
        if (orderStatus === 'pending') {
          targetFilter = '待支付'
        } else if (orderStatus === 'paid') {
          targetFilter = '待取件'
        }
        
        console.log('🔙 跳转到全部订单页面，筛选栏:', targetFilter)
        
        // 显示成功提示
        wx.showToast({
          title: '订单已取消',
          icon: 'success',
          duration: 1500
        })
        
        // 延迟后跳转到全部订单页面
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/orders/index?filter=${encodeURIComponent(targetFilter)}`
          })
        }, 1500)
        
      } else {
        throw new Error(res.result?.message || '取消订单失败')
      }
      
    } catch (error) {
      console.error('❌ 取消订单失败:', error)
      wx.hideLoading()
      
      wx.showModal({
        title: '取消失败',
        content: error.message || '取消订单失败，请稍后重试',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },
  
  // 🎫 切换取件码展开/收起
  toggleQRCode() {
    const { showQRCode, qrcodeUrl } = this.data
    
    this.setData({
      showQRCode: !showQRCode
    })
    
    console.log('🎫 取件码展开状态:', !showQRCode)
    
    // 如果是展开且还没有生成小程序码，则生成
    if (!showQRCode && !qrcodeUrl) {
      this.generatePickupCode()
    }
  },
  
  // 📋 复制取件地点（门店名称 + 邮编）
  onCopyLocation() {
    const { storeName, storePostcode } = this.data
    const locationText = `${storeName} | ${storePostcode}`
    
    console.log('📋 复制取件地点:')
    console.log('  门店名称:', storeName)
    console.log('  门店邮编:', storePostcode)
    console.log('  复制内容:', locationText)
    
    wx.setClipboardData({
      data: locationText,
      success: () => {
        wx.showToast({
          title: '地址已复制',
          icon: 'success',
          duration: 1500
        })
        console.log('✅ 地址已复制到剪贴板')
      },
      fail: (err) => {
        console.error('❌ 复制失败:', err)
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },
  
  // 📞 拨打门店电话（使用 storePhone 字段）
  onCallStore() {
    const { storePhone, storeName } = this.data
    
    console.log('📞 拨打门店电话:')
    console.log('  门店名称:', storeName)
    console.log('  门店电话:', storePhone)
    
    if (!storePhone) {
      wx.showToast({
        title: '暂无门店电话',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '拨打门店电话',
      content: `${storeName}\n联系电话：${storePhone}`,
      confirmText: '拨打',
      confirmColor: '#2E5A9B',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: storePhone,
            success: () => {
              console.log('✅ 拨打电话成功:', storePhone)
            },
            fail: (err) => {
              console.error('❌ 拨打失败:', err)
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },
  
  // 🎫 生成取件二维码（在线API，立即可用）
  generatePickupCode() {
    const { orderId } = this.data
    
    try {
      console.log('🎫 开始生成取件二维码，订单号:', orderId)
      
      // 构造二维码数据
      const qrData = {
        type: 'pickup', // 取件类型
        orderId: orderId
      }
      
      // 使用在线二维码服务
      const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(JSON.stringify(qrData))}`
      
      this.setData({
        qrcodeUrl: qrcodeUrl
      })
      
      console.log('✅ 取件二维码生成成功')
      
      wx.showToast({
        title: '二维码生成成功',
        icon: 'success',
        duration: 1000
      })
      
    } catch (error) {
      console.error('❌ 生成二维码失败:', error)
      wx.showToast({
        title: '二维码生成失败',
        icon: 'none'
      })
    }
  },
  
  // 🎫 切换归还码展开/收起
  toggleReturnQRCode() {
    const { showReturnQRCode, returnQrcodeUrl } = this.data
    
    this.setData({
      showReturnQRCode: !showReturnQRCode
    })
    
    console.log('🎫 归还码展开状态:', !showReturnQRCode)
    
    // 如果是展开且还没有生成二维码，则生成
    if (!showReturnQRCode && !returnQrcodeUrl) {
      this.generateReturnCode()
    }
  },
  
  // 🎫 生成归还二维码
  generateReturnCode() {
    const { orderId } = this.data
    
    try {
      console.log('🎫 开始生成归还二维码，订单号:', orderId)
      
      // 构造二维码数据
      const qrData = {
        type: 'return', // 归还类型
        orderId: orderId
      }
      
      // 使用在线二维码服务
      const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(JSON.stringify(qrData))}`
      
      this.setData({
        returnQrcodeUrl: qrcodeUrl
      })
      
      console.log('✅ 归还二维码生成成功')
      
      wx.showToast({
        title: '二维码生成成功',
        icon: 'success',
        duration: 1000
      })
      
    } catch (error) {
      console.error('❌ 生成二维码失败:', error)
      wx.showToast({
        title: '二维码生成失败',
        icon: 'none'
      })
    }
  },
  
  // 🔄 打开续租日历
  onRenewOrder() {
    const { rentalEndDate, equipmentPrice, rentalDays } = this.data
    
    console.log('🔄 打开续租日历')
    console.log('  当前归还时间:', rentalEndDate)
    
    // 计算最小可选日期（当前结束日期+1天）
    const endDate = new Date(rentalEndDate)
    endDate.setDate(endDate.getDate() + 1)
    const minRenewDate = this.formatDateString(endDate)
    
    // 计算每日租金（原租金 / 原天数）
    const dailyRate = rentalDays > 0 ? (equipmentPrice / rentalDays) : 0
    
    // 初始化日历（从结束日期的月份开始）
    const today = new Date()
    
    this.setData({
      showRenewModal: true,
      minRenewDate: minRenewDate,
      dailyRate: dailyRate,
      renewEndDate: '',
      renewDays: 0,
      renewPrice: 0,
      currentYear: endDate.getFullYear(),
      currentMonth: endDate.getMonth() + 1
    })
    
    // 生成日历
    this.generateRenewCalendar()
    
    console.log('  最小可选日期:', minRenewDate)
    console.log('  每日租金:', dailyRate)
  },
  
  // 🔄 生成续租日历
  generateRenewCalendar() {
    const { currentYear, currentMonth, minRenewDate, renewEndDate } = this.data
    
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    const startWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const today = new Date()
    const todayStr = this.formatDateString(today)
    const minDate = new Date(minRenewDate)
    
    const dates = []
    
    // 填充空白日期
    for (let i = 0; i < startWeekday; i++) {
      dates.push({ day: '', dateKey: `empty-${i}`, isDisabled: true })
    }
    
    // 填充实际日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day)
      const dateStr = this.formatDateString(date)
      const isDisabled = date < minDate // 小于最小日期的都禁用
      
      dates.push({
        day: day,
        dateKey: dateStr,
        dateStr: dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === renewEndDate,
        isDisabled: isDisabled
      })
    }
    
    this.setData({
      calendarDates: dates
    })
  },
  
  // 上一月
  prevMonth() {
    let { currentYear, currentMonth } = this.data
    
    if (currentMonth === 1) {
      currentYear--
      currentMonth = 12
    } else {
      currentMonth--
    }
    
    this.setData({
      currentYear: currentYear,
      currentMonth: currentMonth
    })
    
    this.generateRenewCalendar()
  },
  
  // 下一月
  nextMonth() {
    let { currentYear, currentMonth } = this.data
    
    if (currentMonth === 12) {
      currentYear++
      currentMonth = 1
    } else {
      currentMonth++
    }
    
    this.setData({
      currentYear: currentYear,
      currentMonth: currentMonth
    })
    
    this.generateRenewCalendar()
  },
  
  // 选择续租日期
  onSelectRenewDate(e) {
    const dateStr = e.currentTarget.dataset.date
    
    if (!dateStr) return
    
    const { rentalEndDate, dailyRate, minRenewDate } = this.data
    
    // 检查日期是否可选
    const selectedDate = new Date(dateStr)
    const minDate = new Date(minRenewDate)
    
    if (selectedDate < minDate) {
      wx.showToast({
        title: '请选择归还日期之后',
        icon: 'none'
      })
      return
    }
    
    console.log('📅 选择续租日期:', dateStr)
    
    // 计算续租天数
    const currentEnd = new Date(rentalEndDate)
    const newEnd = new Date(dateStr)
    const days = Math.ceil((newEnd - currentEnd) / (1000 * 60 * 60 * 24))
    
    // 计算续租费用
    const price = Math.round(days * dailyRate * 100) / 100
    
    this.setData({
      renewEndDate: dateStr,
      renewDays: days,
      renewPrice: price
    })
    
    // 重新生成日历以更新选中状态
    this.generateRenewCalendar()
    
    console.log('  续租天数:', days)
    console.log('  续租费用:', price)
  },
  
  // 重置续租日期
  resetRenewDate() {
    this.setData({
      renewEndDate: '',
      renewDays: 0,
      renewPrice: 0
    })
    
    this.generateRenewCalendar()
  },
  
  // 确认续租日期
  confirmRenewDate() {
    const { renewDays, renewEndDate } = this.data
    
    if (renewDays <= 0 || !renewEndDate) {
      wx.showToast({
        title: '请选择续租日期',
        icon: 'none'
      })
      return
    }
    
    // 关闭日历，跳转到续租确认页面
    this.confirmRenew()
  },
  
  // 🔄 关闭续租日历
  closeRenewModal() {
    this.setData({
      showRenewModal: false,
      renewEndDate: '',
      renewDays: 0,
      renewPrice: 0
    })
  },
  
  // 🔄 确认续租并跳转
  confirmRenew() {
    const { orderId, renewEndDate, renewDays, renewPrice, productId, productName } = this.data
    
    if (renewDays <= 0) {
      wx.showToast({
        title: '请选择续租日期',
        icon: 'none'
      })
      return
    }
    
    console.log('✅ 确认续租')
    console.log('  订单号:', orderId)
    console.log('  续租至:', renewEndDate)
    console.log('  续租天数:', renewDays)
    console.log('  续租费用:', renewPrice)
    
    // 关闭弹窗
    this.closeRenewModal()
    
    // 跳转到续租确认页面
    wx.navigateTo({
      url: `/pages/rental/renew-confirm?orderId=${orderId}&productId=${productId}&productName=${encodeURIComponent(productName)}&renewEndDate=${renewEndDate}&renewDays=${renewDays}&renewPrice=${renewPrice}`
    })
  },
  
  // 格式化日期为 YYYY-MM-DD
  formatDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  // 返回
  goBack() {
    wx.navigateBack()
  }
})
