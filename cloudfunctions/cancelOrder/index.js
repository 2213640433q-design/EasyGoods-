// 云函数：cancelOrder - 取消订单
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('🚫 cancelOrder 云函数被调用')
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { orderId, cancelReason } = event
  
  console.log('📋 取消订单参数:')
  console.log('  订单ID:', orderId)
  console.log('  取消原因:', cancelReason)
  console.log('  用户 openid:', openid)
  
  // 参数校验
  if (!orderId) {
    return {
      success: false,
      message: '订单ID不能为空'
    }
  }
  
  if (!cancelReason) {
    return {
      success: false,
      message: '请选择取消原因'
    }
  }
  
  try {
    // 1. 查询订单信息
    const orderResult = await db.collection('orders')
      .where({
        orderId: orderId,
        _openid: openid  // 确保只能取消自己的订单
      })
      .get()
    
    if (orderResult.data.length === 0) {
      console.log('❌ 订单不存在或无权限')
      return {
        success: false,
        message: '订单不存在或无权限'
      }
    }
    
    const order = orderResult.data[0]
    console.log('📦 订单信息:', order)
    
    // 2. 检查订单状态（只有待支付和待取件可以取消）
    if (order.status !== 'pending' && order.status !== 'paid') {
      console.log('❌ 订单状态不允许取消，当前状态:', order.status)
      return {
        success: false,
        message: '当前订单状态不允许取消'
      }
    }
    
    const now = new Date()
    
    // 3. 如果使用了优惠券，先退还优惠券（删除订单前）
    if (order.couponId) {
      console.log('🎟️ 订单使用了优惠券，开始退还...')
      console.log('  优惠券ID:', order.couponId)
      
      try {
        // 将优惠券状态改回 unused
        await db.collection('user_coupons')
          .doc(order.couponId)
          .update({
            data: {
              status: 'unused',
              usedOrderId: null,
              usedTime: null,
              updateTime: now
            }
          })
        
        console.log('✅ 优惠券已退还')
      } catch (couponError) {
        console.error('❌ 退还优惠券失败:', couponError)
        // 优惠券退还失败不影响订单取消
      }
    }
    
    // 4. 如果订单已支付，记录退款信息（模拟退款）
    if (order.status === 'paid') {
      console.log('💰 订单已支付，需要退款')
      console.log('  退款金额:', order.totalAmount || 0, '英镑')
      // 实际项目中应该调用微信退款API
      // 目前是模拟退款，直接删除订单
    }
    
    // 5. 删除订单（从数据库中完全移除）
    await db.collection('orders')
      .where({
        orderId: orderId,
        _openid: openid
      })
      .remove()
    
    console.log('✅ 订单已从数据库删除')
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 订单取消成功（已删除）')
    console.log('订单号:', orderId)
    console.log('取消原因:', cancelReason)
    console.log('原订单状态:', order.status)
    console.log('退款金额:', order.status === 'paid' ? order.totalAmount : 0, '英镑')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return {
      success: true,
      message: '订单已取消',
      data: {
        orderId: orderId,
        cancelTime: now,
        deletedFromDatabase: true,
        refundAmount: order.status === 'paid' ? order.totalAmount : 0
      }
    }
    
  } catch (error) {
    console.error('❌ 取消订单失败:', error)
    
    return {
      success: false,
      message: '取消订单失败，请稍后重试',
      error: error.message
    }
  }
}

