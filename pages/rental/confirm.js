Page({
  data: {
    statusBarHeight: 0,
    
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
    mainCategory: '',
    subCategory: '',
    
    // 租赁信息
    rentalStartDate: '',
    rentalEndDate: '',
    rentalDays: 0,
    pickupLocation: '',
    selectedPickupIndex: 0,
    
    // 配件信息
    selectedAccessories: [],
    accessoriesText: '',
    
    // 价格信息
    equipmentPrice: 0,
    accessoriesPrice: 0,
    totalPrice: 0,
    deposit: 0,
    totalAmount: 0,
    
    // 优惠券相关
    selectedCoupon: null,  // 选中的优惠券
    couponDiscount: 0,  // 优惠券优惠金额
    finalAmount: 0,  // 使用优惠券后的最终金额
    availableCoupons: [],  // 可用优惠券列表
    showCouponSheet: false,  // 优惠券选择弹窗
    
    // 备注
    note: '',
    
    // 支付弹窗
    showPayment: false,
    selectedPayment: 'wechat',
    
    // 订单ID（用于重新支付）
    orderId: '',
    
    // 订单状态
    orderStatus: 'pending',
    isPaid: false,
    
    // 支付成功弹窗
    showSuccessModal: false,
    successModalTitle: '',
    successModalContent: '',
    
    // 取消订单相关
    showCancelReasonSheet: false,
    cancelReasons: [
      '我有事去不了了',
      '不想租了',
      '找到其他更便宜的',
      '商品信息不符',
      '其他原因'
    ]
  },

  onLoad(options) {
    // 获取系统信息
    try {
      const w = wx.getWindowInfo()
      this.setData({ statusBarHeight: w.statusBarHeight })
    } catch(e) {
      this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 0 })
    }

    // 从上一页获取数据
    if (options.data) {
      try {
        const orderData = JSON.parse(decodeURIComponent(options.data))
        
        // 检查是否是重新支付
        const isRepay = options.isRepay === 'true'
        console.log('📋 订单数据加载:', { isRepay, orderData })
        
        if (isRepay && orderData.orderId) {
          // 重新支付：直接使用已有的价格数据
          this.loadExistingOrderData(orderData)
        } else {
          // 新订单：需要重新计算价格
          this.loadOrderData(orderData)
        }
      } catch(e) {
        console.error('解析订单数据失败:', e)
        wx.showToast({ title: '数据加载失败', icon: 'none' })
      }
    }
    
    // 如果是从订单列表重新进入（带orderId），加载订单数据
    if (options.orderId) {
      this.setData({ orderId: options.orderId })
      this.loadOrderFromStorage(options.orderId)
    }
  },

  // 加载已有订单数据（重新支付）
  loadExistingOrderData(data) {
    console.log('💳 加载已有订单数据（重新支付）:', data)
    
    // 处理配件
    const selectedAccessories = data.accessories || []
    const accessoriesText = selectedAccessories.map(item => item.name).join('、') || '无'
    
    this.setData({
      // 订单ID（重新支付时保留原订单ID）
      orderId: data.orderId,
      
      // 门店信息
      storeName: data.storeName || '南安普顿门店',
      storePhone: data.storePhone || '023 8012 3456',
      storeAddress: data.storeAddress || '45 High Street, Southampton',
      storePostcode: data.storePostcode || 'SO14 2AE',
      
      // 商品信息
      productId: data.productId,
      productName: data.productName,
      productSubtitle: data.productSubtitle || '',
      productImage: data.productImage,
      mainCategory: data.mainCategory || '',
      subCategory: data.subCategory || '',
      
      // 租赁信息
      rentalStartDate: data.rentalStartDate,
      rentalEndDate: data.rentalEndDate,
      rentalDays: data.rentalDays,
      pickupLocation: data.pickupLocation || '南安普顿店',
      
      // 配件信息
      selectedAccessories: selectedAccessories,
      accessoriesText: accessoriesText,
      
      // 价格信息（直接使用已有的价格数据）
      equipmentPrice: data.equipmentPrice || 0,
      accessoriesPrice: data.accessoriesPrice || 0,
      totalPrice: data.totalPrice || 0,
      deposit: data.deposit || 0,
      totalAmount: data.totalAmount || 0
    })
    
    console.log('💰 订单费用明细（已有数据）:')
    console.log('  器材租金:', data.equipmentPrice)
    console.log('  配件费用:', data.accessoriesPrice)
    console.log('  小计:', data.totalPrice)
    console.log('  押金:', data.deposit)
    console.log('  订单总额:', data.totalAmount)
    
    // 🎟️ 加载可用优惠券
    this.loadAvailableCoupons(data.totalPrice || 0)
    
    // 如果订单已使用优惠券，恢复优惠券信息
    if (data.couponId && data.couponDiscount) {
      console.log('🎟️ 订单已使用优惠券，恢复优惠券信息')
      this.setData({
        selectedCoupon: {
          id: data.couponId,
          discount: data.couponDiscount
        },
        couponDiscount: data.couponDiscount,
        finalAmount: data.totalAmount - data.couponDiscount
      })
    }
  },
  
  // 加载订单数据
  loadOrderData(data) {
    // 门店信息映射
    const storeInfo = {
      '伦敦店': {
        name: '伦敦门店',
        phone: '020 1234 5678',
        address: '123 Oxford Street, London',
        postcode: 'W1D 1BS'
      },
      '南安普顿店': {
        name: '南安普顿门店',
        phone: '023 8012 3456',
        address: '45 High Street, Southampton',
        postcode: 'SO14 2AE'
      },
      '格拉斯哥店': {
        name: '格拉斯哥门店',
        phone: '0141 234 5678',
        address: '78 Buchanan Street, Glasgow',
        postcode: 'G1 3HL'
      },
      '爱丁堡店': {
        name: '爱丁堡门店',
        phone: '0131 234 5678',
        address: '56 Princes Street, Edinburgh',
        postcode: 'EH2 2YJ'
      }
    }

    const selectedStore = storeInfo[data.pickupLocation] || storeInfo['南安普顿店']

    // 处理配件
    const selectedAccessories = data.accessories || []
    const accessoriesText = selectedAccessories.map(item => item.name).join('、') || '无'
    const accessoriesPrice = selectedAccessories.reduce((sum, item) => sum + (item.price * data.rentalDays), 0)
    const equipmentPrice = data.basePrice * data.rentalDays
    const totalPrice = equipmentPrice + accessoriesPrice
    const totalAmount = totalPrice + data.deposit

    this.setData({
      // 门店信息
      storeName: selectedStore.name,
      storePhone: selectedStore.phone,
      storeAddress: selectedStore.address,
      storePostcode: selectedStore.postcode,
      
      // 商品信息
      productId: data.productId,
      productName: data.productName,
      productSubtitle: data.productSubtitle || '人文',
      productImage: data.productImage,
      mainCategory: data.mainCategory || '娱乐',
      subCategory: data.subCategory || '麻将',
      
      // 租赁信息
      rentalStartDate: data.rentalStartDate,
      rentalEndDate: data.rentalEndDate,
      rentalDays: data.rentalDays,
      pickupLocation: data.pickupLocation,
      selectedPickupIndex: data.selectedPickupIndex,
      
      // 配件信息
      selectedAccessories: selectedAccessories,
      accessoriesText: accessoriesText,
      
      // 价格信息
      equipmentPrice: equipmentPrice,
      accessoriesPrice: accessoriesPrice,
      totalPrice: totalPrice,
      deposit: data.deposit,
      totalAmount: totalAmount
    })
    
    // 🔍 调试输出
    console.log('💰 订单费用明细:')
    console.log('  器材租金:', equipmentPrice)
    console.log('  配件费用:', accessoriesPrice)
    console.log('  小计:', totalPrice)
    console.log('  押金:', data.deposit)
    console.log('  订单总额:', totalAmount)
    
    // 🎟️ 加载可用优惠券
    this.loadAvailableCoupons(totalPrice)
  },
  
  // 🎟️ 加载可用优惠券
  async loadAvailableCoupons(orderAmount) {
    console.log('🎟️ 开始加载可用优惠券...')
    console.log('  订单金额（不含押金）:', orderAmount)
    
    try {
      // ☁️ 调用云函数获取订单可用优惠券
      const res = await wx.cloud.callFunction({
        name: 'getOrderCoupons',
        data: {
          orderAmount: orderAmount
        }
      })
      
      console.log('📤 云函数返回:', res)
      
      if (res.result && res.result.success) {
        const coupons = res.result.data || []
        
        console.log('✅ 可用优惠券:', coupons.length, '张')
        
        if (coupons.length > 0) {
          console.log('  最优优惠券:', coupons[0].couponName)
          console.log('  可优惠:', coupons[0].discountAmount, '英镑')
        }
        
        this.setData({
          availableCoupons: coupons
        })
      }
    } catch (err) {
      console.error('❌ 加载可用优惠券失败:', err)
      this.setData({ availableCoupons: [] })
    }
  },
  
  // 🎟️ 打开优惠券选择弹窗
  openCouponSheet() {
    if (this.data.availableCoupons.length === 0) {
      return wx.showToast({
        title: '暂无可用优惠券',
        icon: 'none'
      })
    }
    
    this.setData({ showCouponSheet: true })
  },
  
  // 🎟️ 关闭优惠券选择弹窗
  closeCouponSheet() {
    this.setData({ showCouponSheet: false })
  },
  
  // 🎟️ 选择优惠券
  onSelectCoupon(e) {
    const index = e.currentTarget.dataset.index
    const coupon = this.data.availableCoupons[index]
    
    console.log('🎟️ 选择优惠券:', coupon.couponName)
    console.log('  优惠金额:', coupon.discountAmount, '英镑')
    
    // 计算使用优惠券后的最终金额
    const finalAmount = this.data.totalPrice + this.data.deposit - coupon.discountAmount
    
    this.setData({
      selectedCoupon: coupon,
      couponDiscount: coupon.discountAmount,
      finalAmount: finalAmount,
      totalAmount: finalAmount,  // 更新总金额
      showCouponSheet: false
    })
    
    wx.showToast({
      title: `已优惠${coupon.discountAmount}英镑`,
      icon: 'success'
    })
  },
  
  // 🎟️ 取消使用优惠券
  onCancelCoupon() {
    console.log('🎟️ 取消使用优惠券')
    
    // 恢复原价
    const originalAmount = this.data.totalPrice + this.data.deposit
    
    this.setData({
      selectedCoupon: null,
      couponDiscount: 0,
      finalAmount: originalAmount,
      totalAmount: originalAmount
    })
    
    wx.showToast({
      title: '已取消优惠券',
      icon: 'none'
    })
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({
      note: e.detail.value
    })
  },

  // 从本地存储加载订单数据
  loadOrderFromStorage(orderId) {
    const orders = wx.getStorageSync('rentalOrders') || []
    const order = orders.find(item => item.orderId === orderId)
    
    if (order) {
      // 判断订单是否已支付
      const isPaid = order.status !== 'pending'
      
      // 获取订单状态文本
      const statusTextMap = {
        'pending': '待支付',
        'paid': '待取件',
        'picked': '租赁中',
        'returning': '归还中',
        'checking': '检查中',
        'completed': '已完成'
      }
      const orderStatusText = statusTextMap[order.status] || '未知状态'
      
      this.setData({
        storeName: order.storeName,
        storePhone: order.storePhone,
        storeAddress: order.storeAddress,
        storePostcode: order.storePostcode || 'SO14 2AE',
        productId: order.productId,
        productName: order.productName,
        productSubtitle: order.productSubtitle || '人文',
        productImage: order.productImage,
        rentalStartDate: order.rentalStartDate,
        rentalEndDate: order.rentalEndDate,
        rentalDays: order.rentalDays,
        pickupLocation: order.pickupLocation,
        selectedAccessories: order.accessories || [],
        accessoriesText: (order.accessories || []).map(item => item.name).join('、') || '无',
        equipmentPrice: order.equipmentPrice || 0,
        accessoriesPrice: order.accessoriesPrice || 0,
        totalPrice: order.totalPrice,
        deposit: order.deposit,
        totalAmount: order.totalAmount,
        note: order.note || '',
        orderStatus: order.status,
        orderStatusText: orderStatusText,
        isPaid: isPaid
      })
    }
  },

  // 🌟 提交订单（云端化）
  async onSubmitOrder() {
    console.log('📦 开始创建订单...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 🔍 调试：检查当前页面数据状态
    console.log('🔍 当前页面数据状态:')
    console.log('  selectedCoupon:', this.data.selectedCoupon)
    console.log('  couponDiscount:', this.data.couponDiscount)
    console.log('  totalPrice:', this.data.totalPrice)
    console.log('  deposit:', this.data.deposit)
    console.log('  totalAmount:', this.data.totalAmount)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    wx.showLoading({ title: '创建订单中...', mask: true })
    
    try {
      // 📋 构建订单数据
      const orderData = {
        // 商品信息
        productId: this.data.productId,
        productName: this.data.productName,
        productImage: this.data.productImage,
        mainCategory: this.data.mainCategory || '娱乐',
        subCategory: this.data.subCategory || '麻将',
        
        // 租赁信息
        rentalStartDate: this.data.rentalStartDate,
        rentalEndDate: this.data.rentalEndDate,
        rentalDays: this.data.rentalDays,
        pickupLocation: this.data.pickupLocation,
        
        // 配件信息
        accessories: this.data.selectedAccessories || [],
        
        // 价格信息
        dailyPrice: this.data.equipmentPrice / this.data.rentalDays || 0,
        deposit: this.data.deposit,
        
        // 🔍 调试：添加更多价格字段用于验证
        equipmentPrice: this.data.equipmentPrice,
        accessoriesPrice: this.data.accessoriesPrice,
        totalPriceFrontend: this.data.totalPrice,
        
        // 🎟️ 优惠券信息
        couponId: this.data.selectedCoupon ? this.data.selectedCoupon._id : null,
        couponDiscount: this.data.couponDiscount || 0,
        
        // 备注
        note: this.data.note
      }
      
      console.log('📥 订单数据:', orderData)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('💰 价格字段详细:')
      console.log('  dailyPrice:', orderData.dailyPrice, '英镑/天')
      console.log('  rentalDays:', orderData.rentalDays, '天')
      console.log('  计算租金 (dailyPrice × rentalDays):', (orderData.dailyPrice * orderData.rentalDays).toFixed(2), '英镑')
      console.log('  equipmentPrice:', orderData.equipmentPrice, '英镑')
      console.log('  accessoriesPrice:', orderData.accessoriesPrice, '英镑')
      console.log('  totalPriceFrontend:', orderData.totalPriceFrontend, '英镑')
      console.log('  deposit:', orderData.deposit, '英镑')
      console.log('  accessories:', orderData.accessories)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎟️ 优惠券信息详细:')
      console.log('  couponId:', orderData.couponId)
      console.log('  couponDiscount:', orderData.couponDiscount)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🧮 预期总金额:')
      console.log('  前端计算:', this.data.totalAmount, '英镑')
      console.log('  计算公式: totalPrice + deposit - couponDiscount')
      console.log('  =', this.data.totalPrice, '+', this.data.deposit, '-', this.data.couponDiscount)
      console.log('  =', this.data.totalAmount, '英镑')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // ☁️ 调用云函数创建订单
      const res = await wx.cloud.callFunction({
        name: 'createOrder',
        data: orderData
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        const orderId = res.result.data.orderId
        const totalAmount = res.result.data.totalAmount
        
        console.log('✅ 订单创建成功!')
        console.log('  订单号:', orderId)
        console.log('  总金额:', totalAmount, '英镑')
        
        // 设置订单ID并打开支付弹窗
        this.setData({
          orderId: orderId,
          showPayment: true
        })
        
        wx.showToast({
          title: '订单创建成功',
          icon: 'success',
          duration: 1500
        })
        
      } else {
        throw new Error(res.result?.message || '创建订单失败')
      }
      
    } catch (err) {
      console.error('❌ 创建订单失败:', err)
      wx.hideLoading()
      wx.showModal({
        title: '创建订单失败',
        content: err.message || '请稍后重试',
        showCancel: false
      })
    }
  },
  
  // 保存订单到本地存储
  saveOrder(orderInfo) {
    let orders = wx.getStorageSync('rentalOrders') || []
    
    // 检查是否已存在该订单
    const existIndex = orders.findIndex(item => item.orderId === orderInfo.orderId)
    
    if (existIndex > -1) {
      // 更新现有订单
      orders[existIndex] = orderInfo
    } else {
      // 添加新订单
      orders.unshift(orderInfo)
    }
    
    wx.setStorageSync('rentalOrders', orders)
  },

  // 选择支付方式
  selectPayment(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedPayment: type
    })
  },

  // 关闭支付弹窗
  closePayment() {
    wx.showModal({
      title: '提示',
      content: '订单未支付，是否放弃支付？',
      confirmText: '放弃',
      cancelText: '继续支付',
      success: (res) => {
        if (res.confirm) {
          // 关闭弹窗，跳转到订单列表
          this.setData({ showPayment: false })
          // 使用 redirectTo 替换当前页面，保留页面栈
          wx.redirectTo({
            url: '/pages/orders/index?tab=rent'
          })
        }
      }
    })
  },

  // 🌟 确认支付（云端化）
  async confirmPayment() {
    const { selectedPayment, orderId, totalAmount, rentalStartDate, storeAddress, storePostcode } = this.data
    
    if (!selectedPayment) {
      return wx.showToast({ title: '请选择支付方式', icon: 'none' })
    }
    
    console.log('💰 开始支付流程...')
    console.log('  订单号:', orderId)
    console.log('  支付方式:', selectedPayment)
    
    wx.showLoading({ title: '支付中...', mask: true })
    
    try {
      // ☁️ 调用云函数更新订单状态为已支付
      const res = await wx.cloud.callFunction({
        name: 'updateOrderStatus',
        data: {
          orderId: orderId,
          newStatus: 'paid',  // 更新为待取件状态
          note: `支付方式：${selectedPayment === 'wechat' ? '微信支付' : '线下支付'}`
        }
      })
      
      console.log('📤 云函数返回:', res)
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        console.log('✅ 订单状态更新成功!')
        
        // 关闭支付弹窗
        this.setData({ showPayment: false })
        
        // 构建预约成功提示内容
        let modalTitle = '支付成功'
        let modalContent = `预约取货日期：${rentalStartDate}\n\n取货地址：${storeAddress}\n邮编：${storePostcode}`
        
        // 如果是线下支付，添加额外提醒
        if (selectedPayment === 'cash') {
          modalContent += '\n\n温馨提示：请您于取货时完成线下支付，谢谢！'
        }
        
        // 显示支付成功弹窗
        this.setData({
          showSuccessModal: true,
          successModalTitle: modalTitle,
          successModalContent: modalContent
        })
        
      } else {
        throw new Error(res.result?.message || '支付失败')
      }
      
    } catch (err) {
      console.error('❌ 支付失败:', err)
      wx.hideLoading()
      wx.showModal({
        title: '支付失败',
        content: err.message || '请稍后重试',
        showCancel: false
      })
    }
  },
  
  // 关闭支付成功弹窗
  closeSuccessModal() {
    this.setData({ showSuccessModal: false })
    // 跳转到订单列表，使用 redirectTo 替换当前页面，保留页面栈
    wx.redirectTo({
      url: '/pages/orders/index?tab=rent'
    })
  },

  // 🚫 从确认页面取消订单
  onCancelOrderFromConfirm() {
    const { orderId } = this.data
    
    if (!orderId) {
      wx.showToast({
        title: '新订单无需取消，直接返回即可',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    this.setData({ showCancelReasonSheet: true })
  },
  
  // 🚫 关闭取消原因选择框
  closeCancelSheet() {
    this.setData({ showCancelReasonSheet: false })
  },
  
  // 🚫 选择取消原因
  onSelectCancelReason(e) {
    const reason = e.currentTarget.dataset.reason
    
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
          this.closeCancelSheet()
        }
      }
    })
  },
  
  // 🚫 取消订单（调用云函数）
  async cancelOrder(reason) {
    const { orderId } = this.data
    this.closeCancelSheet()
    
    wx.showLoading({ title: '取消中...', mask: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'cancelOrder',
        data: { orderId: orderId, cancelReason: reason }
      })
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '订单已取消',
          icon: 'success',
          duration: 1500
        })
        
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/orders/index?filter=${encodeURIComponent('待支付')}`
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
  
  // 返回
  goBack() {
    wx.navigateBack()
  }
})

