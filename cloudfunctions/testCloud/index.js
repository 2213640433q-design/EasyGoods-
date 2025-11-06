// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    success: true,
    message: '🎉 恭喜！云开发环境配置成功！',
    data: {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      env: wxContext.ENV,
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Europe/London' }),
      receivedData: event  // 返回前端传来的数据
    }
  }
}

