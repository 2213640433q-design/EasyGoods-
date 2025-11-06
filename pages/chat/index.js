Page({
  data: {
    statusBarHeight: 0,
    sellerName: '',
    product: {},
    sellerAvatar: '',
    myAvatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0U1RTdFQiIvPjxwYXRoIGQ9Ik0yMCAyMkMyMy4zMTM3IDIyIDI2IDE5LjMxMzcgMjYgMTZDMjYgMTIuNjg2MyAyMy4zMTM3IDEwIDIwIDEwQzE2LjY4NjMgMTAgMTQgMTIuNjg2MyAxNCAxNkMxNCAxOS4zMTM3IDE2LjY4NjMgMjIgMjAgMjJaIiBmaWxsPSIjOUNBM0FGIi8+PHBhdGggZD0iTTI4IDMwQzI4IDI1LjU4MTcgMjQuNDE4MyAyMiAyMCAyMkMxNS41ODE3IDIyIDEyIDI1LjU4MTcgMTIgMzBIMjhaIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+',
    messages: [],
    inputText: '',
    scrollToView: '',
    
    // 快捷预约相关
    showAppointmentPanel: false,
    locationOptions: ['Southampton City Centre', 'Southampton University', 'Portswood', 'Highfield Campus'],
    selectedLocationIndex: 0,
    selectedDate: '',
    todayDate: '',
    selectedTime: '14:00',
    
    // 预约信息组件
    appointmentInfo: null,
    // appointmentInfo 结构:
    // {
    //   id: 'appt_xxx',
    //   isMine: true/false,  // 是否是我发起的
    //   status: 'pending/confirmed/rejected',
    //   statusText: '待确认/已确认/已拒绝',
    //   location: '交易地点',
    //   date: '日期',
    //   time: '时间',
    //   modifyCount: 0,  // 修改次数
    //   createdBy: 'buyer/seller',  // 创建者角色
    //   lastModifiedBy: 'buyer/seller'  // 最后修改者
    // }
    
    // 调试：当前角色（buyer/seller）
    currentRole: 'buyer'
  },
  onLoad(options) {
    try {
      const w = wx.getWindowInfo()
      this.setData({ statusBarHeight: w.statusBarHeight })
    } catch(e) {
      this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 0 })
    }
    const id = options.id || 'm1'
    this.initMock(id)
    this.initAppointmentData()
    
    // 用于测试：自动创建一个待确认的预约
    if (options.testAppointment === 'true') {
      this.createTestAppointment()
    }
  },
  
  // 创建测试预约（用于演示卖家视角）
  createTestAppointment() {
    setTimeout(() => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const year = tomorrow.getFullYear()
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const day = String(tomorrow.getDate()).padStart(2, '0')
      const tomorrowDate = `${year}-${month}-${day}`
      
      const testAppointment = {
        id: `appt_${Date.now()}`,
        isMine: false,  // 🔧 卖家视角：买家发起的（isMine = false）
        status: 'pending',
        statusText: '待确认',
        location: 'Southampton City Centre',
        date: tomorrowDate,
        time: '14:00',
        modifyCount: 0,
        createdBy: 'buyer',
        lastModifiedBy: 'buyer'
      }
      
      // 🔧 切换到卖家视角
      this.setData({ 
        appointmentInfo: testAppointment,
        currentRole: 'seller'  // 设置为卖家角色
      })
      
      // 添加系统消息和买家的初始消息
      const messages = [
        {
          id: Date.now() - 1000,
          content: '你好，我想购买这个商品',
          isMine: false,  // 买家发的
          time: '13:30',
          isSystem: false
        },
        {
          id: Date.now(),
          content: '买家发送了交易预约',
          isMine: false,
          time: this.getCurrentTime(),
          isSystem: true
        }
      ]
      
      this.setData({ 
        messages: messages,
        scrollToView: 'msg-' + messages[messages.length - 1].id
      })
      
      // Toast提示
      wx.showToast({ 
        title: '已切换为卖家视角，可看到买家预约', 
        icon: 'none',
        duration: 2000
      })
    }, 500)
  },
  
  // 初始化预约数据
  initAppointmentData() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayDate = `${year}-${month}-${day}`
    
    // 默认日期为明天
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowYear = tomorrow.getFullYear()
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0')
    const tomorrowDate = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`
    
    this.setData({
      todayDate: todayDate,
      selectedDate: tomorrowDate
    })
  },
  initMock(id) {
    const placeholderAvatar = this.data.myAvatar
    // 创建卖家头像（使用不同颜色区分）
    const sellerAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0UwRTdGRiIvPjxwYXRoIGQ9Ik0yMCAyMkMyMy4zMTM3IDIyIDI2IDE5LjMxMzcgMjYgMTZDMjYgMTIuNjg2MyAyMy4zMTM3IDEwIDIwIDEwQzE2LjY4NjMgMTAgMTQgMTIuNjg2MyAxNCAxNkMxNCAxOS4zMTM3IDE2LjY4NjMgMjIgMjAgMjJaIiBmaWxsPSIjNEE2RkE1Ii8+PHBhdGggZD0iTTI4IDMwQzI4IDI1LjU4MTcgMjQuNDE4MyAyMiAyMCAyMkMxNS41ODE3IDIyIDEyIDI1LjU4MTcgMTIgMzBIMjhaIiBmaWxsPSIjNEE2RkE1Ii8+PC9zdmc+'
    
    const all = [
      { 
        id:'m1', 
        name:'iPhone 14 Pro 256GB 深空黑', 
        price:'650', 
        currency:'£', 
        image:'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop', 
        userName:'Alex Chen', 
        avatar: sellerAvatar, 
        deliveryMethod:'仅自提', 
        pickupLocation:'Southampton City Centre', 
        location:'英国·南安普顿' 
      }
    ]
    const product = all.find(p => p.id === id) || all[0]
    const cityDisplay = product.location.indexOf('·') > -1 ? product.location.split('·').pop() : product.location
    product.cityDisplay = cityDisplay
    this.setData({ product, sellerName: product.userName, sellerAvatar: product.avatar, messages: [] })
  },
  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },
  onSendMessage() {
    const text = this.data.inputText.trim()
    if (!text) return
    const msg = { id: Date.now(), content: text, isMine: true, time: this.getCurrentTime() }
    const messages = [...this.data.messages, msg]
    this.setData({ messages, inputText: '', scrollToView: 'msg-' + msg.id })
    this.updateConversationList(text)
    setTimeout(() => this.simulateReply(), 1000)
  },
  getCurrentTime() {
    const d = new Date()
    const h = ('' + d.getHours()).padStart(2, '0')
    const m = ('' + d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },
  updateConversationList(snippet) {
    const list = wx.getStorageSync('conversations') || []
    const p = this.data.product
    const item = { 
      id: p.id, 
      name: p.userName, 
      time: this.getCurrentTime(), 
      snippet,  // 保留用于兼容性
      lastMessage: snippet,  // 最后一条消息内容
      unread: 0, 
      avatar: p.avatar || this.data.sellerAvatar,
      hidden: false
    }
    const idx = list.findIndex(x => x.id === p.id)
    if (idx > -1) {
      list[idx] = { ...list[idx], ...item }
    } else {
      list.unshift(item)
    }
    wx.setStorageSync('conversations', list)
  },
  simulateReply() {
    const reply = { id: Date.now(), content: '收到～', isMine: false, time: this.getCurrentTime() }
    this.setData({ messages: [...this.data.messages, reply], scrollToView: 'msg-' + reply.id })
  },
  goBack() {
    wx.navigateBack()
  },
  
  // 切换角色（用于测试预约功能）
  onSwitchRole() {
    const newRole = this.data.currentRole === 'buyer' ? 'seller' : 'buyer'
    this.setData({ currentRole: newRole })
    
    // 如果有预约信息，切换视角
    if (this.data.appointmentInfo) {
      this.setData({
        'appointmentInfo.isMine': !this.data.appointmentInfo.isMine
      })
    }
    
    wx.showToast({ 
      title: newRole === 'buyer' ? '切换为买家视角' : '切换为卖家视角', 
      icon: 'none' 
    })
  },
  onBuyNow() {
    wx.showToast({ title: '购买功能开发中', icon: 'none' })
  },
  onVoiceClick() {
    wx.showToast({ title: '语音开发中', icon: 'none' })
  },
  onEmojiClick() {
    wx.showToast({ title: '表情开发中', icon: 'none' })
  },
  onAddClick() {
    wx.showActionSheet({ itemList: ['发送图片', '拍照', '发送位置'] })
  },
  
  // 切换预约面板
  onAppointmentToggle() {
    this.setData({ showAppointmentPanel: !this.data.showAppointmentPanel })
  },
  
  // 地点选择
  onLocationChange(e) {
    this.setData({ selectedLocationIndex: e.detail.value })
  },
  
  // 日期选择
  onDateChange(e) {
    this.setData({ selectedDate: e.detail.value })
  },
  
  // 时间选择
  onTimeChange(e) {
    this.setData({ selectedTime: e.detail.value })
  },
  
  // 发送预约消息
  onSendAppointment() {
    const { selectedLocationIndex, locationOptions, selectedDate, selectedTime, appointmentInfo } = this.data
    const location = locationOptions[selectedLocationIndex]
    
    // 创建或更新预约信息组件
    const newAppointment = {
      id: appointmentInfo ? appointmentInfo.id : `appt_${Date.now()}`,
      isMine: true,  // 买家发起
      status: 'pending',
      statusText: '待确认',
      location: location,
      date: selectedDate,
      time: selectedTime,
      modifyCount: appointmentInfo ? appointmentInfo.modifyCount + 1 : 0,
      createdBy: 'buyer',
      lastModifiedBy: 'buyer'
    }
    
    this.setData({ 
      appointmentInfo: newAppointment,
      showAppointmentPanel: false // 发送后关闭面板
    })
    
    // 添加系统消息到聊天
    const systemMsg = {
      id: Date.now(),
      content: appointmentInfo ? '买家调整了预约信息' : '买家发送了交易预约',
      isMine: false,
      time: this.getCurrentTime(),
      isSystem: true
    }
    const messages = [...this.data.messages, systemMsg]
    this.setData({ messages, scrollToView: 'msg-' + systemMsg.id })
    
    this.updateConversationList(appointmentInfo ? '调整了预约信息' : '发送了预约信息')
    wx.showToast({ title: appointmentInfo ? '预约已调整' : '预约已发送', icon: 'success' })
  },
  
  // 调整预约（买家/卖家都可以）
  onAdjustAppointment() {
    const { appointmentInfo } = this.data
    
    // 检查修改次数限制（仅针对发起者）
    if (appointmentInfo.isMine && appointmentInfo.modifyCount >= 2) {
      return wx.showToast({ title: '已达修改上限', icon: 'none' })
    }
    
    // 如果是卖家调整，切换角色和重置状态
    if (!appointmentInfo.isMine) {
      // 卖家调整预约，预约所有权转移给卖家
      this.setData({
        'appointmentInfo.isMine': false,  // 从卖家视角看，现在是买家发起的
        'appointmentInfo.lastModifiedBy': 'seller',
        'appointmentInfo.status': 'pending',  // 保持待确认状态
        'appointmentInfo.statusText': '待确认'
      })
    }
    
    // 打开预约面板进行调整
    this.setData({
      showAppointmentPanel: true,
      selectedLocationIndex: this.data.locationOptions.indexOf(appointmentInfo.location),
      selectedDate: appointmentInfo.date,
      selectedTime: appointmentInfo.time
    })
  },
  
  // 确认预约（仅卖家）
  onConfirmAppointment() {
    this.setData({
      'appointmentInfo.status': 'confirmed',
      'appointmentInfo.statusText': '已确认'
    })
    
    // 添加系统消息
    const systemMsg = {
      id: Date.now(),
      content: '卖家确认了预约',
      isMine: false,
      time: this.getCurrentTime(),
      isSystem: true
    }
    const messages = [...this.data.messages, systemMsg]
    this.setData({ messages, scrollToView: 'msg-' + systemMsg.id })
    
    wx.showToast({ title: '预约已确认', icon: 'success' })
  },
  
  // 拒绝预约（仅卖家）
  onRejectAppointment() {
    wx.showModal({
      title: '拒绝预约',
      content: '确定要拒绝这个预约吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'appointmentInfo.status': 'rejected',
            'appointmentInfo.statusText': '已拒绝'
          })
          
          // 添加系统消息
          const systemMsg = {
            id: Date.now(),
            content: '卖家拒绝了预约',
            isMine: false,
            time: this.getCurrentTime(),
            isSystem: true
          }
          const messages = [...this.data.messages, systemMsg]
          this.setData({ messages, scrollToView: 'msg-' + systemMsg.id })
          
          wx.showToast({ title: '已拒绝预约', icon: 'none' })
        }
      }
    })
  }
})

