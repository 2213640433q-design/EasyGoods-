// cloudfunctions/getOrders/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 获取订单列表云函数
 * 
 * @param {Object} event - 事件参数
 * @param {String} event.status - 订单状态筛选（可选）
 *   - '' 或 '全部': 所有订单
 *   - '待支付': pending
 *   - '待取件': paid
 *   - '租赁中': picked
 *   - '检查中': checking
 *   - '已完成': completed
 * @param {Number} event.page - 页码（默认1）
 * @param {Number} event.pageSize - 每页数量（默认20）
 * 
 * @returns {Object} 订单列表和分页信息
 */
exports.main = async (event, context) => {
  console.log('📋 getOrders 云函数被调用')
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
    const _ = db.command
    
    // 状态筛选映射
    const statusMap = {
      '待支付': 'pending',
      '待取件': 'paid',
      '租赁中': 'picked',
      '归还中': 'returning',
      '检查中': 'checking',
      '已完成': 'completed',
      '已取消': 'cancelled'
    }
    
    // 构建基础查询条件
    let whereCondition = {
      _openid: openid
    }
    
    // 如果指定了状态筛选
    if (status && status !== '全部' && status !== '') {
      const statusValue = statusMap[status] || status
      console.log('  筛选状态:', statusValue)
      whereCondition.status = statusValue
    } else {
      // 如果是查询全部，排除已取消的订单
      console.log('  查询全部订单（排除已取消）')
      whereCondition.status = _.neq('cancelled')
    }
    
    const finalQuery = db.collection('orders').where(whereCondition)
    
    // 📊 查询总数（用于分页）
    const countResult = await finalQuery.count()
    const total = countResult.total
    
    console.log('📊 订单总数:', total)
    
    // 📄 分页查询
    const skip = (page - 1) * pageSize
    const ordersResult = await finalQuery
      .orderBy('createTime', 'desc')  // 按创建时间倒序
      .skip(skip)
      .limit(pageSize)
      .get()
    
    const orders = ordersResult.data
    
    console.log('✅ 查询成功！')
    console.log('  当前页:', page)
    console.log('  返回数量:', orders.length)
    console.log('  总数:', total)
    
    // 🎉 返回成功结果
    return {
      success: true,
      message: '获取订单列表成功',
      data: orders,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
    
  } catch (err) {
    console.error('❌ 获取订单列表失败:', err)
    
    return {
      success: false,
      message: '获取订单列表失败: ' + err.message,
      error: err,
      code: 'GET_ORDERS_FAILED'
    }
  }
}

