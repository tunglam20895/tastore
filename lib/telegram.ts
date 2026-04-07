import type { DonHang } from '@/types'

export async function sendOrderNotification(order: DonHang): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured')
    return
  }

  const productList = order.sanPham
    .map((sp) => `  • ${sp.ten} x${sp.soLuong} - ${sp.giaHienThi.toLocaleString('vi-VN')}đ`)
    .join('\n')

  const text = `🎨 *TRANH ANH STORE - ĐƠN HÀNG MỚI*

👤 Tên: ${order.tenKH}
📞 SĐT: ${order.sdt}
📍 Địa chỉ: ${order.diaChi}

🛒 Sản phẩm:
${productList}

💰 Tổng tiền: ${order.tongTien.toLocaleString('vi-VN')}đ
🕐 Thời gian: ${new Date(order.thoiGian).toLocaleString('vi-VN')}`

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Failed to send Telegram notification:', err)
  }
}
