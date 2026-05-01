ALTER TABLE enterprise_orders
  ADD COLUMN IF NOT EXISTS consulting_plan_id text,
  ADD COLUMN IF NOT EXISTS completed_months text[] NOT NULL DEFAULT '{}';
