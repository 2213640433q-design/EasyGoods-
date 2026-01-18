# 🤖 Coze AI 客服系统集成指南

## 📝 目录

1. [系统概述](#系统概述)
2. [前置准备](#前置准备)
3. [配置步骤](#配置步骤)
4. [部署云函数](#部署云函数)
5. [测试验证](#测试验证)
6. [常见问题](#常见问题)
7. [进阶配置](#进阶配置)

---

## 系统概述

本项目已完成 Coze AI Agent 的集成，将智能客服功能接入到您的租赁小程序中。

### ✨ 功能特点

- ✅ **智能对话**: 调用您在 Coze 平台搭建的 AI Agent
- ✅ **对话历史**: 自动保持上下文，支持连续对话
- ✅ **商品上下文**: 自动识别用户正在咨询的商品
- ✅ **兜底策略**: AI 不可用时使用预设回复，保证服务可用
- ✅ **加载提示**: 显示"正在输入..."动画，提升用户体验
- ✅ **对话记录**: 自动保存对话到数据库（可选）

### 📁 相关文件

```
/cloudfunctions/callCozeAgent/     # Coze AI 云函数
  ├── index.js                      # 主逻辑
  ├── config.json                   # 权限配置
  ├── package.json                  # 依赖配置
  └── README.md                     # 详细说明

/pages/customer-service/            # 客服页面
  ├── index.js                      # 已集成 AI 调用
  ├── index.wxml                    # 已添加输入提示
  ├── index.wxss                    # 已添加动画样式
  └── README.md                     # 页面说明
```

---

## 前置准备

### 1. 注册 Coze 账号

1. 访问 [Coze 官网](https://www.coze.cn/)（国内版）或 [Coze.com](https://www.coze.com/)（国际版）
2. 使用手机号或邮箱注册账号
3. 完成实名认证（如需要）

### 2. 创建 AI Bot

1. 登录 Coze 平台
2. 点击「创建 Bot」
3. 配置 Bot 信息：
   - **名称**: 租赁小程序客服
   - **描述**: 专业的租赁咨询客服
   - **场景**: 客服咨询

4. 设置 Bot 的知识库（重要）：
   - 添加商品信息
   - 添加租赁流程说明
   - 添加常见问题解答
   - 添加公司政策（押金、租期等）

5. 训练和测试 Bot：
   - 在 Coze 平台内测试对话效果
   - 调整提示词和参数
   - 确保回复质量满意

### 3. 获取 API 凭证

在 Coze 平台获取以下信息：

1. **API Key（访问令牌）**：
   - 进入「设置」→「开发者选项」
   - 点击「创建 API Key」
   - 复制并保存 API Key（只显示一次！）

2. **Bot ID**：
   - 在 Bot 详情页面查看
   - 通常在 URL 中或设置页面中

> ⚠️ **重要**: API Key 非常重要，请妥善保管，不要泄露给他人！

---

## 配置步骤

### 步骤 1: 配置云函数

打开文件：`cloudfunctions/callCozeAgent/index.js`

找到配置区域（第 12-22 行）：

```javascript
// ========== 配置区域 ==========
const COZE_CONFIG = {
  apiKey: 'YOUR_COZE_API_KEY',  // 替换为您的 Coze API Key
  botId: 'YOUR_BOT_ID',          // 替换为您的 Bot ID
  apiUrl: 'https://api.coze.cn/v1/conversation/message/create',
  
  // 可选配置
  model: 'gpt-4',                // 使用的模型
  temperature: 0.7,              // 温度参数（0-1）
  maxTokens: 2000                // 最大返回token数
}
// ==============================
```

**修改配置**：

1. 将 `YOUR_COZE_API_KEY` 替换为您的 API Key
2. 将 `YOUR_BOT_ID` 替换为您的 Bot ID
3. 根据需要调整其他参数

**示例**：

```javascript
const COZE_CONFIG = {
  apiKey: 'coze_1234567890abcdef',  // 实际的 API Key
  botId: 'bot_abc123xyz',            // 实际的 Bot ID
  apiUrl: 'https://api.coze.cn/v1/conversation/message/create',
  
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
}
```

### 步骤 2: 创建数据库集合（可选）

如果需要保存对话记录，在微信云开发控制台创建集合：

1. 打开「云开发控制台」→「数据库」
2. 点击「添加集合」
3. 集合名称：`customer_conversations`
4. 设置权限：

```json
{
  "read": "auth",
  "write": false
}
```

5. 创建索引（提升查询性能）：
   - `_openid`: 升序
   - `timestamp`: 降序

> 💡 如果不需要保存对话记录，可以在云函数中注释掉 `saveConversation` 的调用。

---

## 部署云函数

### 方法 1: 使用微信开发者工具（推荐）

1. 打开微信开发者工具
2. 展开左侧「云开发」→「云函数」
3. 右键点击 `callCozeAgent` 文件夹
4. 选择「上传并部署：云端安装依赖」
5. 等待部署完成（约 1-2 分钟）

### 方法 2: 使用命令行

```bash
# 进入云函数目录
cd cloudfunctions/callCozeAgent

# 安装依赖
npm install

# 回到项目根目录
cd ../..

# 使用微信开发者工具命令行上传
# （需要先配置 cli 工具）
```

### 验证部署

1. 在云开发控制台查看「云函数」列表
2. 确认 `callCozeAgent` 显示为「已部署」
3. 点击「详情」查看部署信息
4. 点击「日志」可以查看调用日志

---

## 测试验证

### 1. 测试云函数

在微信开发者工具中测试云函数：

1. 打开「云开发」→「云函数」→ `callCozeAgent`
2. 点击「云函数测试」
3. 输入测试数据：

```json
{
  "message": "你好，我想了解相机租赁的价格"
}
```

4. 点击「运行测试」
5. 查看返回结果：

**成功响应示例**：
```json
{
  "success": true,
  "reply": "您好！关于相机租赁，我们提供多种型号...",
  "timestamp": 1699999999999
}
```

**失败响应示例**（配置错误）：
```json
{
  "success": false,
  "error": "服务配置错误，请联系管理员",
  "fallbackReply": "您好！关于您的问题，我们会尽快为您处理..."
}
```

### 2. 测试客服页面

在小程序中测试完整流程：

1. **进入客服页面**：
   - 方法 1: 从商品详情页点击「客服」按钮
   - 方法 2: 从「我的」页面点击「在线客服」

2. **发送测试消息**：
   ```
   - "你好"
   - "相机租金多少？"
   - "租期有什么要求？"
   - "押金怎么退？"
   ```

3. **观察效果**：
   - ✅ 发送消息后显示"正在输入..."动画
   - ✅ 2-5 秒后收到 AI 回复
   - ✅ 回复内容符合预期
   - ✅ 对话可以连续进行

4. **测试商品咨询**：
   - 从商品详情页进入客服
   - 确认显示商品快捷栏
   - 点击「发送商品」
   - 咨询商品相关问题

### 3. 查看日志

**小程序端日志**：
```
🤖 调用 Coze AI... {message: "你好", conversationHistory: [...]}
✅ Coze AI 响应: {success: true, reply: "您好！..."}
```

**云函数日志**（在云开发控制台查看）：
```
🤖 callCozeAgent 云函数被调用
📩 用户消息: 你好
👤 用户 openid: o1a2b3c4...
✅ Coze API 响应: {...}
✅ AI 回复成功: 您好！...
💾 对话记录已保存
```

---

## 常见问题

### ❌ 问题 1: 返回"服务配置错误"

**原因**：未正确配置 API Key 或 Bot ID

**解决方法**：
1. 检查 `index.js` 中的 `COZE_CONFIG`
2. 确认已替换占位符为实际值
3. 重新上传云函数

### ❌ 问题 2: 请求超时

**原因**：
- Coze API 响应慢
- 网络问题
- API 配额用完

**解决方法**：
1. 检查 Coze 平台的服务状态
2. 查看云函数日志中的详细错误
3. 检查 API 配额是否足够
4. 考虑增加请求超时时间

### ❌ 问题 3: AI 回复不理想

**原因**：Bot 训练不足或提示词不够清晰

**解决方法**：
1. 在 Coze 平台优化 Bot：
   - 丰富知识库内容
   - 调整系统提示词
   - 增加训练样本
2. 调整 `temperature` 参数：
   - 降低（0.3-0.5）→ 更准确一致
   - 提高（0.7-0.9）→ 更有创意
3. 提供更多上下文信息

### ❌ 问题 4: 对话记录未保存

**原因**：数据库集合未创建或权限设置错误

**解决方法**：
1. 在云开发控制台创建 `customer_conversations` 集合
2. 设置正确的权限配置
3. 查看云函数日志中的保存错误

### ❌ 问题 5: API Key 泄露怎么办

**解决方法**：
1. 立即在 Coze 平台删除该 API Key
2. 生成新的 API Key
3. 更新云函数配置
4. 重新部署云函数

---

## 进阶配置

### 1. 自定义 AI 参数

在 `COZE_CONFIG` 中调整：

```javascript
const COZE_CONFIG = {
  // ... 其他配置

  // 回复随机性（0-1）
  temperature: 0.7,    // 0.3: 更保守准确, 0.9: 更有创意
  
  // 最大回复长度
  maxTokens: 2000,     // 500-4000，根据需要调整
  
  // 使用的模型
  model: 'gpt-4'       // 或 'gpt-3.5-turbo'（更快更便宜）
}
```

### 2. 优化对话历史

修改 `pages/customer-service/index.js` 第 131 行：

```javascript
// 只保留最近 N 轮对话
conversationHistory: this.data.conversationHistory.slice(-10)  // 改为 -20、-30 等
```

### 3. 自定义兜底回复

修改 `getFallbackReply` 方法（第 212-224 行）：

```javascript
getFallbackReply(userMessage) {
  // 添加更多关键词匹配
  if (userMessage.includes('发货') || userMessage.includes('物流')) {
    return '我们支持快递配送和门店自取，具体配送时间根据您的地址而定。'
  }
  
  // 添加业务相关的兜底回复
  // ...
  
  return '感谢您的咨询，我们会尽快为您处理。'
}
```

### 4. 添加消息类型

支持更多消息类型（语音、视频等）：

1. 修改云函数以支持不同类型的输入
2. 在 WXML 中添加对应的消息展示
3. 在 JS 中处理不同类型的发送逻辑

### 5. 接入微信客服消息

如需接入微信官方客服消息：

1. 在 `config.json` 中已包含相关权限
2. 参考[微信客服消息文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/customer-message/customer-message.html)
3. 修改云函数以支持双向同步

### 6. 添加敏感词过滤

在云函数中添加敏感词检查：

```javascript
// 在 exports.main 中添加
const sensitiveWords = ['敏感词1', '敏感词2']
const hasSensitiveWord = sensitiveWords.some(word => message.includes(word))

if (hasSensitiveWord) {
  return {
    success: false,
    error: '消息包含敏感词',
    fallbackReply: '抱歉，您的消息包含不当内容，请重新输入。'
  }
}
```

### 7. 监控和统计

添加对话数据统计：

1. 在数据库中添加统计字段：
   - 对话轮数
   - AI 响应时间
   - 用户满意度

2. 在云函数中记录关键指标
3. 定期分析优化 AI 效果

---

## 🎯 最佳实践

### 1. Coze Bot 训练建议

- ✅ **明确角色定位**：在系统提示词中清楚说明是租赁客服
- ✅ **丰富知识库**：添加所有商品信息、政策、FAQ
- ✅ **设置边界**：告诉 AI 哪些问题不能回答（如价格修改）
- ✅ **友好语气**：设置亲切专业的对话风格
- ✅ **持续优化**：根据实际对话效果不断调整

### 2. 成本控制

- ✅ **设置用量限制**：在 Coze 平台设置每日调用上限
- ✅ **优化请求**：只传递必要的对话历史
- ✅ **缓存常见问题**：对高频问题使用本地回复
- ✅ **使用合适的模型**：不一定需要最高级的模型

### 3. 用户体验优化

- ✅ **快速响应**：优化网络请求，减少等待时间
- ✅ **清晰提示**：显示"正在输入"等加载状态
- ✅ **兜底策略**：确保服务始终可用
- ✅ **人工转接**：复杂问题提供转人工选项

### 4. 安全性建议

- ✅ **API Key 保护**：只在云函数中使用，不要暴露给客户端
- ✅ **消息过滤**：添加敏感词检测
- ✅ **频率限制**：防止恶意刷量
- ✅ **日志监控**：及时发现异常调用

---

## 📚 相关资源

- [Coze 官方文档](https://www.coze.cn/docs)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [微信客服消息文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/customer-message/customer-message.html)
- [项目云函数说明](./cloudfunctions/callCozeAgent/README.md)
- [客服页面说明](./pages/customer-service/README.md)

---

## 🆘 获取帮助

遇到问题？可以：

1. 查看云函数日志（云开发控制台 → 云函数 → 日志）
2. 查看小程序控制台日志
3. 检查 Coze 平台的 Bot 状态
4. 参考 [常见问题](#常见问题) 章节

---

## ✅ 完成检查清单

部署前请确认：

- [ ] 已在 Coze 平台创建并训练 Bot
- [ ] 已获取 API Key 和 Bot ID
- [ ] 已正确配置云函数 `COZE_CONFIG`
- [ ] 已创建数据库集合（如需保存对话）
- [ ] 已成功上传并部署云函数
- [ ] 已完成云函数测试
- [ ] 已在小程序中测试完整流程
- [ ] AI 回复效果满意

全部完成后，您的智能客服系统就可以正式上线了！🎉

---

**更新日期**: 2024-11-11  
**版本**: v1.0.0

