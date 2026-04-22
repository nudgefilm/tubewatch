CREATE TABLE IF NOT EXISTS site_visits (
  id        BIGSERIAL PRIMARY KEY,
  visit_date DATE        NOT NULL,
  ip_hash    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visit_date, ip_hash)
);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

-- 삽입은 service_role(API route)에서만 허용
CREATE POLICY "service_role insert" ON site_visits
  FOR INSERT TO service_role WITH CHECK (true);

-- 조회도 service_role만 허용
CREATE POLICY "service_role select" ON site_visits
  FOR SELECT TO service_role USING (true);
