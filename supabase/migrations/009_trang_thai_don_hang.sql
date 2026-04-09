-- Bảng trạng thái đơn hàng (có thể tùy chỉnh màu)
CREATE TABLE IF NOT EXISTS trang_thai_don_hang (
  key text PRIMARY KEY,
  ten text NOT NULL,
  mau text DEFAULT '#6B7280',     -- mã màu hex
  thu_tu int DEFAULT 0             -- thứ tự hiển thị
);

-- Seed 6 trạng thái hiện có
INSERT INTO trang_thai_don_hang (key, ten, mau, thu_tu) VALUES
  ('Mới',                'Mới',                '#3B82F6', 1),
  ('Chốt để lên đơn',    'Chốt để lên đơn',    '#A855F7', 2),
  ('Đã lên đơn',         'Đã lên đơn',         '#14B8A6', 3),
  ('Đang xử lý',         'Đang xử lý',         '#F59E0B', 4),
  ('Đã giao',            'Đã giao',            '#22C55E', 5),
  ('Huỷ',                'Huỷ',                '#EF4444', 6)
ON CONFLICT (key) DO NOTHING;
