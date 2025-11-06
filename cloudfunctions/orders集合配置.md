# 📦 Orders 集合配置文档

## 📌 集合信息

**集合名称：** `orders`  
**用途：** 存储用户的租赁订单数据  
**权限模式：** 仅创建者可读写

---

## 🗂️ 字段设计

### 基础字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `_id` | String | 自动 | 记录唯一标识 | 自动生成 |
| `_openid` | String | ✅ | 用户标识（自动） | oABC123xxx |

### 订单基本信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `orderId` | String | ✅ | 订单编号 | ORDER20251104153022 |
| `status` | String | ✅ | 订单状态 | pending / paid / picked / returning / checking / completed / cancelled |
| `type` | String | ✅ | 订单类型 | rent（租赁） |

### 商品信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `productId` | String | ✅ | 商品ID | 673b9xxx |
| `productName` | String | ✅ | 商品名称 | 自动麻将机 静音版 |
| `productImage` | String | ✅ | 商品图片 | https://... |
| `mainCategory` | String | ✅ | 一级分类 | 娱乐 |
| `subCategory` | String | ✅ | 二级分类 | 麻将 |

### 租赁信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `rentalStartDate` | String | ✅ | 租赁开始日期 | 2025-11-10 |
| `rentalEndDate` | String | ✅ | 租赁结束日期 | 2025-11-15 |
| `rentalDays` | Number | ✅ | 租赁天数 | 5 |
| `pickupLocation` | String | ✅ | 取货地点 | 伦敦店 |

### 配件信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `accessories` | Array | ❌ | 额外配件列表 | [{ id: 1, name: "64G SD卡", price: 2 }] |

### 价格信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `dailyPrice` | Number | ✅ | 日租金（英镑） | 8 |
| `totalRent` | Number | ✅ | 总租金 | 40 |
| `deposit` | Number | ✅ | 押金 | 100 |
| `accessoryFee` | Number | ✅ | 配件费用 | 10 |
| `totalAmount` | Number | ✅ | 订单总额 | 150 |

### 时间戳

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `createTime` | Date | ✅ | 创建时间 | 2025-11-04T10:30:22.000Z |
| `updateTime` | Date | ✅ | 更新时间 | 2025-11-04T10:30:22.000Z |
| `payTime` | Date | ❌ | 支付时间 | 2025-11-04T10:35:00.000Z |
| `pickTime` | Date | ❌ | 取件时间 | 2025-11-10T09:00:00.000Z |
| `returnTime` | Date | ❌ | 归还时间 | 2025-11-15T18:00:00.000Z |
| `checkTime` | Date | ❌ | 检查完成时间 | 2025-11-15T20:00:00.000Z |
| `completeTime` | Date | ❌ | 完成时间 | 2025-11-15T20:30:00.000Z |
| `cancelTime` | Date | ❌ | 取消时间 | 2025-11-04T11:00:00.000Z |

### 其他信息

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `note` | String | ❌ | 用户备注 | 请在下午3点后取货 |
| `cancelReason` | String | ❌ | 取消原因 | 不想租了 |

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
- ✅ 用户只能查看自己的订单
- ✅ 用户只能修改自己的订单
- ❌ 无法查看或修改其他用户的订单

---

## 📊 订单状态流转

```
pending (待支付)
    ↓ 支付
paid (待取件)
    ↓ 确认取件
picked (租赁中)
    ↓ 发起归还
returning (归还中)
    ↓ 商家确认收货
checking (检查中)
    ↓ 检查完成
completed (已完成)

任意状态 → cancelled (已取消，仅限待支付状态可取消)
```

### 状态说明

| 状态 | 英文 | 说明 | 可执行操作 |
|------|------|------|-----------|
| 待支付 | pending | 订单已创建，等待支付 | 支付、取消 |
| 待取件 | paid | 已支付，等待取货 | 确认取件、申请退款 |
| 租赁中 | picked | 已取货，正在使用 | 发起归还、申请续租 |
| 归还中 | returning | 用户已寄出，等待商家收货 | 无 |
| 检查中 | checking | 商家已收货，检查设备 | 无 |
| 已完成 | completed | 检查完成，订单结束 | 评价 |
| 已取消 | cancelled | 订单已取消 | 无 |

---

## 🎯 索引建议

为了提高查询性能，建议在以下字段上创建索引：

