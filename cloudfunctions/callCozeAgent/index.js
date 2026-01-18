// 云函数：callCozeAgent - 调用 Coze AI Agent
const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// ========== 配置区域 ==========
// 请在这里填写您的 Coze API 配置
const COZE_CONFIG = {
  apiKey: 'pat_LeJdSKbpb6yiu8qLKykEth6j3pQfAtSY8oKJy0cCMlSlQ8xQn3Y4151gFIqCX7PK',  // ✅ 修正：移除开头的 Y
  botId: '7571393353158819867',          // 替换为您的 Bot ID
  apiUrl: 'https://api.coze.cn/open_api/v2/chat',  // ✅ 修正为正确的 Coze API 地址
  
  // 可选配置
  model: 'gpt-4',                // 使用的模型
  temperature: 0.7,              // 温度参数（0-1），越高越随机
  maxTokens: 2000                // 最大返回token数
}
// ==============================

/**
 * 调用 Coze API
 * @param {string} userMessage - 用户消息
 * @param {Array} conversationHistory - 对话历史（可选）
 * @returns {Promise<string>} - AI 回复内容
 */
async function callCozeAPI(userMessage, conversationHistory = [], userId = 'wechat_user') {
  return new Promise((resolve, reject) => {
    // 生成或使用会话 ID（基于用户 ID，保持会话连续性）
    const conversationId = `conv_${userId}_${Date.now()}`
    
    // ✅ 构建请求数据 - 使用 v2 API 格式
    const postData = JSON.stringify({
      conversation_id: conversationId,
      bot_id: COZE_CONFIG.botId,
      user: userId,            // ✅ v2 API 使用 'user' 而不是 'user_id'
      query: userMessage,      // ✅ 直接使用 query 参数
      stream: false,           // 不使用流式响应
      auto_save_history: true, // 自动保存对话历史
      with_knowledge: true     // 🔥 关键参数：启用知识库查询！
    })

    // 配置请求选项
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    // 发起 HTTPS 请求
    const req = https.request(COZE_CONFIG.apiUrl, options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          console.log('✅ Coze API 响应:', response)

          // ✅ 根据 Coze v2 API 的响应格式提取回复内容
          if (response.code === 0 && response.messages && response.messages.length > 0) {
            // v2 API 返回格式：messages 数组
            // ✅ 只提取 type="answer" 的消息（真正的 AI 回复）
            const answerMessage = response.messages.find(msg => msg.type === 'answer')
            
            if (answerMessage) {
              const reply = answerMessage.content || answerMessage.text || '抱歉，我没有理解您的问题。'
              resolve(reply)
            } else {
              // 如果没有 answer 类型，使用最后一条消息
              const lastMessage = response.messages[response.messages.length - 1]
              const reply = lastMessage.content || lastMessage.text || '抱歉，我没有理解您的问题。'
              resolve(reply)
            }
          } else if (response.data && response.data.content) {
            // 备用格式
            resolve(response.data.content)
          } else {
            console.error('❌ Coze API 返回格式异常:', response)
            if (response.msg) {
              console.error('API 错误信息:', response.msg)
            }
            resolve('抱歉，服务暂时不可用，请稍后再试。')
          }
        } catch (error) {
          console.error('❌ 解析 Coze 响应失败:', error)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Coze API 请求失败:', error)
      reject(error)
    })

    // 发送请求数据
    req.write(postData)
    req.end()
  })
}

/**
 * 保存对话记录到数据库（可选）
 */
async function saveConversation(openid, userMessage, aiReply) {
  try {
    await db.collection('customer_conversations').add({
      data: {
        _openid: openid,
        userMessage,
        aiReply,
        timestamp: new Date(),
        source: 'coze_ai'
      }
    })
    console.log('💾 对话记录已保存')
  } catch (error) {
    console.error('❌ 保存对话记录失败:', error)
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  console.log('🤖 callCozeAgent 云函数被调用')
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { 
    message,              // 用户消息
    conversationHistory,  // 对话历史（可选）
    productContext        // 商品上下文（可选）
  } = event
  
  console.log('📩 用户消息:', message)
  console.log('👤 用户 openid:', openid)
  
  // 参数校验
  if (!message || typeof message !== 'string') {
    return {
      success: false,
      error: '消息内容不能为空'
    }
  }

  // 检查配置
  if (COZE_CONFIG.apiKey === 'YOUR_COZE_API_KEY' || COZE_CONFIG.botId === 'YOUR_BOT_ID') {
    console.error('❌ Coze 配置未设置')
    return {
      success: false,
      error: '服务配置错误，请联系管理员',
      fallbackReply: '您好！关于您的问题，我们会尽快为您处理。如需紧急帮助，请拨打客服电话。'
    }
  }

    try {
      // 如果有商品上下文，添加到消息中
      let enhancedMessage = message
      if (productContext) {
        enhancedMessage = `[用户正在咨询商品: ${productContext.name}, 价格: £${productContext.price}/天]\n用户问题: ${message}`
      }

      // 调用 Coze AI，传入用户的 openid 作为 userId
      const aiReply = await callCozeAPI(enhancedMessage, conversationHistory || [], openid)
    
    // 保存对话记录（可选）
    await saveConversation(openid, message, aiReply)
    
    console.log('✅ AI 回复成功:', aiReply)
    
    return {
      success: true,
      reply: aiReply,
      timestamp: new Date().getTime()
    }
    
  } catch (error) {
    console.error('❌ 调用 Coze AI 失败:', error)
    
    // 返回兜底回复
    return {
      success: false,
      error: error.message,
      fallbackReply: '抱歉，当前客服繁忙，请稍后再试。您也可以查看常见问题或留下联系方式，我们会尽快回复您。'
    }
  }
}

