// cloudfunctions/getOrderDetail/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 获取订单详情云函数
 * 
 * @param {Object} event - 事件参数
 * @param {String} event.orderId - 订单号（ORDER开头）或 _id
 * 
 * @returns {Object} 订单详情
 */
exports.main = async (event, context) => {
  console.log('📋 getOrderDetail 云函数被调用')
  console.log('📥 接收参数:', event)
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // ✅ 验证必填参数
    const { orderId } = event
    
    if (!orderId) {
      console.error('❌ 缺少必填参数: orderId')
      return {
        success: false,
        message: '缺少必填参数: orderId',
        code: 'MISSING_PARAM'
      }
    }
    
    console.log('🔍 查询订单:', orderId)
    
    // 🔍 构建查询条件
    // 支持通过 orderId 或 _id 查询
    let query
    if (orderId.startsWith('ORDER')) {
      // 通过订单号查询
      query = db.collection('orders').where({
        _openid: openid,
        orderId: orderId
      })
    } else {
      // 通过 _id 查询
      query = db.collection('orders').where({
        _openid: openid,
        _id: orderId
      })
    }
    
    // 📄 查询订单
    const orderResult = await query.get()
    
    if (orderResult.data.length === 0) {
      console.warn('⚠️ 订单不存在或无权限访问')
      return {
        success: false,
        message: '订单不存在或无权限访问',
        code: 'ORDER_NOT_FOUND'
      }
    }
    
    const order = orderResult.data[0]
    
    console.log('✅ 查询成功！')
    console.log('  订单号:', order.orderId)
    console.log('  状态:', order.status)
    console.log('  商品:', order.productName)
    console.log('  总额:', order.totalAmount, '英镑')
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '获取订单详情成功',
      data: order
    }
    
  } catch (err) {
    console.error('❌ 获取订单详情失败:', err)
    
    return {
      success: false,
      message: '获取订单详情失败: ' + err.message,
      error: err,
      code: 'GET_ORDER_DETAIL_FAILED'
    }
  }
}

