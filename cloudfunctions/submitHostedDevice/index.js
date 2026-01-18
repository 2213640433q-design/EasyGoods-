// 提交托管设备云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('📦 提交托管设备，用户:', openid)
  console.log('📋 提交数据:', event)
  
  try {
    // 参数校验
    const {
      mainCategory,
      subCategory,
      deviceName,
      subtitle,
      originalPrice,
      purchaseDate,
      condition,
      deviceParams,
      accessories,
      customAccessories,
      images,
      sampleImages,
      description,
      depositRatio,
      depositAmount,
      dailyRent,
      rent2Days,
      rent3Days,
      suggestedRentMin,
      suggestedRentMax
    } = event
    
    // 必填字段验证
    if (!subCategory || !deviceName || !originalPrice || !condition || 
        !accessories || !images || images.length < 1 || 
        !depositRatio || !dailyRent) {
      return {
        success: false,
        message: '缺少必填字段'
      }
    }
    
    // 计算押金金额（如果没有传递）
    const calculatedDeposit = depositAmount || (originalPrice * (depositRatio / 100))
    
    // 计算多日租金（如果没有传递）
    const calculated2DayRent = rent2Days || (dailyRent * 2 * 0.95)
    const calculated3DayRent = rent3Days || (dailyRent * 3 * 0.90)
    
    // 获取用户信息（用于设置门店）
    let userCity = '南安普顿'  // 默认城市
    try {
      const userRes = await db.collection('users').where({
        _openid: openid
      }).get()
      
      if (userRes.data && userRes.data.length > 0) {
        userCity = userRes.data[0].city || userCity
      }
    } catch (error) {
      console.log('获取用户城市失败，使用默认值:', userCity)
    }
    
    // 根据城市设置可用门店
    const storesMap = {
      '南安普顿': ['南安普顿'],
      '格拉斯哥': ['格拉斯哥'],
      '伦敦': ['伦敦'],
      '曼彻斯特': ['曼彻斯特']
    }
    const stores = storesMap[userCity] || ['南安普顿', '格拉斯哥']
    
    // 如果副标题为空，自动生成
    const finalSubtitle = subtitle || `专业${subCategory}设备`
    
    // 准备数据
    const deviceData = {
      _openid: openid,
      
      // ========== 用户填写信息 ==========
      mainCategory: '摄影',
      subCategory,
      deviceName,
      subtitle: finalSubtitle,
      originalPrice: parseFloat(originalPrice),
      purchaseDate: purchaseDate || '',
      condition,
      
      deviceParams: deviceParams || '',
      description: description || '',
      accessories,
      customAccessories: customAccessories || '',
      
      images,
      sampleImages: sampleImages || [],
      
      depositRatio: parseInt(depositRatio),
      depositAmount: parseFloat(calculatedDeposit.toFixed(2)),
      dailyRent: parseFloat(dailyRent),
      rent2Days: parseFloat(calculated2DayRent.toFixed(2)),
      rent3Days: parseFloat(calculated3DayRent.toFixed(2)),
      
      suggestedRentMin: parseFloat(suggestedRentMin) || 0,
      suggestedRentMax: parseFloat(suggestedRentMax) || 0,
      
      // ========== 平台自动补充 ==========
      price: parseFloat(dailyRent),  // 用于列表展示
      deposit: parseFloat(calculatedDeposit.toFixed(2)),
      stores,
      stock: 1,
      rentedCount: 0,
      startRent: '托管设备1天起租',
      freeAccessories: '',  // 平台统一策略（暂时为空）
      
      // 审核状态
      status: 'pending',
      submitTime: Date.now(),
      reviewTime: null,
      reviewComment: '',
      reviewer: '',
      
      // 上架信息
      onlineTime: null,
      offlineTime: null,
      productId: '',
      totalOrders: 0,
      totalRevenue: 0,
      monthRevenue: 0,
      
      // 时间戳
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    console.log('💾 准备保存设备数据:', deviceData)
    
    // 保存到数据库
    const result = await db.collection('hosted_devices').add({
      data: deviceData
    })
    
    console.log('✅ 设备托管提交成功，ID:', result._id)
    
    return {
      success: true,
      deviceId: result._id,
      message: '提交成功，等待审核'
    }
    
  } catch (error) {
    console.error('❌ 提交托管设备失败:', error)
    return {
      success: false,
      message: '提交失败：' + error.message
    }
  }
}

