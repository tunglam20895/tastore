import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Webhook endpoint cho Telegram Bot
// Cấu hình webhook: gửi POST tới https://api.telegram.org/bot{TOKEN}/setWebhook?url={YOUR_URL}/api/telegram

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle incoming messages from users
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;

      // Simple bot responses
      if (text === "/start") {
        await sendTelegramMessage(chatId, "🎨 Chào mừng đến TRANG ANH STORE!\nBạn cần hỗ trợ gì?");
      } else if (text === "/help") {
        await sendTelegramMessage(chatId, "Các lệnh:\n/start - Bắt đầu\n/help - Trợ giúp");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/telegram error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý webhook" },
      { status: 500 }
    );
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
