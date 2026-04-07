-- Bảng khách hàng CRM
CREATE TABLE IF NOT EXISTS khach_hang (
  sdt TEXT PRIMARY KEY,
  ten TEXT NOT NULL,
  tong_don INTEGER DEFAULT 0,
  tong_doanh_thu NUMERIC DEFAULT 0,
  trang_thai TEXT DEFAULT 'Mới',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng trạng thái khách hàng
CREATE TABLE IF NOT EXISTS trang_thai_kh (
  id TEXT PRIMARY KEY,
  ten TEXT NOT NULL UNIQUE,
  mau TEXT DEFAULT '#8C7B72'
);

-- Dữ liệu mặc định
INSERT INTO trang_thai_kh (id, ten, mau) VALUES
  ('tt_001', 'Mới', '#8C7B72'),
  ('tt_002', 'Tiềm năng', '#C9A99A'),
  ('tt_003', 'Thân thiết', '#2C1A12'),
  ('tt_004', 'Bom hàng', '#DC2626')
ON CONFLICT (id) DO NOTHING;

-- RPC upsert khách hàng với increment an toàn
CREATE OR REPLACE FUNCTION upsert_khach_hang(
  p_sdt TEXT,
  p_ten TEXT,
  p_doanh_thu NUMERIC
) RETURNS void AS $$
BEGIN
  INSERT INTO khach_hang (sdt, ten, tong_don, tong_doanh_thu)
  VALUES (p_sdt, p_ten, 1, p_doanh_thu)
  ON CONFLICT (sdt) DO UPDATE SET
    tong_don = khach_hang.tong_don + 1,
    tong_doanh_thu = khach_hang.tong_doanh_thu + p_doanh_thu,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
