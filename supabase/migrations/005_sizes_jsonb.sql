-- Đổi cột sizes từ TEXT[] sang JSONB để lưu { ten, so_luong } per size
-- Dữ liệu cũ (TEXT[]) bị reset về [] vì cấu trúc thay đổi hoàn toàn
ALTER TABLE san_pham
  ALTER COLUMN sizes TYPE JSONB
  USING '[]'::jsonb;

ALTER TABLE san_pham
  ALTER COLUMN sizes SET DEFAULT '[]'::jsonb;

-- RPC trừ tồn kho theo size cụ thể (cập nhật cả sizes JSONB lẫn so_luong tổng)
CREATE OR REPLACE FUNCTION decrement_size_so_luong(
  p_product_id TEXT,
  p_size_name  TEXT,
  p_quantity   INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE san_pham
  SET
    so_luong = GREATEST(0, so_luong - p_quantity),
    sizes = (
      SELECT COALESCE(
        jsonb_agg(
          CASE
            WHEN (item->>'ten') = p_size_name
            THEN jsonb_set(
              item,
              '{so_luong}',
              to_jsonb(GREATEST(0, (item->>'so_luong')::int - p_quantity))
            )
            ELSE item
          END
        ),
        '[]'::jsonb
      )
      FROM jsonb_array_elements(sizes) AS item
    ),
    con_hang = (GREATEST(0, so_luong - p_quantity) > 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
