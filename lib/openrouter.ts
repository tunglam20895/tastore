export async function generateMoTa(
    productName: string,
    category: string = ""
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const prompt = `Viết mô tả sản phẩm cho shop thời trang nữ "TA STORE".

Tên sản phẩm: ${productName}
${category ? `Danh mục: ${category}` : ""}
Phân khúc giá: 300.000đ - 1.000.000đ

Yêu cầu:
- Viết bằng tiếng Việt, văn phong trẻ trung, thanh lịch, cuốn hút
- Mô tả khoảng 3-5 câu
- Nhấn mạnh chất liệu, kiểu dáng, sự thoải mái và phong cách thời trang
- Phù hợp với phụ nữ hiện đại, yêu thích thời trang
- Không dùng emoji
- Chỉ trả về đoạn mô tả, không thêm tiêu đề hay ghi chú`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "TA STORE",
    },
    body: JSON.stringify({
      model: "stepfun/step-3.5-flash:free",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("OpenRouter error:", JSON.stringify(err, null, 2));
    throw new Error(`OpenRouter API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}