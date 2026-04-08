create table danh_muc (
  id text primary key,
  ten_danh_muc text not null
);

create table san_pham (
  id text primary key default 'sp_' || extract(epoch from now())::bigint::text,
  ten text not null,
  gia_goc numeric not null,
  phan_tram_giam numeric check (phan_tram_giam between 0 and 100),
  anh_url text,
  mo_ta text,
  danh_muc text references danh_muc(id),
  con_hang boolean default true,
  created_at timestamptz default now()
);

create table don_hang (
  id text primary key default 'dh_' || extract(epoch from now())::bigint::text,
  ten_kh text not null,
  sdt text not null,
  dia_chi text not null,
  san_pham jsonb not null,
  tong_tien numeric not null,
  thoi_gian timestamptz default now(),
  trang_thai text default 'Mới' check (trang_thai in ('Mới','Chốt để lên đơn','Đã lên đơn','Đang xử lý','Đã giao','Huỷ'))
);

create table cai_dat (
  key text primary key,
  value text
);

insert into cai_dat values
  ('LogoURL', ''),
  ('TenShop', 'TRANH ANH STORE'),
  ('SDT', ''),
  ('DiaChi', ''),
  ('Email', '');