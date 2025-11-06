// cloudfunctions/getUserCoupons/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 获取用户优惠券列表云函数
 * 
 * @param {Object} event - 事件参数
 * @param {String} event.status - 优惠券状态筛选（可选）
 *   - '' 或 '全部': 所有优惠券
 *   - 'unused': 未使用
 *   - 'used': 已使用
 *   - 'expired': 已过期
 * @param {Number} event.page - 页码（默认1）
 * @param {Number} event.pageSize - 每页数量（默认20）
 * 
 * @returns {Object} 优惠券列表和分页信息
 */
exports.main = async (event, context) => {
  console.log('🎟️ getUserCoupons 云函数被调用')
  console.log('📥 接收参数:', event)
  
  try {
    // 🔐 获取用户身份
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('👤 当前用户 openid:', openid)
    
    // 📋 提取参数
    const {
      status = '',  // 状态筛选
      page = 1,     // 页码
      pageSize = 20 // 每页数量
    } = event
    
    console.log('📊 查询参数:')
    console.log('  状态筛选:', status || '全部')
    console.log('  页码:', page)
    console.log('  每页数量:', pageSize)
    
    // 🔍 构建查询条件
    const whereCondition = {
      _openid: openid  // 只查询当前用户的优惠券
    }
    
    // 如果指定了状态，添加状态过滤
    if (status && status !== '全部' && status !== '') {
      whereCondition.status = status
    }
    
    const query = db.collection('user_coupons').where(whereCondition)
    
    // 📊 查询总数（用于分页）
    const countResult = await query.count()
    const total = countResult.total
    
    console.log('📊 优惠券总数:', total)
    
    // 📄 分页查询
    const skip = (page - 1) * pageSize
    const couponsResult = await query
      .orderBy('receiveTime', 'desc')  // 按领取时间倒序
      .skip(skip)
      .limit(pageSize)
      .get()
    
    let coupons = couponsResult.data
    
    // 🔧 自动更新过期状态
    const now = new Date()
    const updatePromises = []
    
    coupons = coupons.map(coupon => {
      // 检查是否过期
      if (coupon.status === 'unused' && new Date(coupon.endTime) < now) {
        console.log('  优惠券已过期:', coupon.couponName)
        coupon.status = 'expired'
        
        // 异步更新数据库状态
        updatePromises.push(
          db.collection('user_coupons').doc(coupon._id).update({
            data: {
              status: 'expired',
              updateTime: now
            }
          })
        )
      }
      return coupon
    })
    
    // 批量更新过期优惠券
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
      console.log('  已更新', updatePromises.length, '张过期优惠券')
    }
    
    console.log('✅ 查询成功！')
    console.log('  当前页:', page)
    console.log('  返回数量:', coupons.length)
    console.log('  总数:', total)
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '获取优惠券列表成功',
      data: coupons,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
    
  } catch (err) {
    console.error('❌ 获取优惠券列表失败:', err)
    
    return {
      success: false,
      message: '获取优惠券列表失败: ' + err.message,
      error: err,
      code: 'GET_USER_COUPONS_FAILED'
    }
  }
}

