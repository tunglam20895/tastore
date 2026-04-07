CREATE TABLE IF NOT EXISTS luot_truy_cap (
  id        bigserial PRIMARY KEY,
  trang     text NOT NULL DEFAULT '/',
  thoi_gian timestamptz DEFAULT now(),
  user_agent text,
  ref       text
);

-- Index để query nhanh theo thời gian
CREATE INDEX IF NOT EXISTS idx_luot_truy_cap_thoi_gian ON luot_truy_cap (thoi_gian DESC);
CREATE INDEX IF NOT EXISTS idx_luot_truy_cap_trang     ON luot_truy_cap (trang);
