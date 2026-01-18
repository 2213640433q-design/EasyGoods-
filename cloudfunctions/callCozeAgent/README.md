# 🤖 Coze AI Agent 云函数

## 功能说明

这个云函数用于调用您在 Coze 平台搭建的 AI Agent，实现智能客服功能。

## 📋 配置步骤

### 1. 获取 Coze API 凭证

1. 登录 [Coze 平台](https://www.coze.cn/)
2. 进入您的 Bot 页面
3. 获取以下信息：
   - **API Key**: 在设置 → API 密钥中获取
   - **Bot ID**: 在 Bot 详情页面可以看到

### 2. 修改云函数配置

打开 `index.js` 文件，找到配置区域：

```javascript
const COZE_CONFIG = {
  apiKey: 'YOUR_COZE_API_KEY',  // 替换为您的 Coze API Key
  botId: 'YOUR_BOT_ID',          // 替换为您的 Bot ID
  apiUrl: 'https://api.coze.cn/v1/conversation/message/create',
  
  // 可选配置
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
}
```

将 `YOUR_COZE_API_KEY` 和 `YOUR_BOT_ID` 替换为实际的值。

### 3. 安装依赖并上传云函数

```bash
# 进入云函数目录
cd cloudfunctions/callCozeAgent

# 安装依赖
npm install

# 上传云函数（在微信开发者工具中右键上传）
```

### 4. 创建数据库集合（可选）

如果需要保存对话记录，在云开发控制台创建集合：

**集合名称**: `customer_conversations`

**权限设置**:
```json
{
  "read": "auth",
  "write": false
}
```

**索引**（推荐）:
- `_openid`: 升序
- `timestamp`: 降序

## 🚀 使用方法

### 基础调用

```javascript
const res = await wx.cloud.callFunction({
  name: 'callCozeAgent',
  data: {
    message: '这款相机的租金是多少？'
  }
})

if (res.result.success) {
  const aiReply = res.result.reply
  console.log('AI 回复:', aiReply)
} else {
  // 使用兜底回复
  const fallbackReply = res.result.fallbackReply
  console.log('兜底回复:', fallbackReply)
}
```

### 携带对话历史

```javascript
const res = await wx.cloud.callFunction({
  name: 'callCozeAgent',
  data: {
    message: '那租期有限制吗？',
    conversationHistory: [
      { role: 'user', content: '这款相机的租金是多少？' },
      { role: 'assistant', content: '这款相机的租金是 £5/天' }
    ]
  }
})
```

### 携带商品上下文

```javascript
const res = await wx.cloud.callFunction({
  name: 'callCozeAgent',
  data: {
    message: '这个商品怎么样？',
    productContext: {
      name: 'Sony A7III 相机',
      price: 5
    }
  }
})
```

## 📊 返回数据格式

### 成功响应

```json
{
  "success": true,
  "reply": "AI 生成的回复内容",
  "timestamp": 1699999999999
}
```

### 失败响应（带兜底回复）

```json
{
  "success": false,
  "error": "错误信息",
  "fallbackReply": "兜底回复内容"
}
```

## 🔧 自定义配置

### 调整 AI 参数

在 `COZE_CONFIG` 中修改：

- **temperature**: 控制回复的随机性（0-1）
  - 0.3-0.5: 更准确、一致
  - 0.7-0.9: 更有创意、多样
  
- **maxTokens**: 最大返回长度
  - 建议范围：500-2000

### 修改 API 地址

根据 Coze 平台的实际 API 文档，可能需要调整：
- 国内版：`https://api.coze.cn/...`
- 国际版：`https://api.coze.com/...`

## ⚠️ 注意事项

1. **API Key 安全**: 
   - ✅ 只在云函数中配置 API Key
   - ❌ 不要在小程序端代码中暴露 API Key

2. **费用控制**:
   - Coze API 可能按调用次数或 Token 数量计费
   - 建议设置用量限制和监控

3. **响应时间**:
   - AI 接口响应时间一般 2-5 秒
   - 建议在前端显示"正在输入..."的加载状态

4. **兜底策略**:
   - 云函数内置了兜底回复逻辑
   - 当 AI 服务不可用时，会返回预设回复

5. **对话记录**:
   - 默认会保存对话记录到数据库
   - 可以在 `saveConversation` 函数中禁用或修改

## 🐛 常见问题

### 1. 返回 "服务配置错误"
- 检查是否正确配置了 `apiKey` 和 `botId`
- 确认没有使用默认的占位符值

### 2. 返回 "网络请求失败"
- 检查云函数网络权限
- 确认 Coze API 地址正确
- 查看云函数日志获取详细错误

### 3. AI 回复不符合预期
- 在 Coze 平台调整 Bot 的提示词和训练数据
- 调整 `temperature` 参数
- 提供更详细的上下文信息

### 4. 响应速度慢
- Coze API 响应时间取决于模型和负载
- 可以考虑：
  - 使用更快的模型
  - 减少 `maxTokens` 值
  - 缓存常见问题的回复

## 📚 相关文档

- [Coze 官方文档](https://www.coze.cn/docs)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [小程序客服系统集成指南](../customer-service/README.md)

## 🔄 版本历史

- **v1.0.0** (2024-11-11)
  - 初始版本
  - 支持基础消息对话
  - 支持对话历史和商品上下文
  - 包含兜底回复逻辑
  - 自动保存对话记录

