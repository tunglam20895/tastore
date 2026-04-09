-- Thêm cột lương cho nhân viên
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS luong numeric DEFAULT 0;
