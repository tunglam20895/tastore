-- Bảng lưu trữ thông báo (thay thế việc fetch don_hang trực tiếp)
CREATE TABLE IF NOT EXISTS thong_bao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loai text NOT NULL CHECK (loai IN ('don_moi', 'chuyen_trang_thai')),
  don_hang_id text NOT NULL,
  ten_kh text NOT NULL,
  san_pham_tom_tat text,       -- VD: "Áo sơ mi x2, Quần jeans x1"
  tong_tien numeric,
  trang_thai_cu text,          -- Chỉ dùng khi loai = 'chuyen_trang_thai'
  trang_thai_moi text,
  nguoi_xu_ly text,            -- Tên nhân viên thực hiện (admin/staff)
  da_doc boolean DEFAULT false,
  thoi_gian timestamptz DEFAULT now()
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_thong_bao_thoi_gian ON thong_bao(thoi_gian DESC);
CREATE INDEX IF NOT EXISTS idx_thong_bao_da_doc ON thong_bao(da_doc);

-- Trigger: Tự tạo thông báo khi có đơn mới INSERT
CREATE OR REPLACE FUNCTION trg_notify_don_moi()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO thong_bao (loai, don_hang_id, ten_kh, tong_tien, trang_thai_moi)
  VALUES ('don_moi', NEW.id, NEW.ten_kh, NEW.tong_tien, NEW.trang_thai);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_don_hang_insert ON don_hang;
CREATE TRIGGER trg_don_hang_insert
  AFTER INSERT ON don_hang
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_don_moi();

-- Trigger: Tự tạo thông báo khi chuyển trạng thái
CREATE OR REPLACE FUNCTION trg_notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.trang_thai IS DISTINCT FROM NEW.trang_thai THEN
    INSERT INTO thong_bao (
      loai, don_hang_id, ten_kh, san_pham_tom_tat,
      trang_thai_cu, trang_thai_moi, nguoi_xu_ly
    ) VALUES (
      'chuyen_trang_thai',
      NEW.id,
      NEW.ten_kh,
      (SELECT string_agg(sp->>'ten' || ' x' || (sp->>'soLuong'), ', ')
       FROM jsonb_array_elements(NEW.san_pham) AS sp),
      OLD.trang_thai,
      NEW.trang_thai,
      NEW.nguoi_xu_ly
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_don_hang_status_change ON don_hang;
CREATE TRIGGER trg_don_hang_status_change
  AFTER UPDATE ON don_hang
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_status_change();
