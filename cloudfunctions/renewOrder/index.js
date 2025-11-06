// cloudfunctions/renewOrder/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 续租订单
 * 功能：
 * 1. 更新订单的归还时间
 * 2. 增加租赁天数
 * 3. 记录续租费用
 * 4. 更新订单总金额
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId, renewEndDate, renewDays, renewPrice } = event
  
  try {
    console.log('🔄 处理续租请求')
    console.log('  订单号:', orderId)
    console.log('  续租至:', renewEndDate)
    console.log('  续租天数:', renewDays)
    console.log('  续租费用:', renewPrice)
    
    // 1. 获取原订单信息
    const orderRes = await db.collection('orders')
      .where({
        orderId: orderId,
        _openid: wxContext.OPENID
      })
      .get()
    
    if (orderRes.data.length === 0) {
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    const order = orderRes.data[0]
    
    // 2. 验证订单状态（只有租赁中状态才能续租）
    if (order.status !== 'picked') {
      return {
        success: false,
        message: '当前订单状态不允许续租'
      }
    }
    
    // 3. 初始化续租记录数组
    const renewHistory = order.renewHistory || []
    
    // 4. 添加本次续租记录
    renewHistory.push({
      renewDate: new Date().toISOString(),
      originalEndDate: order.rentalEndDate,
      newEndDate: renewEndDate,
      renewDays: renewDays,
      renewPrice: renewPrice,
      isPaid: true // 模拟支付成功
    })
    
    // 5. 计算新的租赁天数和总金额
    const newRentalDays = order.rentalDays + renewDays
    const newTotalRent = order.totalRent + renewPrice
    const newTotalAmount = order.totalAmount + renewPrice
    
    // 6. 更新订单
    await db.collection('orders')
      .doc(order._id)
      .update({
        data: {
          rentalEndDate: renewEndDate,
          rentalDays: newRentalDays,
          totalRent: newTotalRent,
          totalAmount: newTotalAmount,
          renewHistory: renewHistory,
          updateTime: db.serverDate()
        }
      })
    
    console.log('✅ 续租成功')
    console.log('  新归还时间:', renewEndDate)
    console.log('  新租赁天数:', newRentalDays)
    console.log('  新总金额:', newTotalAmount)
    
    return {
      success: true,
      message: '续租成功',
      data: {
        orderId: orderId,
        renewEndDate: renewEndDate,
        renewDays: renewDays,
        renewPrice: renewPrice,
        newRentalDays: newRentalDays,
        newTotalAmount: newTotalAmount
      }
    }
    
  } catch (error) {
    console.error('❌ 续租失败:', error)
    
    return {
      success: false,
      message: error.message || '续租失败',
      error: error
    }
  }
}

