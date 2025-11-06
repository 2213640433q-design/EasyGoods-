# 🎟️ User_Coupons 集合配置文档

## 📌 集合信息

**集合名称：** `user_coupons`  
**用途：** 存储用户领取的优惠券数据  
**权限模式：** 仅创建者可读写

---

## 🗂️ 字段设计

### 基础字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `_id` | String | 自动 | 记录唯一标识 | 自动生成 |
| `_openid` | String | ✅ | 用户标识（自动） | oABC123xxx |

### 优惠券信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `couponId` | String | ✅ | 优惠券模板ID（关联 coupons 集合） | 673b9xxx |
| `couponName` | String | ✅ | 优惠券名称 | 新人专享券 |
| `couponType` | String | ✅ | 优惠券类型 | discount / reduce |
| `discountValue` | Number | ✅ | 优惠额度 | 10（折扣为0.9，满减为10英镑） |
| `minAmount` | Number | ✅ | 最低消费金额（英镑） | 50 |
| `maxDiscount` | Number | ❌ | 最高优惠金额（折扣券） | 20 |

### 有效期信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `startTime` | Date | ✅ | 生效时间 | 2025-11-04T00:00:00.000Z |
| `endTime` | Date | ✅ | 失效时间 | 2025-11-30T23:59:59.000Z |
| `daysValid` | Number | ❌ | 有效天数（从领取日起） | 7 |

### 使用状态

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `status` | String | ✅ | 优惠券状态 | unused / used / expired |
| `usedOrderId` | String | ❌ | 使用的订单ID | ORDER1730000000 |
| `usedTime` | Date | ❌ | 使用时间 | 2025-11-10T15:30:00.000Z |

### 时间戳

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `receiveTime` | Date | ✅ | 领取时间 | 2025-11-04T10:30:22.000Z |
| `updateTime` | Date | ✅ | 更新时间 | 2025-11-04T10:30:22.000Z |

---

## 🔒 权限配置

### 方案：仅创建者可读写

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

**说明：**
- ✅ 用户只能查看自己的优惠券
- ✅ 用户只能使用自己的优惠券
- ❌ 无法查看或使用其他用户的优惠券

---

## 📊 优惠券状态流转

```
unused (未使用)
    ↓ 在订单中使用
used (已使用)

unused (未使用)
    ↓ 超过有效期
expired (已过期)
```

### 状态说明

| 状态 | 英文 | 说明 | 可执行操作 |
|------|------|------|-----------|
| 未使用 | unused | 可以使用 | 在订单中使用 |
| 已使用 | used | 已在订单中使用 | 无 |
| 已过期 | expired | 超过有效期 | 无 |

---

## 🎯 优惠券类型

### **类型 1：满减券**

```javascript
{
  couponType: 'reduce',
  discountValue: 10,  // 减10英镑
  minAmount: 50       // 满50可用
}
```

**计算规则：**
```
订单金额 >= 50 → 优惠 10 英镑
订单金额 < 50  → 不可使用
```

### **类型 2：折扣券**

```javascript
{
  couponType: 'discount',
  discountValue: 10,   // 9折（90%）
  minAmount: 100,      // 满100可用
  maxDiscount: 20      // 最高优惠20英镑
}
```

**计算规则：**
```
订单金额 >= 100 → 打9折，最高优惠20英镑
订单金额 = 150  → 优惠 15 英镑（150 × 0.1）
订单金额 = 300  → 优惠 20 英镑（300 × 0.1 = 30，但最高20）
订单金额 < 100  → 不可使用
```

---

## 📝 完整示例数据

### **满减券示例：**

```json
{
  "_id": "673b9a1b2e8f5c0001234567",
  "_openid": "oABC123xxx",
  
  "couponId": "673b8001",
  "couponName": "新人专享券",
  "couponType": "reduce",
  "discountValue": 10,
  "minAmount": 50,
  
  "startTime": { "$date": "2025-11-04T00:00:00.000Z" },
  "endTime": { "$date": "2025-11-30T23:59:59.000Z" },
  
  "status": "unused",
  
  "receiveTime": { "$date": "2025-11-04T10:30:22.000Z" },
  "updateTime": { "$date": "2025-11-04T10:30:22.000Z" }
}
```

### **折扣券示例：**

```json
{
  "_id": "673b9a1b2e8f5c0001234568",
  "_openid": "oABC123xxx",
  
  "couponId": "673b8002",
  "couponName": "全场9折券",
  "couponType": "discount",
  "discountValue": 10,
  "minAmount": 100,
  "maxDiscount": 20,
  
  "startTime": { "$date": "2025-11-04T00:00:00.000Z" },
  "endTime": { "$date": "2025-12-31T23:59:59.000Z" },
  
  "status": "unused",
  
  "receiveTime": { "$date": "2025-11-04T10:30:22.000Z" },
  "updateTime": { "$date": "2025-11-04T10:30:22.000Z" }
}
```

---

## 🎯 索引建议

为了提高查询性能，建议在以下字段上创建索引：

1. **_openid**（用户查询自己的优惠券）
   ```
   字段：_openid
   类型：升序
   ```

2. **status**（按状态筛选）
   ```
   字段：status
   类型：升序
   ```

3. **endTime**（按有效期排序）
   ```
   字段：endTime
   类型：升序
   ```

4. **复合索引**（用户 + 状态 + 有效期）
   ```
   字段：_openid (升序), status (升序), endTime (升序)
   类型：复合索引
   ```

---

## 🚀 创建步骤

### 1. 在云开发控制台创建集合

1. 打开微信开发者工具
2. 点击 "云开发" 按钮
3. 选择 "数据库" 标签
4. 点击 "+" 创建集合
5. 输入集合名称：`user_coupons`
6. 点击 "确定"

### 2. 配置权限

1. 点击集合名称进入详情
2. 点击 "权限设置"
3. 选择 "自定义安全规则"
4. 输入以下规则：

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

5. 点击 "保存"

---

## 📚 相关集合

### **coupons 集合**（优惠券模板，已存在）

**说明：** 管理员创建的优惠券模板，所有用户可见

**权限：**
```json
{
  "read": true,
  "write": false
}
```

### **user_coupons 集合**（用户优惠券，本集合）

**说明：** 用户领取的优惠券实例，每个用户只能看到自己的

**权限：**
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

---

## 🔄 数据流向

```
管理员创建优惠券
    ↓
保存到 coupons 集合（模板）
    ↓
用户在小程序中领取优惠券
    ↓
从 coupons 读取模板数据
    ↓
创建 user_coupons 记录（实例）
    ↓
用户在订单中使用优惠券
    ↓
更新 user_coupons 状态为 used
```

---

**✅ 配置文档创建完成！接下来开始创建云函数！**

