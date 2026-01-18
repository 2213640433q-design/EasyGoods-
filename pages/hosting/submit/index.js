// pages/hosting/submit/index.js
Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    totalNavHeight: 0,
    
    currentStep: 1,  // 当前步骤：1/2/3
    
    // 表单数据
    formData: {
      mainCategory: '摄影',
      subCategory: '',
      deviceName: '',
      subtitle: '',
      originalPrice: '',
      purchaseDate: '',
      condition: '',
      deviceParams: '',  // 规格参数文本
      accessories: '',
      customAccessories: '',
      images: [],
      sampleImages: [],
      description: '',
      depositRatio: 100,
      dailyRent: ''
    },
    
    // 计算的押金金额（用于显示）
    depositAmount100: '0.00',
    depositAmount80: '0.00',
    depositAmount70: '0.00',
    
    // 使用状况选项
    conditionOptions: ['全新未拆封', '几乎全新', '九成新', '八成新', '七成新及以下'],
    
    // 配件选项
    accessoryOptions: [
      { name: '充电器', checked: false },
      { name: '电池', checked: false, hasQuantity: true, quantity: 1 },
      { name: '数据线', checked: false },
      { name: '说明书', checked: false },
      { name: '原装包装', checked: false },
      { name: '相机包', checked: false },
      { name: '存储卡', checked: false, hasQuantity: true, quantity: '' },
      { name: '备用电池', checked: false }
    ],
    
    // 系统建议租金
    suggestedRent: {
      min: 0,
      max: 0,
      recommended: 0,
      min2Days: 0,
      max2Days: 0,
      min3Days: 0,
      max3Days: 0
    },
    
    // 计算的租金
    calculated2DayRent: 0,
    calculated3DayRent: 0,
    estimatedMonthRevenue: 0,
    
    // 验证状态
    rentError: '',
    isStep2Valid: false,
    isStep3Valid: false
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = 44
    const totalNavHeight = statusBarHeight + navBarHeight
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      totalNavHeight
    })
  },

  // 返回
  goBack() {
    if (this.data.currentStep > 1) {
      // 如果在步骤2或3，返回上一步
      this.prevStep()
    } else {
      // 在步骤1，返回上一页
      wx.navigateBack({
        fail: () => {
          wx.switchTab({ url: '/pages/profile/index' })
        }
      })
    }
  },

  // ========== 步骤1：选择类型 ==========
  
  selectSubCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      'formData.subCategory': category
    })
  },

  // ========== 步骤2：填写信息 ==========
  
  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    }, () => {
      // 如果是原价字段，更新押金显示
      if (field === 'originalPrice') {
        this.updateDepositAmounts()
      }
      this.validateStep2()
    })
  },
  
  // 更新押金金额显示
  updateDepositAmounts() {
    const price = parseFloat(this.data.formData.originalPrice) || 0
    this.setData({
      depositAmount100: price.toFixed(2),
      depositAmount80: (price * 0.8).toFixed(2),
      depositAmount70: (price * 0.7).toFixed(2)
    })
  },

  onDateChange(e) {
    this.setData({
      'formData.purchaseDate': e.detail.value
    })
  },

  selectCondition(e) {
    const condition = e.currentTarget.dataset.condition
    this.setData({
      'formData.condition': condition
    }, () => {
      this.validateStep2()
    })
  },


  // 配件清单
  toggleAccessory(e) {
    const index = e.currentTarget.dataset.index
    const accessories = this.data.accessoryOptions
    accessories[index].checked = !accessories[index].checked
    
    // 如果有数量输入，默认设置为1
    if (accessories[index].hasQuantity && accessories[index].checked && !accessories[index].quantity) {
      accessories[index].quantity = 1
    }
    
    this.setData({
      accessoryOptions: accessories
    }, () => {
      this.updateAccessoriesText()
    })
  },

  onAccessoryQuantityChange(e) {
    const index = e.currentTarget.dataset.index
    const accessories = this.data.accessoryOptions
    accessories[index].quantity = e.detail.value
    this.setData({
      accessoryOptions: accessories
    }, () => {
      this.updateAccessoriesText()
    })
  },

  updateAccessoriesText() {
    const checked = this.data.accessoryOptions.filter(item => item.checked)
    const accessoryList = checked.map(item => {
      if (item.hasQuantity && item.quantity) {
        return `${item.name}×${item.quantity}`
      }
      return item.name
    })
    
    // 添加自定义配件
    if (this.data.formData.customAccessories) {
      accessoryList.push(this.data.formData.customAccessories)
    }
    
    this.setData({
      'formData.accessories': accessoryList.join('、')
    }, () => {
      this.validateStep2()
    })
  },

  // 图片上传
  chooseImages() {
    const maxCount = 6 - this.data.formData.images.length
    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadImages(res.tempFilePaths, 'images')
      }
    })
  },

  chooseSampleImages() {
    const maxCount = 6 - this.data.formData.sampleImages.length
    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.uploadImages(res.tempFilePaths, 'sampleImages')
      }
    })
  },

  async uploadImages(tempFilePaths, field) {
    wx.showLoading({ title: '上传中...' })
    
    try {
      const uploadPromises = tempFilePaths.map(filePath => {
        const cloudPath = `hosting/${field}/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
        return wx.cloud.uploadFile({
          cloudPath,
          filePath
        })
      })
      
      const results = await Promise.all(uploadPromises)
      const fileIDs = results.map(res => res.fileID)
      
      const currentImages = this.data.formData[field]
      this.setData({
        [`formData.${field}`]: [...currentImages, ...fileIDs]
      }, () => {
        if (field === 'images') {
          this.validateStep2()
        }
      })
      
      wx.hideLoading()
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '上传失败', icon: 'error' })
      console.error('上传图片失败:', error)
    }
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.formData.images
    images.splice(index, 1)
    this.setData({
      'formData.images': images
    }, () => {
      this.validateStep2()
    })
  },

  deleteSampleImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.formData.sampleImages
    images.splice(index, 1)
    this.setData({
      'formData.sampleImages': images
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: this.data.formData.images,
      current: url
    })
  },

  previewSampleImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: this.data.formData.sampleImages,
      current: url
    })
  },

  // 验证步骤2
  validateStep2() {
    const { deviceName, originalPrice, condition, accessories, images } = this.data.formData
    
    const isValid = deviceName && 
                   originalPrice && 
                   condition && 
                   accessories &&
                   images.length >= 1
    
    this.setData({
      isStep2Valid: isValid
    })
  },

  // ========== 步骤3：租金设置 ==========
  
  selectDepositRatio(e) {
    const ratio = parseInt(e.currentTarget.dataset.ratio)
    this.setData({
      'formData.depositRatio': ratio
    }, () => {
      this.calculateSuggestedRent()
    })
  },

  // 计算建议租金
  calculateSuggestedRent() {
    const { originalPrice, depositRatio } = this.data.formData
    if (!originalPrice || !depositRatio) return
    
    const deposit = originalPrice * (depositRatio / 100)
    
    const min = (deposit * 0.008).toFixed(2)
    const max = (deposit * 0.012).toFixed(2)
    const recommended = (deposit * 0.010).toFixed(2)
    
    const min2Days = (min * 2 * 0.95).toFixed(2)
    const max2Days = (max * 2 * 0.95).toFixed(2)
    
    const min3Days = (min * 3 * 0.90).toFixed(2)
    const max3Days = (max * 3 * 0.90).toFixed(2)
    
    this.setData({
      suggestedRent: {
        min: parseFloat(min),
        max: parseFloat(max),
        recommended: parseFloat(recommended),
        min2Days: parseFloat(min2Days),
        max2Days: parseFloat(max2Days),
        min3Days: parseFloat(min3Days),
        max3Days: parseFloat(max3Days)
      }
    }, () => {
      this.validateRent()
    })
  },

  // 验证租金
  validateRent() {
    const dailyRent = parseFloat(this.data.formData.dailyRent)
    if (!dailyRent) {
      this.setData({
        rentError: '',
        isStep3Valid: false
      })
      return
    }
    
    const { min, max } = this.data.suggestedRent
    const acceptableMin = min * 0.9  // 允许低10%
    const acceptableMax = max * 1.1  // 允许高10%
    
    if (dailyRent < acceptableMin) {
      this.setData({
        rentError: `租金过低，建议不低于 £${min}`,
        isStep3Valid: false
      })
    } else if (dailyRent > acceptableMax) {
      this.setData({
        rentError: `租金过高，建议不超过 £${max}`,
        isStep3Valid: false
      })
    } else {
      // 计算2日和3日租金
      const rent2Days = (dailyRent * 2 * 0.95).toFixed(2)
      const rent3Days = (dailyRent * 3 * 0.90).toFixed(2)
      
      // 计算预估月收益
      const monthRevenue = (dailyRent * 30 * 0.3 * 0.9).toFixed(2)  // 30天 × 30%出租率 × 90%分成
      
      this.setData({
        rentError: '',
        isStep3Valid: true,
        calculated2DayRent: parseFloat(rent2Days),
        calculated3DayRent: parseFloat(rent3Days),
        estimatedMonthRevenue: parseFloat(monthRevenue)
      })
    }
  },

  // ========== 步骤导航 ==========
  
  nextStep() {
    if (this.data.currentStep === 1) {
      if (!this.data.formData.subCategory) {
        return wx.showToast({ title: '请选择设备类型', icon: 'none' })
      }
      this.setData({ currentStep: 2 })
      
    } else if (this.data.currentStep === 2) {
      if (!this.data.isStep2Valid) {
        return wx.showToast({ title: '请完善必填信息', icon: 'none' })
      }
      this.setData({ currentStep: 3 })
      this.calculateSuggestedRent()
    }
  },

  prevStep() {
    if (this.data.currentStep > 1) {
      this.setData({
        currentStep: this.data.currentStep - 1
      })
    }
  },

  // ========== 提交审核 ==========
  
  async submitForReview() {
    if (!this.data.isStep3Valid) {
      return wx.showToast({ title: '请完善租金设置', icon: 'none' })
    }
    
    wx.showModal({
      title: '确认提交',
      content: '确认提交设备托管审核？审核时间为1-3个工作日',
      success: async (res) => {
        if (res.confirm) {
          await this.submitDevice()
        }
      }
    })
  },

  async submitDevice() {
    wx.showLoading({ title: '提交中...' })
    
    try {
      // 准备提交数据
      const submitData = {
        ...this.data.formData,
        depositAmount: this.data.formData.originalPrice * (this.data.formData.depositRatio / 100),
        rent2Days: this.data.calculated2DayRent,
        rent3Days: this.data.calculated3DayRent,
        suggestedRentMin: this.data.suggestedRent.min,
        suggestedRentMax: this.data.suggestedRent.max
      }
      
      // 调用云函数
      const res = await wx.cloud.callFunction({
        name: 'submitHostedDevice',
        data: submitData
      })
      
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showModal({
          title: '提交成功',
          content: '您的设备已提交审核，审核结果将在1-3个工作日内通知您',
          showCancel: false,
          success: () => {
            // 返回"我的"页面
            wx.navigateBack()
          }
        })
      } else {
        wx.showToast({
          title: res.result.message || '提交失败',
          icon: 'none'
        })
      }
      
    } catch (error) {
      wx.hideLoading()
      console.error('提交失败:', error)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'error'
      })
    }
  }
})

