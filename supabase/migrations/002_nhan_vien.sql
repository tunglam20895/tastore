-- Bảng nhân viên
create table if not exists nhan_vien (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  username text unique not null,
  password_hash text not null,
  quyen text[] not null default '{}',
  con_hoat_dong boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger tự cập nhật updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger nhan_vien_updated_at
  before update on nhan_vien
  for each row execute function update_updated_at();
