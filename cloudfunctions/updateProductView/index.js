// 云函数：更新浏览记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 获取参数
  const { 
    productId,      // 商品ID（必需）
    productName,    // 商品名称（必需）
    productImage,   // 商品图片（可选）
    price          // 价格（可选）
  } = event
  
  // 参数验证
  if (!productId || !productName) {
    return {
      success: false,
      message: '缺少必需参数（productId 或 productName）',
      openid: wxContext.OPENID
    }
  }

  try {
    // 当前时间
    const now = new Date()
    
    // 检查是否已存在该商品的浏览记录
    const existingRecord = await db.collection('browse_history')
      .where({
        _openid: wxContext.OPENID,
        productId: productId
      })
      .limit(1)
      .get()
    
    if (existingRecord.data && existingRecord.data.length > 0) {
      // 如果已存在，更新浏览时间
      const recordId = existingRecord.data[0]._id
      
      await db.collection('browse_history')
        .doc(recordId)
        .update({
          data: {
            browseTime: now,
            // 更新商品信息（以防商品信息有变化）
            productName: productName,
            productImage: productImage || existingRecord.data[0].productImage,
            price: price !== undefined ? price : existingRecord.data[0].price
          }
        })
      
      console.log('更新浏览记录:', recordId)
      
      return {
        success: true,
        message: '更新浏览记录成功',
        action: 'update',
        recordId: recordId,
        openid: wxContext.OPENID
      }
    } else {
      // 如果不存在，创建新记录
      const addResult = await db.collection('browse_history')
        .add({
          data: {
            _openid: wxContext.OPENID,  // 🔥 明确添加 _openid 字段
            productId: productId,
            productName: productName,
            productImage: productImage || '',
            price: price || 0,
            browseTime: now
          }
        })
      
      console.log('创建浏览记录:', addResult._id)
      
      // 可选：限制浏览记录数量，只保留最近 100 条
      const allRecords = await db.collection('browse_history')
        .where({
          _openid: wxContext.OPENID
        })
        .orderBy('browseTime', 'desc')
        .skip(100)  // 跳过最新的 100 条
        .get()
      
      // 删除超过 100 条的旧记录
      if (allRecords.data && allRecords.data.length > 0) {
        const deletePromises = allRecords.data.map(record => {
          return db.collection('browse_history').doc(record._id).remove()
        })
        await Promise.all(deletePromises)
        console.log('清理了', allRecords.data.length, '条旧记录')
      }
      
      return {
        success: true,
        message: '创建浏览记录成功',
        action: 'create',
        recordId: addResult._id,
        openid: wxContext.OPENID
      }
    }
  } catch (err) {
    console.error('更新浏览记录失败:', err)
    return {
      success: false,
      message: '更新浏览记录失败',
      error: err.message,
      openid: wxContext.OPENID
    }
  }
}

