# 📱 getPhoneNumber 云函数

## 功能说明

获取用户手机号的云函数，用于实现手机号快速登录功能。

## 调用方式

**前端调用：**
```javascript
const res = await wx.cloud.callFunction({
  name: 'getPhoneNumber',
  data: { 
    code: '动态令牌'  // 从 button 组件的 bindgetphonenumber 事件获取
  }
})
```

## 返回数据

**成功时：**
```javascript
{
  success: true,
  data: {
    phoneNumber: "86-13800138000",      // 带区号的完整手机号
    purePhoneNumber: "13800138000",     // 纯手机号（推荐使用）
    countryCode: "86",                  // 国家/地区码
    watermark: {                        // 数据水印
      timestamp: 1640000000,
      appid: "wxxxxxxxxxxx"
    }
  },
  openid: "oxxxxxx-xxxxxxx"            // 用户openid
}
```

**失败时：**
```javascript
{
  success: false,
  errMsg: "错误信息",
  errCode: 错误码
}
```

## 部署步骤

### 1. 安装依赖
右键点击云函数目录 → 选择"上传并部署：云端安装依赖"

### 2. 权限配置
已在 `config.json` 中配置了必要权限：
```json
{
  "permissions": {
    "openapi": [
      "phonenumber.getPhoneNumber"
    ]
  }
}
```

### 3. 测试云函数
在云开发控制台的云函数页面，点击"测试"按钮进行测试。

## 注意事项

1. **code 有效期**：动态令牌仅5分钟有效
2. **code 一次性**：每个 code 只能使用一次
3. **费用说明**：每次成功调用收费 0.03元，有1000次免费额度
4. **真机测试**：该功能必须在真机上测试，开发者工具无法完整模拟

## 错误处理

| 错误码 | 说明 | 处理方式 |
|--------|------|---------|
| 0 | 成功 | 正常处理 |
| 41001 | access_token 缺失 | 检查云开发环境配置 |
| 其他 | 其他错误 | 查看错误信息，联系技术支持 |

## 相关文档

- [微信官方文档 - 手机号快速验证](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html)
- [完整实现说明](/手机号快速登录-实现说明.md)


