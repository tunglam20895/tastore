import { callQwen } from './qwen';

export async function generateProductDescription(
  productName: string,
  category: string = ''
): Promise<string> {
  const prompt = `Viết mô tả sản phẩm cho shop thời trang nữ "TA STORE".

Tên sản phẩm: ${productName}
${category ? `Danh mục: ${category}` : ''}
Phân khúc giá: 300.000đ - 1.000.000đ

Yêu cầu:
- Viết bằng tiếng Việt, văn phong trẻ trung, thanh lịch, cuốn hút
- Mô tả khoảng 3-5 câu
- Nhấn mạnh chất liệu, kiểu dáng, sự thoải mái và phong cách thời trang
- Phù hợp với phụ nữ hiện đại, yêu thích thời trang
- Không dùng emoji
- Chỉ trả về đoạn mô tả, không thêm tiêu đề hay ghi chú`;

  const { content } = await callQwen([{ role: 'user', content: prompt }]);
  return content;
}
