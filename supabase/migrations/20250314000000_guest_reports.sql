-- Guest strategy reports (post-checkout full report + PDF)
create table if not exists public.guest_reports (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null,
  channel_url text not null default '',
  channel_title text not null default '',
  report_data jsonb not null default '{}',
  pdf_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_guest_reports_stripe_session_id
  on public.guest_reports(stripe_session_id);
create index if not exists idx_guest_reports_created_at
  on public.guest_reports(created_at desc);

comment on table public.guest_reports is 'Guest strategy reports after Stripe checkout; report_data = full analysis, pdf_url = storage key for bucket guest-reports';

-- Create storage bucket "guest-reports" in Supabase Dashboard (Storage) for PDF uploads.
