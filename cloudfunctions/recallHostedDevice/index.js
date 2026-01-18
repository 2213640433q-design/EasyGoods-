// 召回托管设备云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { deviceId, reason } = event
  
  console.log('🔙 召回托管设备，用户:', openid, '设备ID:', deviceId)
  
  try {
    // 检查设备是否存在且属于当前用户
    const deviceRes = await db.collection('hosted_devices')
      .where({
        _id: deviceId,
        _openid: openid
      })
      .get()
    
    if (!deviceRes.data || deviceRes.data.length === 0) {
      return {
        success: false,
        message: '设备不存在或无权操作'
      }
    }
    
    const device = deviceRes.data[0]
    
    // 检查设备状态
    if (device.status !== 'online') {
      return {
        success: false,
        message: '只能召回已上架的设备'
      }
    }
    
    // TODO: 检查设备是否在租（需要查询订单表）
    // 这里先简化处理，假设没有在租
    
    // 更新设备状态
    await db.collection('hosted_devices')
      .doc(deviceId)
      .update({
        data: {
          status: 'recalled',
          offlineTime: Date.now(),
          recallReason: reason || '用户主动召回',
          updatedAt: Date.now()
        }
      })
    
    // TODO: 如果设备已上架到products集合，需要下架
    if (device.productId) {
      await db.collection('products')
        .doc(device.productId)
        .update({
          data: {
            status: 'invalid',
            updatedAt: Date.now()
          }
        })
    }
    
    console.log('✅ 设备召回成功')
    
    return {
      success: true,
      message: '召回成功'
    }
    
  } catch (error) {
    console.error('❌ 召回设备失败:', error)
    return {
      success: false,
      message: '召回失败：' + error.message
    }
  }
}

