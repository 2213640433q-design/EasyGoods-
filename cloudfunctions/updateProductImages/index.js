// 云函数：更新商品图片
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 获取参数
  const { productId, sampleImages, introImage } = event
  
  console.log('📝 接收到更新请求:', {
    productId,
    sampleImages: sampleImages?.length || 0,
    introImage: introImage ? '有' : '无'
  })
  
  // 参数验证
  if (!productId) {
    return {
      success: false,
      message: '缺少商品ID参数',
      openid: wxContext.OPENID
    }
  }

  try {
    // 构建更新数据
    const updateData = {}
    
    if (sampleImages !== undefined) {
      updateData.sampleImages = sampleImages
    }
    
    if (introImage !== undefined) {
      updateData.introImage = introImage
    }
    
    console.log('🔄 准备更新:', updateData)
    
    // 更新商品信息
    const result = await db.collection('products')
      .doc(productId)
      .update({
        data: updateData
      })
    
    console.log('✅ 更新成功:', result)
    
    return {
      success: true,
      message: '商品图片更新成功',
      data: {
        updated: result.stats.updated,
        sampleImagesCount: sampleImages?.length || 0,
        hasIntroImage: !!introImage
      },
      openid: wxContext.OPENID
    }
    
  } catch (err) {
    console.error('❌ 更新失败:', err)
    return {
      success: false,
      message: '更新商品图片失败',
      error: err.message,
      openid: wxContext.OPENID
    }
  }
}

