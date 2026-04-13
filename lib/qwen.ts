/**
 * Qwen DashScope API client với fallback tự động khi hết quota/token.
 * Thứ tự ưu tiên: qwen-plus → qwen3.5-flash → qwen3.5-plus
 */

type QwenModel = 'qwen-plus' | 'qwen3.5-flash' | 'qwen3.5-plus';

const MODEL_PRIORITY: QwenModel[] = ['qwen-plus', 'qwen3.5-flash', 'qwen3.5-plus'];

const ENDPOINT = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

/** Các mã lỗi cho phép fallback sang model khác */
const FALLBACK_ERROR_CODES = [
  'AllocationQuota.FreeTierOnly',
  'AccessDenied.Unpurchased',
  'ModelNotAvailable',
  'ServiceUnavailable',
  'RequestTooMany',
  'Throttling.RateQuotaExceeded',
];

type QwenResponse = {
  choices?: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage?: { total_tokens: number };
  error?: { code: string; message: string };
};

/**
 * Chat streaming — trả về AsyncIterable của các chunk text.
 */
export async function* streamQwen(
  messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>,
  preferredModel?: QwenModel
): AsyncGenerator<string> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) throw new Error('QWEN_API_KEY is not set');

  const orderedModels = preferredModel
    ? [preferredModel, ...MODEL_PRIORITY.filter((m) => m !== preferredModel)]
    : MODEL_PRIORITY;

  let lastError: Error | null = null;
  let fallbackCount = 0;
  let streamedContent = '';

  // 🟢 DEBUG LOG: IN PROMPT GỬI ĐI
  console.log('🤖 [Qwen] === PROMPT SENT TO AI ===');
  messages.forEach((m, i) => {
    console.log(`🤖 [Qwen] Message ${i} [${m.role}] (Length: ${m.content.length}):`);
    console.log(m.content.substring(0, 800) + (m.content.length > 800 ? '...' : ''));
  });
  console.log('🤖 [Qwen] === END PROMPT ===');

  for (const model of orderedModels) {
    streamedContent = ''; // reset khi chuyển model

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          stream_options: { include_usage: true },
          temperature: 0.5,  // Đủ cao để AI sinh text tự nhiên có xuống dòng
          top_p: 0.9,
        }),
      });

      if (!res.ok) {
        let errorBody: QwenResponse | null = null;
        try {
          errorBody = await res.json();
        } catch { /* ignore */ }

        const errorCode = errorBody?.error?.code || '';
        const canFallback = FALLBACK_ERROR_CODES.some(code =>
          errorCode.includes(code) || code.includes(errorCode)
        );

        if (canFallback) {
          fallbackCount++;
          console.warn(`[Qwen Stream Fallback ⚡] Model "${model}" lỗi (${errorCode}), thử model tiếp theo...`);
          lastError = new Error(`Model ${model} unavailable: ${errorBody?.error?.message || res.statusText}`);
          continue;
        }

        throw new Error(`Qwen API error (${model}): ${res.status} - ${errorBody?.error?.message || res.statusText}`);
      }

      // Streaming thành công — đọc SSE chunks
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Không thể đọc response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6).trim();
          if (data === '[DONE]') {
            console.log(`[Qwen Stream ✅] Model: ${model} - Total Chars: ${streamedContent.length}`);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              streamedContent += delta;
              yield delta;
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      // 🟢 DEBUG LOG: IN RESPONSE NHẬN VỀ
      console.log('📥 [Qwen] === FINAL RESPONSE FROM AI ===');
      console.log(streamedContent);
      console.log('📥 [Qwen] === END RESPONSE ===');

      if (!streamedContent.trim()) {
        throw new Error('Phản hồi từ AI trống');
      }

      return; // Stream kết thúc thành công

    } catch (err) {
      if (err instanceof Error && !err.message.includes('unavailable') && !err.message.includes('hết')) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Hết model → throw lỗi
  const errorMsg = lastError?.message || 'Không có model nào khả dụng';
  throw new Error(`❌ Tất cả model Qwen đều không hoạt động: ${errorMsg}`);
}

/**
 * Chat streaming với AI cho admin.
 * SỬA LỖI LẶP "89.đ": Bỏ qua lịch sử chat cũ, chỉ gửi câu hỏi hiện tại + dữ liệu mới.
 */
export async function* streamChatWithAI(
  messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>,
  context?: string
): AsyncGenerator<string> {
  // 1. Lấy câu hỏi của user cuối cùng
  let userQuestion = 'Không có câu hỏi.';
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      userQuestion = messages[i].content;
      break;
    }
  }

  // 2. Xây dựng System Message mới
  let systemContent = 'Bạn là trợ lý AI của shop "TRANG ANH STORE". Nhiệm vụ: Trả lời câu hỏi của admin dựa trên DỮ LIỆU được cung cấp.';

  if (context) {
    systemContent += `\n\nDỮ LIỆU THAM KHẢO (format XML, key tiếng Việt, số nguyên thô + " dong"):\n${context}`;
    systemContent += `\n\nHƯỚNG DẪN TRÌNH BÀY BẮT BUỘC:
1. TRẢ LỜI CÓ XUỐNG DÒNG: mỗi thông tin 1 dòng riêng, nhóm cách nhau bằng dòng trống.
2. VÍ DỤ FORMAT ĐÚNG:
"Chào admin ạ! Đây là báo cáo:

💰 DOANH THU
• Hôm nay: 0đ
• Tháng này: 22.289.420đ
• Tháng trước: 12.790.000đ
• Tổng: 65.191.420đ

📦 ĐƠN HÀNG
• Tổng: 79 đơn
• Mới: 0 | Chốt: 5
• Đã giao: 57 | Huỷ: 7"
3. CHUYỂN ĐỔI SỐ TIỀN: số "dong" → format dấu chấm + "đ" (VD: 22289420 dong → 22.289.420đ)
4. KHÔNG dùng **, KHÔNG viết liền đoạn.
5. Xưng hô lịch sự ("ạ", "dạ").`;
  }

  // 3. QUAN TRỌNG: BỎ QUA LỊCH SỬ CŨ để tránh AI lặp lại câu trả lời sai (89.đ).
  // Chỉ gửi: System Message mới + Câu hỏi User hiện tại.
  const finalMessages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userQuestion },
  ];

  // Gửi đi
  yield* streamQwen(finalMessages);
}
