-- Thêm cột sizes vào bảng san_pham
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';

-- so_luong đã có từ migration trước, đảm bảo tồn tại
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS so_luong INTEGER DEFAULT 0;
