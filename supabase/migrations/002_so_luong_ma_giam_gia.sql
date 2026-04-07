-- 1. Thêm cột so_luong vào san_pham
alter table san_pham add column so_luong integer not null default 0;

-- Đồng bộ con_hang từ so_luong
update san_pham set so_luong = case when con_hang then 999 else 0 end;

-- 2. Thêm cột mã giảm giá vào don_hang
alter table don_hang add column ma_giam_gia text;
alter table don_hang add column gia_tri_giam numeric not null default 0;

-- 3. Tạo bảng ma_giam_gia
create table ma_giam_gia (
  id text primary key default 'mgg_' || extract(epoch from now())::bigint::text,
  ma text not null unique,
  loai text not null check (loai in ('phan_tram', 'so_tien')),
  gia_tri numeric not null,
  gia_tri_toi_da numeric,
  don_hang_toi_thieu numeric not null default 0,
  so_luong integer not null default 1,
  da_dung integer not null default 0,
  con_hieu_luc boolean not null default true,
  ngay_het_han timestamptz,
  created_at timestamptz default now()
);

-- 4. Function giảm tồn kho
create or replace function decrement_so_luong(product_id text, quantity integer)
returns void as $$
  update san_pham
  set so_luong = greatest(0, so_luong - quantity),
      con_hang = (greatest(0, so_luong - quantity) > 0)
  where id = product_id;
$$ language sql;
