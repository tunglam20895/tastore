export async function generateProductDescription(
  productName: string,
  category: string = ""
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://tranh-anh-store.vercel.app",
      "X-Title": "Tranh Anh Store",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.6-plus:free",
      messages: [
        {
          role: "user",
          content: `Viết mô tả sản phẩm cho shop tranh nghệ thuật "TRANH ANH STORE".

Tên sản phẩm: ${productName}
${category ? `Danh mục: ${category}` : ""}

Yêu cầu:
- Viết bằng tiếng Việt, văn phong sang trọng, nghệ thuật
- Mô tả khoảng 3-5 câu
- Nhấn mạnh giá trị thẩm mỹ và cảm xúc của tác phẩm
- Không dùng emoji
- Chỉ trả về đoạn mô tả, không thêm tiêu đề hay ghi chú`,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error("Không nhận được phản hồi từ AI");
  }
  return data.choices[0].message.content.trim();
}