1. **_openid**（用户查询自己的订单）
   ```
   字段：_openid
   类型：升序
   ```

2. **status**（按状态筛选）
   ```
   字段：status
   类型：升序
   ```

3. **createTime**（按时间排序）
   ```
   字段：createTime
   类型：降序
   ```

4. **复合索引**（用户 + 状态 + 时间）
   ```
   字段：_openid (升序), status (升序), createTime (降序)
   类型：复合索引
   ```

---

## 📝 完整示例数据

```json
{
  "_id": "673b9a1b2e8f5c0001234567",
  "_openid": "oABC123xxx",
  
  "orderId": "ORDER20251104153022",
  "status": "picked",
  "type": "rent",
  
  "productId": "673b8xxx",
  "productName": "自动麻将机 静音版",
  "productImage": "https://example.com/image.jpg",
  "mainCategory": "娱乐",
  "subCategory": "麻将",
  
  "rentalStartDate": "2025-11-10",
  "rentalEndDate": "2025-11-15",
  "rentalDays": 5,
  "pickupLocation": "伦敦店",
  
  "accessories": [
    { "id": 1, "name": "备用电源", "price": 3 },
    { "id": 2, "name": "便携包", "price": 2 }
  ],
  
  "dailyPrice": 8,
  "totalRent": 40,
  "deposit": 100,
  "accessoryFee": 5,
  "totalAmount": 145,
  
  "createTime": { "$date": "2025-11-04T15:30:22.000Z" },
  "updateTime": { "$date": "2025-11-10T09:00:00.000Z" },
  "payTime": { "$date": "2025-11-04T15:35:00.000Z" },
  "pickTime": { "$date": "2025-11-10T09:00:00.000Z" },
  
  "note": "请在下午3点后取货"
}
```

---

## 🚀 创建步骤

### 1. 在云开发控制台创建集合

1. 打开微信开发者工具
2. 点击 "云开发" 按钮
3. 选择 "数据库" 标签
4. 点击 "+" 创建集合
5. 输入集合名称：`orders`
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

### 3. 创建索引（可选，推荐）

1. 在集合详情页，点击 "索引管理"
2. 点击 "添加索引"
3. 按照上面的索引建议创建索引

---

## 🧪 测试数据导入（可选）

如果需要测试数据，可以导入以下 CSV 文件：

**文件：** `orders_demo.csv`

```csv
_openid,orderId,status,type,productId,productName,productImage,mainCategory,subCategory,rentalStartDate,rentalEndDate,rentalDays,pickupLocation,accessories,dailyPrice,totalRent,deposit,accessoryFee,totalAmount,createTime,updateTime,note
oTEST001,ORDER20251101120000,completed,rent,673b8001,自动麻将机 静音版,/static/placeholder/p1.png,娱乐,麻将,2025-11-01,2025-11-03,2,伦敦店,[],8,16,100,0,116,2025-11-01T12:00:00.000Z,2025-11-03T18:00:00.000Z,
oTEST001,ORDER20251102140000,picked,rent,673b8002,德州扑克筹码套装,/static/placeholder/p2.png,娱乐,德州扑克,2025-11-04,2025-11-06,2,南安普顿店,"[{""id"":1,""name"":""备用电源"",""price"":3}]",7,14,80,3,97,2025-11-02T14:00:00.000Z,2025-11-04T10:00:00.000Z,下午3点后取货
oTEST001,ORDER20251104100000,pending,rent,673b8003,富士X100VI数码相机,/static/placeholder/p3.png,摄影,CCD,2025-11-10,2025-11-15,5,伦敦店,[],12,60,200,0,260,2025-11-04T10:00:00.000Z,2025-11-04T10:00:00.000Z,
```

---

## 📚 相关文档

- [微信云开发 - 数据库](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [微信云开发 - 权限控制](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/permission.html)

---

## ✅ 配置检查清单

创建集合后，请检查：

- [ ] 集合名称为 `orders`
- [ ] 权限设置为 `{"read": "doc._openid == auth.openid", "write": "doc._openid == auth.openid"}`
- [ ] 已创建 `_openid` 索引（可选但推荐）
- [ ] 已创建 `status` 索引（可选但推荐）
- [ ] 已创建 `createTime` 索引（可选但推荐）

---

**🎉 配置完成后，即可开始使用订单系统云函数！**

