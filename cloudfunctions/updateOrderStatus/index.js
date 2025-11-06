// cloudfunctions/updateOrderStatus/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 更新订单状态云函数
 * 
 * @param {Object} event - 事件参数
 * @param {String} event.orderId - 订单号（ORDER开头）或 _id
 * @param {String} event.newStatus - 新状态
 *   - pending: 待支付
 *   - paid: 待取件
 *   - picked: 租赁中
 *   - returning: 归还中
 *   - checking: 检查中
 *   - completed: 已完成
 *   - cancelled: 已取消
 * @param {String} event.note - 备注（可选）
 * 
 * @returns {Object} 更新结果
 */
exports.main = async (event, context) => {
  console.log('🔄 updateOrderStatus 云函数被调用')
  console.log('📥 接收参数:', event)
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // ✅ 验证必填参数
    const { orderId, newStatus, note = '' } = event
    
    if (!orderId) {
      console.error('❌ 缺少必填参数: orderId')
      return {
        success: false,
        message: '缺少必填参数: orderId',
        code: 'MISSING_PARAM'
      }
    }
    
    if (!newStatus) {
      console.error('❌ 缺少必填参数: newStatus')
      return {
        success: false,
        message: '缺少必填参数: newStatus',
        code: 'MISSING_PARAM'
      }
    }
    
    // ✅ 验证状态合法性
    const validStatuses = ['pending', 'paid', 'picked', 'returning', 'checking', 'completed', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
      console.error('❌ 无效的状态值:', newStatus)
      return {
        success: false,
        message: `无效的状态值: ${newStatus}`,
        code: 'INVALID_STATUS'
      }
    }
    
    console.log('🔍 查询订单:', orderId)
    console.log('  新状态:', newStatus)
    
    // 🔍 先查询订单是否存在
    let query
    if (orderId.startsWith('ORDER')) {
      query = db.collection('orders').where({
        _openid: openid,
        orderId: orderId
      })
    } else {
      query = db.collection('orders').where({
        _openid: openid,
        _id: orderId
      })
    }
    
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
    const oldStatus = order.status
    
    console.log('  原状态:', oldStatus)
    console.log('  新状态:', newStatus)
    
    // 📝 构建更新数据
    const now = new Date()
    const updateData = {
      status: newStatus,
      updateTime: now
    }
    
    // 根据不同状态更新对应的时间戳
    switch (newStatus) {
      case 'paid':
        updateData.payTime = now
        console.log('  更新支付时间')
        break
      case 'picked':
        updateData.pickTime = now
        console.log('  更新取件时间')
        break
      case 'returning':
        updateData.returnTime = now
        console.log('  更新归还时间')
        break
      case 'checking':
        updateData.checkTime = now
        console.log('  更新检查时间')
        break
      case 'completed':
        updateData.completeTime = now
        console.log('  更新完成时间')
        break
      case 'cancelled':
        updateData.cancelTime = now
        if (note) {
          updateData.cancelReason = note
        }
        console.log('  更新取消时间')
        break
    }
    
    // 💾 更新订单
    console.log('💾 正在更新订单...')
    const updateResult = await db.collection('orders')
      .doc(order._id)
      .update({
        data: updateData
      })
    
    console.log('✅ 订单状态更新成功！')
    console.log('  受影响记录数:', updateResult.stats.updated)
    
    // 🎟️ 如果订单有优惠券且状态变为已支付，标记优惠券为已使用
    if (newStatus === 'paid' && order.couponId) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎟️ 开始标记优惠券为已使用')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('  订单号:', order.orderId)
      console.log('  用户优惠券ID:', order.couponId)
      console.log('  优惠券优惠:', order.couponDiscount, '英镑')
      
      try {
        // ✅ 直接用 doc() 更新指定的用户优惠券记录
        console.log('  正在更新优惠券状态...')
        const updateResult = await db.collection('user_coupons')
          .doc(order.couponId)  // order.couponId 是 user_coupons 的 _id
          .update({
            data: {
              status: 'used',
              usedOrderId: order.orderId,
              usedTime: now,
              updateTime: now
            }
          })
        
        console.log('✅ 优惠券已成功标记为已使用！')
        console.log('  受影响记录数:', updateResult.stats.updated)
        
        if (updateResult.stats.updated === 0) {
          console.warn('⚠️ 警告：受影响记录数为0，优惠券可能已被使用或不存在')
        }
      } catch (err) {
        console.error('❌ 标记优惠券失败（不影响订单）')
        console.error('  优惠券ID:', order.couponId)
        console.error('  错误类型:', err.errCode)
        console.error('  错误详情:', err.errMsg || err.message)
      }
    } else {
      if (newStatus === 'paid') {
        console.log('ℹ️ 订单已支付，但未使用优惠券')
      }
    }
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '订单状态更新成功',
      data: {
        orderId: order.orderId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        updateTime: now
      }
    }
    
  } catch (err) {
    console.error('❌ 更新订单状态失败:', err)
    
    return {
      success: false,
      message: '更新订单状态失败: ' + err.message,
      error: err,
      code: 'UPDATE_ORDER_STATUS_FAILED'
    }
  }
}

