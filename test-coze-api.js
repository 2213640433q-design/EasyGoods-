// test-coze-api.js
// 直接测试 Coze API（不通过云函数）

const https = require('https')

// ========== 配置区域 ==========
const COZE_CONFIG = {
  apiKey: 'pat_xg4vzsuzghngtypDE5rEDVAtlCbmclINMDthrHfakWzQylNI1BqdfmWyX6BeKITR',
  botId: '7571393353158819867',
  apiUrl: 'https://api.coze.cn/open_api/v2/chat'  // ✅ 修正为正确的 API 端点
}

// 测试消息
const TEST_MESSAGE = '你好，我想了解相机租赁的价格'
// ==============================

function testCozeAPI(message) {
  return new Promise((resolve, reject) => {
    // 生成唯一的会话 ID（每次测试使用新的会话）
    const conversationId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // ✅ 使用正确的 v2 API 格式
    const postData = JSON.stringify({
      conversation_id: conversationId,
      bot_id: COZE_CONFIG.botId,
      user: 'test_user',       // 注意：v2 API 使用 'user' 而不是 'user_id'
      query: message,          // 直接使用 query 参数
      stream: false,
      auto_save_history: true, // 自动保存对话历史
      with_knowledge: true     // 🔥 关键参数：启用知识库查询！
    })

    const url = new URL(COZE_CONFIG.apiUrl)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    console.log('╔════════════════════════════════════════╗')
    console.log('║       Coze API 直接测试工具           ║')
    console.log('╚════════════════════════════════════════╝\n')
    console.log('📤 发送消息:', message)
    console.log('🔗 API 地址:', COZE_CONFIG.apiUrl)
    console.log('🤖 Bot ID:', COZE_CONFIG.botId)
    console.log('📋 请求体:', JSON.stringify(JSON.parse(postData), null, 2))
    console.log('⏳ 等待回复...\n')

    const startTime = Date.now()

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        const duration = Date.now() - startTime
        
        try {
          const response = JSON.parse(data)
          
          console.log(`✅ API 响应成功！（耗时: ${duration}ms）`)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
          console.log('📊 完整响应:')
          console.log(JSON.stringify(response, null, 2))
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          
          // ✅ 提取回复内容 - v2 API 响应格式
          let replyFound = false
          
          if (response.code === 0) {
            // 成功响应
            if (response.messages && response.messages.length > 0) {
              // ✅ 只提取 type="answer" 的消息（真正的 AI 回复）
              const answerMessage = response.messages.find(msg => msg.type === 'answer')
              
              if (answerMessage) {
                console.log('\n💬 AI 回复:')
                console.log(answerMessage.content || answerMessage.text)
                replyFound = true
                
                // 显示推荐的后续问题（如果有）
                const followUps = response.messages.filter(msg => msg.type === 'follow_up')
                if (followUps.length > 0) {
                  console.log('\n💡 推荐的后续问题:')
                  followUps.forEach((msg, index) => {
                    console.log(`   ${index + 1}. ${msg.content}`)
                  })
                }
              } else {
                // 如果没有 answer 类型，显示所有消息
                console.log('\n💬 完整消息列表:')
                response.messages.forEach((msg, index) => {
                  console.log(`   [${msg.type}] ${msg.content}`)
                })
                replyFound = true
              }
            } else if (response.data && response.data.content) {
              console.log('\n💬 AI 回复:')
              console.log(response.data.content)
              replyFound = true
            }
          } else {
            // 错误响应
            console.log('\n❌ API 返回错误!')
            console.log('错误代码:', response.code)
            console.log('错误信息:', response.msg || response.message || '未知错误')
            replyFound = true  // 标记为已处理
          }
          
          if (!replyFound) {
            console.log('\n⚠️  无法从响应中提取回复内容')
            console.log('请检查上面的完整响应，根据实际格式调整代码')
          }
          
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
          resolve(response)
          
        } catch (error) {
          console.error('❌ 解析响应失败:', error.message)
          console.log('\n原始响应数据:')
          console.log(data)
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      const duration = Date.now() - startTime
      console.error(`\n❌ 请求失败！（耗时: ${duration}ms）`)
      console.error('错误信息:', error.message)
      console.log('\n可能的原因:')
      console.log('  1. 网络连接问题')
      console.log('  2. API Key 无效')
      console.log('  3. Bot ID 错误')
      console.log('  4. API 地址错误')
      console.log('\n请检查配置并重试。\n')
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

// 执行测试
testCozeAPI(TEST_MESSAGE)
  .then(() => {
    console.log('🎉 测试完成！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n测试失败，请检查配置和网络。')
    process.exit(1)
  })

