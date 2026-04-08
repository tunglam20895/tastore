-- Thêm cột người xử lý vào bảng đơn hàng
alter table don_hang add column if not exists nguoi_xu_ly text default 'Chưa có';

-- Cập nhật các đơn hàng hiện có
update don_hang set nguoi_xu_ly = 'Chưa có' where nguoi_xu_ly is null;
