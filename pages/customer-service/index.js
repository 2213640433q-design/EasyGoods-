Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,      // 导航栏内容高度
    totalNavHeight: 0,     // 总导航高度（状态栏+导航栏）
    inputText: '',
    messages: [],
    selectedProduct: null,
    productList: [],
    showProductSelector: false,
    scrollToId: '',
    messageIdCounter: 0,
    showProductBar: true,  // 默认显示商品快捷栏
    isAiTyping: false,     // AI是否正在输入
    conversationHistory: [], // 对话历史记录
    userInfo: {},          // 用户信息（包含头像）
    keyboardHeight: 0      // 🌟 键盘高度
  },

  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = 44  // 导航栏内容高度
    const totalNavHeight = statusBarHeight + navBarHeight  // 总高度
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      totalNavHeight
    })

    // 🌟 获取用户信息（包含头像）
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })

    // 🌟 监听键盘高度变化
    wx.onKeyboardHeightChange(res => {
      console.log('⌨️ 键盘高度变化:', res.height)
      this.setData({
        keyboardHeight: res.height
      })
    })

    // 如果从商品详情页跳转过来，获取商品信息并显示商品栏
    if (options.productId) {
      this.loadProductInfo(options.productId)
      this.setData({
        showProductBar: true  // 从商品详情页进入，显示商品栏
      })
    } else {
      // 从其他入口进入（如"我的"页面），不显示商品栏
      this.setData({
        showProductBar: false
      })
    }

    // 加载商品列表（用于选择）
    this.loadProductList()
  },

  // 加载当前商品信息
  async loadProductInfo(productId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getProductDetail',
        data: { productId }
      })

      if (res.result.success) {
        this.setData({
          selectedProduct: res.result.data
        })
      }
    } catch (err) {
      console.error('加载商品信息失败:', err)
    }
  },

  // 加载商品列表
  async loadProductList() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('products')
        .where({ status: 'valid' })
        .limit(20)
        .get()

      this.setData({
        productList: res.data
      })
    } catch (err) {
      console.error('加载商品列表失败:', err)
    }
  },

  // 返回
  onBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  },

  // 输入框变化
  onInput(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  // 发送消息
  async sendMessage() {
    const text = this.data.inputText.trim()
    if (!text || this.data.isAiTyping) return

    const messageId = this.data.messageIdCounter + 1
    const newMessage = {
      id: messageId,
      type: 'user',
      msgType: 'text',
      content: text,
      time: new Date().getTime()
    }

    // 添加用户消息
    this.setData({
      messages: [...this.data.messages, newMessage],
      inputText: '',
      messageIdCounter: messageId,
      scrollToId: `msg-${messageId}`,
      isAiTyping: true  // 显示AI正在输入
    })

    // 稍微延迟后滚动到"正在输入"提示
    setTimeout(() => {
      this.setData({
        scrollToId: 'typing-indicator'
      })
    }, 100)

    // 将用户消息添加到对话历史
    const conversationHistory = [
      ...this.data.conversationHistory,
      { role: 'user', content: text }
    ]
    this.setData({ conversationHistory })

    // 调用 Coze AI
    await this.getAiReply(text)
  },

  // 调用 Coze AI 获取回复
  async getAiReply(userMessage) {
    try {
      // 准备请求参数
      const requestData = {
        message: userMessage,
        conversationHistory: this.data.conversationHistory.slice(-10) // 只保留最近10轮对话
      }

      // 如果有商品上下文，添加到请求中
      if (this.data.selectedProduct) {
        requestData.productContext = {
          name: this.data.selectedProduct.name,
          price: this.data.selectedProduct.price,
          category: this.data.selectedProduct.category
        }
      }

      console.log('🤖 调用 Coze AI...', requestData)

      // 调用云函数
      const res = await wx.cloud.callFunction({
        name: 'callCozeAgent',
        data: requestData
      })

      console.log('✅ Coze AI 响应:', res.result)

      let replyText = ''
      
      if (res.result.success) {
        // AI 回复成功
        replyText = res.result.reply
        
        // 将AI回复添加到对话历史
        const conversationHistory = [
          ...this.data.conversationHistory,
          { role: 'assistant', content: replyText }
        ]
        this.setData({ conversationHistory })
        
      } else {
        // AI 回复失败，使用兜底回复
        console.warn('⚠️ AI 回复失败，使用兜底回复')
        replyText = res.result.fallbackReply || this.getFallbackReply(userMessage)
      }

      // 添加AI消息
      const messageId = this.data.messageIdCounter + 1
      const serviceMessage = {
        id: messageId,
        type: 'service',
        msgType: 'text',
        content: replyText,
        time: new Date().getTime()
      }

      this.setData({
        messages: [...this.data.messages, serviceMessage],
        messageIdCounter: messageId,
        scrollToId: `msg-${messageId}`,
        isAiTyping: false
      })

    } catch (error) {
      console.error('❌ 调用 AI 失败:', error)
      
      // 发生异常，使用兜底回复
      const messageId = this.data.messageIdCounter + 1
      const serviceMessage = {
        id: messageId,
        type: 'service',
        msgType: 'text',
        content: this.getFallbackReply(userMessage),
        time: new Date().getTime()
      }

      this.setData({
        messages: [...this.data.messages, serviceMessage],
        messageIdCounter: messageId,
        scrollToId: `msg-${messageId}`,
        isAiTyping: false
      })
    }
  },

  // 获取兜底回复（当AI不可用时使用）
  getFallbackReply(userMessage) {
    // 简单的关键词匹配兜底回复
    if (userMessage.includes('价格') || userMessage.includes('多少钱')) {
      return '关于价格问题，我们的租赁价格按天计算，具体价格请查看商品详情页。长期租赁还有优惠哦！'
    } else if (userMessage.includes('租期') || userMessage.includes('多久')) {
      return '我们支持灵活的租期选择，从1天起租，您可以根据需要选择合适的租期。'
    } else if (userMessage.includes('取货') || userMessage.includes('地址')) {
      return '我们在南安普顿和格拉斯哥都有取货点，您可以选择就近的地点自取。'
    } else if (userMessage.includes('押金')) {
      return '押金会在您归还设备并确认无损坏后的3-5个工作日内退还。'
    }
    return '感谢您的咨询，我们会尽快为您处理。如需更多帮助，请留下您的联系方式。'
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        wx.showLoading({ title: '上传中...' })
        
        // 上传到云存储
        const cloudPath = `customer-service/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            wx.hideLoading()
            
            const messageId = this.data.messageIdCounter + 1
            const imageMessage = {
              id: messageId,
              type: 'user',
              msgType: 'image',
              content: uploadRes.fileID,
              time: new Date().getTime()
            }

            this.setData({
              messages: [...this.data.messages, imageMessage],
              messageIdCounter: messageId,
              scrollToId: `msg-${messageId}`
            })

            // AI 处理图片消息
            this.getAiReply('已发送图片，请问有什么可以帮您的？')
          },
          fail: (err) => {
            wx.hideLoading()
            console.error('上传图片失败:', err)
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        })
      }
    })
  },

  // 打开商品选择器
  chooseProduct() {
    this.setData({
      showProductSelector: true
    })
  },

  // 关闭商品选择器
  closeProductSelector() {
    this.setData({
      showProductSelector: false
    })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 选择商品
  selectProduct(e) {
    const product = e.currentTarget.dataset.product
    
    this.setData({
      selectedProduct: product,
      showProductSelector: false
    })

    // 发送商品卡片消息
    const messageId = this.data.messageIdCounter + 1
    const productMessage = {
      id: messageId,
      type: 'user',
      msgType: 'product',
      content: product,
      time: new Date().getTime()
    }

    this.setData({
      messages: [...this.data.messages, productMessage],
      messageIdCounter: messageId,
      scrollToId: `msg-${messageId}`
    })

    // AI 回复商品咨询
    this.getAiReply(`我想咨询这个商品：${product.name}`)
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [url],
      current: url
    })
  },

  // 跳转到商品详情
  goToProductDetail() {
    if (this.data.selectedProduct) {
      wx.navigateTo({
        url: `/pages/rental/detail?id=${this.data.selectedProduct._id}`
      })
    }
  },

  // 隐藏商品快捷栏
  hideProductBar() {
    this.setData({
      showProductBar: false
    })
  },

  // 从快捷栏发送商品卡片
  sendProductCard() {
    if (!this.data.selectedProduct) return

    const messageId = this.data.messageIdCounter + 1
    const productMessage = {
      id: messageId,
      type: 'user',
      msgType: 'product',
      content: this.data.selectedProduct,
      time: new Date().getTime()
    }

    this.setData({
      messages: [...this.data.messages, productMessage],
      messageIdCounter: messageId,
      scrollToId: `msg-${messageId}`,
      showProductBar: false  // 发送后隐藏快捷栏
    })

    // AI 回复商品咨询
    this.getAiReply(`我想咨询这个商品：${this.data.selectedProduct.name}`)
  }
})

