// 云函数：获取用户手机号
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { code } = event
  const wxContext = cloud.getWXContext()
  
  console.log('📱 开始获取用户手机号, code:', code)
  
  try {
    // 调用微信接口获取手机号
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    })
    
    console.log('✅ 获取手机号成功:', result)
    
    // 注意：微信接口返回的是 phoneInfo（驼峰命名），不是 phone_info
    if (result.errCode === 0 && result.phoneInfo) {
      const phoneInfo = result.phoneInfo
      
      console.log('✅ 解析手机号信息:', phoneInfo.purePhoneNumber)
      
      // 返回手机号信息
      return {
        success: true,
        data: {
          phoneNumber: phoneInfo.phoneNumber,        // 用户绑定的手机号（国外手机号会有区号）
          purePhoneNumber: phoneInfo.purePhoneNumber, // 没有区号的手机号
          countryCode: phoneInfo.countryCode,        // 区号
          watermark: phoneInfo.watermark             // 数据水印
        },
        openid: wxContext.OPENID
      }
    } else {
      console.error('❌ 获取手机号失败:', result)
      return {
        success: false,
        errMsg: '获取手机号失败',
        errCode: result.errCode
      }
    }
  } catch (err) {
    console.error('❌ 获取手机号异常:', err)
    return {
      success: false,
      errMsg: err.message || '获取手机号异常',
      error: err
    }
  }
}
