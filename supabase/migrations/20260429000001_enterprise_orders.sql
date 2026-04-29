CREATE TABLE b2b_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  channel_url text NOT NULL,
  tax_invoice_requested boolean NOT NULL DEFAULT false,
  tax_invoice_info text,
  status text NOT NULL DEFAULT 'new',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE b2b_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "b2b_inquiries_service_role_only"
  ON b2b_inquiries FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE enterprise_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'tubewatch',
  inquiry_id uuid REFERENCES b2b_inquiries(id),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  contact_phone text,
  channel_url text NOT NULL,
  portone_payment_id text,
  amount_krw integer NOT NULL DEFAULT 330000,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('inquiry_received','payment_pending','paid','analysis_progress','completed','failed')),
  reports_issued integer NOT NULL DEFAULT 0,
  total_reports integer NOT NULL DEFAULT 3,
  tax_invoice_requested boolean NOT NULL DEFAULT false,
  tax_invoice_issued boolean NOT NULL DEFAULT false,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enterprise_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enterprise_orders_self_select"
  ON enterprise_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_enterprise_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER enterprise_orders_updated_at
  BEFORE UPDATE ON enterprise_orders
  FOR EACH ROW EXECUTE FUNCTION update_enterprise_orders_updated_at();

CREATE INDEX idx_enterprise_orders_email ON enterprise_orders (email);
CREATE INDEX idx_enterprise_orders_inquiry_id ON enterprise_orders (inquiry_id);
