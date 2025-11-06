Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '提示' },
    content: { type: String, value: '' },
    showCancel: { type: Boolean, value: false },
    cancelText: { type: String, value: '取消' },
    showConfirm: { type: Boolean, value: true },
    confirmText: { type: String, value: '知道了' },
    confirmColor: { type: String, value: '#007aff' }
  },
  methods: {
    hideModal() {},
    stopBubble() {},
    onConfirm() {
      this.setData({ visible: false })
      this.triggerEvent('confirm', { confirm: true })
    },
    onCancel() {
      this.setData({ visible: false })
      this.triggerEvent('cancel', { cancel: true })
    }
  }
})



