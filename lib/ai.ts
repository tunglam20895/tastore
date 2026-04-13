import { callQwen } from './qwen';

export async function generateProductDescription(
  productName: string,
  category: string = ''
): Promise<string> {
  const prompt = `Viết mô tả sản phẩm cho shop thời trang nữ "TRANG ANH STORE".

Tên sản phẩm: ${productName}
${category ? `Danh mục: ${category}` : ''}

Yêu cầu:
- Viết bằng tiếng Việt, văn phong sang trọng, thanh lịch
- Mô tả khoảng 3-5 câu
- Nhấn mạnh chất liệu, kiểu dáng, sự thoải mái và phong cách
- Không dùng emoji
- Chỉ trả về đoạn mô tả, không thêm tiêu đề hay ghi chú`;

  const { content } = await callQwen([{ role: 'user', content: prompt }]);
  return content;
}
