Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    totalNavHeight: 0,
    
    // 商品列表
    products: [],
    productNames: [],
    selectedProductIndex: 0,
    currentProduct: null,
    currentProductName: '',
    
    // 图片数据
    sampleImages: [],         // 拍摄样片
    introImage: ''            // 产品介绍长图
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const totalNavHeight = statusBarHeight + 44
    
    this.setData({
      statusBarHeight,
      totalNavHeight
    })
    
    // 加载商品列表
    this.loadProducts()
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 🌐 加载商品列表
  async loadProducts() {
    try {
      wx.showLoading({ title: '加载商品...' })
      
      const res = await wx.cloud.callFunction({
        name: 'getProducts',
        data: {
          page: 1,
          pageSize: 100
        }
      })
      
      wx.hideLoading()
      
      if (res.result && res.result.success) {
        const products = res.result.data || []
        const productNames = products.map(p => p.name)
        
        this.setData({
          products: products,
          productNames: productNames
        })
        
        console.log('✅ 加载了', products.length, '个商品')
      }
    } catch (err) {
      console.error('❌ 加载商品失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 选择商品
  onProductChange(e) {
    const index = e.detail.value
    const product = this.data.products[index]
    
    this.setData({
      selectedProductIndex: index,
      currentProduct: product,
      currentProductName: product.name,
      sampleImages: product.sampleImages || [],
      introImage: product.introImage || ''
    })
    
    console.log('✅ 选择商品:', product.name)
    console.log('📸 拍摄样片:', product.sampleImages || [])
    console.log('📄 产品介绍:', product.introImage || '无')
  },

  // 📤 上传拍摄样片
  onUploadSample() {
    wx.chooseImage({
      count: 9,  // 最多选择9张
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        
        wx.showLoading({ title: '上传中...' })
        
        // 上传到云存储
        const uploadPromises = tempFilePaths.map((filePath, index) => {
          const cloudPath = `products/samples/${this.data.currentProduct._id}_${Date.now()}_${index}.jpg`
          return wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: filePath
          })
        })
        
        Promise.all(uploadPromises).then(results => {
          wx.hideLoading()
          
          const newUrls = results.map(r => r.fileID)
          const sampleImages = this.data.sampleImages.concat(newUrls)
          
          this.setData({ sampleImages })
          
          wx.showToast({
            title: `上传成功！共${newUrls.length}张`,
            icon: 'success'
          })
          
          console.log('✅ 样片上传成功:', newUrls)
        }).catch(err => {
          wx.hideLoading()
          console.error('❌ 上传失败:', err)
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
        })
      }
    })
  },

  // 📤 上传产品介绍长图
  onUploadIntro() {
    wx.chooseImage({
      count: 1,  // 只选择1张
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        wx.showLoading({ title: '上传中...' })
        
        const cloudPath = `products/intro/${this.data.currentProduct._id}_${Date.now()}.jpg`
        
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath
        }).then(result => {
          wx.hideLoading()
          
          this.setData({ 
            introImage: result.fileID 
          })
          
          wx.showToast({
            title: '上传成功！',
            icon: 'success'
          })
          
          console.log('✅ 介绍长图上传成功:', result.fileID)
        }).catch(err => {
          wx.hideLoading()
          console.error('❌ 上传失败:', err)
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
        })
      }
    })
  },

  // 🗑️ 删除拍摄样片
  onDeleteSample(e) {
    const index = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张样片吗？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          const sampleImages = this.data.sampleImages.slice()
          sampleImages.splice(index, 1)
          
          this.setData({ sampleImages })
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 🗑️ 删除产品介绍长图
  onDeleteIntro() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除产品介绍长图吗？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          this.setData({ introImage: '' })
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 💾 保存到云端
  async onSave() {
    if (!this.data.currentProduct) {
      return wx.showToast({
        title: '请先选择商品',
        icon: 'none'
      })
    }
    
    wx.showLoading({ title: '保存中...' })
    
    try {
      // 🔄 调用云函数更新（解决权限问题）
      const res = await wx.cloud.callFunction({
        name: 'updateProductImages',
        data: {
          productId: this.data.currentProduct._id,
          sampleImages: this.data.sampleImages,
          introImage: this.data.introImage
        }
      })
      
      wx.hideLoading()
      
      console.log('📤 云函数返回:', res)
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '保存成功！',
          icon: 'success',
          duration: 2000
        })
        
        console.log('✅ 图片已更新到云端:', {
          商品ID: this.data.currentProduct._id,
          样片数量: this.data.sampleImages.length,
          介绍长图: this.data.introImage ? '已设置' : '未设置',
          更新记录数: res.result.data?.updated || 0
        })
      } else {
        // 云函数返回失败
        wx.showToast({
          title: res.result?.message || '保存失败',
          icon: 'none',
          duration: 2000
        })
        console.error('❌ 云函数返回失败:', res.result)
      }
      
    } catch (err) {
      wx.hideLoading()
      console.error('❌ 保存失败:', err)
      wx.showToast({
        title: '保存失败：' + err.message,
        icon: 'none',
        duration: 3000
      })
    }
  }
})

