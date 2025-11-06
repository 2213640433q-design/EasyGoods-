// 云函数：updateUserInfo - 更新用户信息
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('📝 updateUserInfo 云函数被调用')
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('👤 用户 openid:', openid)
  
  // 提取参数
  const {
    nickname,
    avatar,
    gender,
    birthday,
    school,
    city,
    postcode,
    phone
  } = event
  
  try {
    // 构建更新数据
    const updateData = {
      updateTime: new Date()
    }
    
    // 只更新提供的字段
    if (nickname !== undefined) updateData.nickname = nickname
    if (avatar !== undefined) updateData.avatar = avatar
    if (gender !== undefined) updateData.gender = gender
    if (birthday !== undefined) updateData.birthday = birthday
    if (school !== undefined) updateData.school = school
    if (city !== undefined) updateData.city = city
    if (postcode !== undefined) updateData.postcode = postcode
    if (phone !== undefined) updateData.phone = phone
    
    console.log('📋 更新字段:', Object.keys(updateData).join(', '))
    
    // 检查用户是否已存在
    const existResult = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()
    
    if (existResult.data && existResult.data.length > 0) {
      // 用户已存在，更新信息
      console.log('🔄 更新现有用户信息...')
      
      const result = await db.collection('users')
        .where({ _openid: openid })
        .update({
          data: updateData
        })
      
      console.log('✅ 用户信息更新成功')
      
      return {
        success: true,
        message: '用户信息更新成功',
        updated: result.stats.updated
      }
      
    } else {
      // 用户不存在，创建新记录
      console.log('➕ 创建新用户记录...')
      
      updateData._openid = openid
      updateData.createTime = new Date()
      
      const result = await db.collection('users').add({
        data: updateData
      })
      
      console.log('✅ 用户信息创建成功, ID:', result._id)
      
      return {
        success: true,
        message: '用户信息创建成功',
        userId: result._id
      }
    }
    
  } catch (error) {
    console.error('❌ 更新用户信息失败:', error)
    
    return {
      success: false,
      message: '更新用户信息失败',
      error: error.message
    }
  }
}

