# users 集合配置说明

## 📋 集合名称
`users`

## 🔐 权限配置

### 读权限（read）
```javascript
doc._openid == auth.openid
```
**说明**：用户只能读取自己的信息

### 写权限（write）
```javascript
doc._openid == auth.openid
```
**说明**：用户只能修改自己的信息

## 📊 字段结构

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `_id` | string | 是 | 文档ID（自动生成） | - |
| `_openid` | string | 是 | 用户openid（自动生成） | - |
| `nickname` | string | 否 | 用户昵称 | "张三" |
| `avatar` | string | 否 | 头像URL（云存储地址） | "cloud://xxx.png" |
| `gender` | string | 否 | 性别 | "男" / "女" / "保密" |
| `birthday` | string | 否 | 生日 | "1995-01-15" |
| `school` | string | 否 | 院校名称 | "University of Southampton" |
| `city` | string | 否 | 城市 | "南安普顿" |
| `postcode` | string | 否 | 邮编 | "SO17 1BJ" |
| `phone` | string | 否 | 联系电话 | "+44 7389003857" |
| `createTime` | date | 是 | 创建时间 | 2024-01-15 10:30:00 |
| `updateTime` | date | 是 | 更新时间 | 2024-01-20 15:45:00 |

## 📝 文档示例

```json
{
  "_id": "user_20240115_001",
  "_openid": "odwd_18x8PjYSiHic2367rwpLHz4",
  "nickname": "张三",
  "avatar": "cloud://cloud1-8gi23b6b06a44a37.636c-cloud1-8gi23b6b06a44a37-1234567890/avatars/user_123.png",
  "gender": "男",
  "birthday": "1995-01-15",
  "school": "University of Southampton",
  "city": "南安普顿",
  "postcode": "SO17 1BJ",
  "phone": "+44 7389003857",
  "createTime": "2024-01-15T10:30:00.000Z",
  "updateTime": "2024-01-20T15:45:00.000Z"
}
```

## 🔧 配置步骤

### 1. 创建集合
1. 进入微信开发者工具
2. 打开"云开发"控制台
3. 点击"数据库" → "添加集合"
4. 输入集合名：`users`
5. 点击"确定"

### 2. 配置权限
1. 点击 `users` 集合
2. 点击"权限设置"标签
3. 点击"添加权限"，选择"自定义安全规则"
4. 配置读权限：`doc._openid == auth.openid`
5. 配置写权限：`doc._openid == auth.openid`
6. 点击"保存"

### 3. 创建索引（可选，优化查询性能）
建议创建以下索引：
- `_openid`：升序（单字段索引）
- `updateTime`：降序（单字段索引）

## 💡 使用说明

### 云函数访问
云函数需要使用管理员权限访问 users 集合：
```javascript
const db = cloud.database()
const collection = db.collection('users')
```

### 前端访问
小程序前端可以直接访问自己的数据：
```javascript
const db = wx.cloud.database()
const collection = db.collection('users')
```

## ⚠️ 注意事项

1. **隐私保护**：头像、联系方式等敏感信息需要严格权限控制
2. **数据校验**：云函数中需要验证数据格式（手机号格式等）
3. **头像存储**：建议将头像存储在云存储的 `avatars/` 目录下
4. **城市选择**：使用预设城市列表，确保数据统一
5. **更新时间**：每次更新数据时自动更新 `updateTime` 字段

