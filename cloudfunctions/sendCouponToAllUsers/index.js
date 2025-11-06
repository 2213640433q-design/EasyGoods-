// cloudfunctions/sendCouponToAllUsers/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 批量发券云函数（管理员使用）- 灵活版
 * 
 * @param {Object} event - 事件参数
 * 
 * === 目标用户配置 ===
 * @param {String} event.targetType - 目标用户类型
 *   - 'all': 所有用户（有浏览/订单记录）
 *   - 'specific': 指定用户（需要提供 userList）
 *   - 'new': 新用户（无优惠券记录）
 * @param {Array} event.userList - 指定用户openid列表（targetType='specific'时必填）
 *   示例: ['oABC123xxx', 'oXYZ789xxx']
 * 
 * === 优惠券配置 ===
 * @param {String} event.couponName - 优惠券名称
 * @param {String} event.couponType - 优惠券类型
 *   - 'discount': 折扣券（如8折、9折）
 *   - 'reduce': 满减券（如满100减20）
 * 
 * === 折扣券参数 ===
 * @param {Number} event.discount - 折扣（仅discount类型）
 *   示例: 8 = 8折, 9 = 9折, 7.5 = 7.5折
 * @param {Number} event.minAmount - 最低消费金额（英镑）
 * @param {Number} event.maxDiscount - 最高优惠金额（英镑，可选）
 * 
 * === 满减券参数 ===
 * @param {Number} event.reduceAmount - 减免金额（仅reduce类型）
 *   示例: 20 = 减20英镑
 * 
 * === 其他参数 ===
 * @param {Number} event.quantity - 每人发放数量（默认1张）
 * @param {Number} event.daysValid - 有效天数（默认30天）
 * 
 * @returns {Object} 发放结果
 */
exports.main = async (event, context) => {
  console.log('🎁 sendCouponToAllUsers 云函数被调用（管理员功能）')
  console.log('📥 接收参数:', event)
  
  try {
    const wxContext = cloud.getWXContext()
    console.log('👤 调用者 openid:', wxContext.OPENID)
    
    // 📋 提取参数
    const {
      targetType = 'all',  // 目标用户类型
      userList = [],  // 指定用户列表
      couponName = '平台优惠券',
      couponType = 'discount',
      discount = 8,  // 8折（更直观的参数）
      reduceAmount = 10,  // 满减金额
      minAmount = 50,
      maxDiscount = null,
      quantity = 1,  // 每人发放数量
      daysValid = 30
    } = event
    
    // 🔧 根据优惠券类型计算 discountValue
    let discountValue
    if (couponType === 'discount') {
      // 折扣券：8折 → discountValue = 20 (100% - 80% = 20%)
      discountValue = 100 - (discount * 10)
    } else {
      // 满减券：直接使用 reduceAmount
      discountValue = reduceAmount
    }
    
    console.log('🎟️ 优惠券配置:')
    console.log('  名称:', couponName)
    console.log('  类型:', couponType === 'discount' ? '折扣券' : '满减券')
    if (couponType === 'discount') {
      console.log('  折扣:', discount, '折')
      console.log('  折扣率:', discount * 10 + '%')
    } else {
      console.log('  减免:', reduceAmount, '英镑')
    }
    console.log('  最低消费:', minAmount, '英镑')
    if (maxDiscount) {
      console.log('  最高优惠:', maxDiscount, '英镑')
    }
    console.log('  每人数量:', quantity, '张')
    console.log('  有效天数:', daysValid, '天')
    console.log('  目标用户:', targetType)
    
    // 🔍 根据 targetType 获取目标用户列表
    let targetOpenids = new Set()
    
    if (targetType === 'specific') {
      // 指定用户
      if (!userList || userList.length === 0) {
        console.error('❌ targetType=specific 时必须提供 userList')
        return {
          success: false,
          message: 'targetType=specific 时必须提供 userList',
          code: 'MISSING_USER_LIST'
        }
      }
      
      console.log('👥 指定用户:', userList.length, '个')
      userList.forEach(openid => targetOpenids.add(openid))
      
    } else if (targetType === 'new') {
      // 新用户（无优惠券记录）
      console.log('🔍 查找新用户（无优惠券记录）...')
      
      // 获取所有有浏览/订单记录的用户
      const browseUsers = await db.collection('browse_history')
        .field({ _openid: true })
        .get()
      
      const orderUsers = await db.collection('orders')
        .field({ _openid: true })
        .get()
      
      const allUsers = new Set()
      browseUsers.data.forEach(r => { if (r._openid) allUsers.add(r._openid) })
      orderUsers.data.forEach(r => { if (r._openid) allUsers.add(r._openid) })
      
      // 查询已有优惠券的用户
      const couponUsers = await db.collection('user_coupons')
        .field({ _openid: true })
        .get()
      
      const hasCoponUsers = new Set()
      couponUsers.data.forEach(r => { if (r._openid) hasCoponUsers.add(r._openid) })
      
      // 过滤出新用户（有浏览/订单但无优惠券）
      for (const openid of allUsers) {
        if (!hasCoponUsers.has(openid)) {
          targetOpenids.add(openid)
        }
      }
      
      console.log('👥 找到', targetOpenids.size, '个新用户')
      
    } else {
      // 所有活跃用户（默认）
      console.log('🔍 查找所有活跃用户...')
      
      const browseUsers = await db.collection('browse_history')
        .field({ _openid: true })
        .get()
      
      const orderUsers = await db.collection('orders')
        .field({ _openid: true })
        .get()
      
      browseUsers.data.forEach(r => { if (r._openid) targetOpenids.add(r._openid) })
      orderUsers.data.forEach(r => { if (r._openid) targetOpenids.add(r._openid) })
      
      console.log('👥 找到', targetOpenids.size, '个活跃用户')
    }
    
    const userCount = targetOpenids.size
    
    if (userCount === 0) {
      console.warn('⚠️ 没有符合条件的用户')
      return {
        success: true,
        message: '没有符合条件的用户',
        userCount: 0,
        successCount: 0
      }
    }
    
    // 🎟️ 创建优惠券模板
    const now = new Date()
    const endTime = new Date()
    endTime.setDate(endTime.getDate() + daysValid)
    
    const couponTemplate = {
      name: couponName,
      type: couponType,
      discountValue: discountValue,
      minAmount: minAmount,
      maxDiscount: maxDiscount || null,
      stock: userCount * quantity,  // 库存设置为用户数×数量
      receivedCount: 0,
      status: 'valid',
      startTime: now,
      endTime: endTime,
      createTime: now,
      description: `批量发放给${targetType === 'all' ? '所有用户' : targetType === 'new' ? '新用户' : '指定用户'}`
    }
    
    console.log('💾 创建优惠券模板...')
    const couponResult = await db.collection('coupons').add({
      data: couponTemplate
    })
    
    const couponId = couponResult._id
    console.log('✅ 优惠券模板创建成功，ID:', couponId)
    
    // 🎁 批量为用户发放优惠券
    console.log(`🎁 开始批量发放优惠券（每人${quantity}张）...`)
    
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    for (const openid of targetOpenids) {
      try {
        // 为每个用户发放指定数量的优惠券
        for (let i = 0; i < quantity; i++) {
          const userCoupon = {
            _openid: openid,
            couponId: couponId,
            couponName: couponName,
            couponType: couponType,
            discountValue: discountValue,
            minAmount: minAmount,
            maxDiscount: maxDiscount || null,
            startTime: now,
            endTime: endTime,
            status: 'unused',
            receiveTime: now,
            updateTime: now
          }
          
          await db.collection('user_coupons').add({
            data: userCoupon
          })
          
          successCount++
        }
        
        console.log(`  ✅ 用户 ${openid.substring(0, 10)}... 发放成功（${quantity}张）`)
      } catch (err) {
        console.error(`  ❌ 用户 ${openid.substring(0, 10)}... 发放失败:`, err.message)
        errorCount += quantity
        errors.push({
          openid: openid,
          error: err.message
        })
      }
    }
    
    // 📊 更新优惠券模板的领取数量
    await db.collection('coupons').doc(couponId).update({
      data: {
        receivedCount: successCount
      }
    })
    
    console.log('🎉 批量发放完成！')
    console.log('  目标用户数:', userCount)
    console.log('  每人数量:', quantity, '张')
    console.log('  成功发放:', successCount, '张')
    console.log('  失败数量:', errorCount, '张')
    
    if (errors.length > 0) {
      console.log('❌ 失败详情:', errors)
    }
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '批量发放完成',
      targetType: targetType,
      userCount: userCount,
      quantity: quantity,
      totalCoupons: successCount,
      successCount: successCount,
      errorCount: errorCount,
      errors: errors,
      couponId: couponId,
      couponInfo: {
        name: couponName,
        type: couponType,
        discount: couponType === 'discount' ? discount : null,
        reduceAmount: couponType === 'reduce' ? reduceAmount : null,
        minAmount: minAmount,
        daysValid: daysValid
      }
    }
    
  } catch (err) {
    console.error('❌ 批量发券失败:', err)
    
    return {
      success: false,
      message: '批量发券失败: ' + err.message,
      error: err,
      code: 'SEND_COUPON_TO_ALL_FAILED'
    }
  }
}

