create table public.run_lab_tickets (
  id text primary key,
  kind text not null check (kind in ('support', 'appeal')),
  opener text not null,
  run_id text,
  detail text not null,
  channel_id text unique,
  tracker_id text unique,
  claimed_by text,
  closed_at timestamptz,
  outcome text,
  transcript jsonb,
  created_at timestamptz not null default now()
);
create index run_lab_open_tickets on public.run_lab_tickets(created_at, id) where closed_at is null;
create table public.run_lab_reports (
  run_id text primary key,
  author text not null,
  report jsonb not null
);
create table public.run_lab_queue (
  key text primary key,
  snapshot jsonb not null
);
create table public.run_lab_notices (
  run_id text primary key,
  category text not null,
  pending_message text,
  resolved_status text,
  verified_message text,
  created_at timestamptz not null default now()
);

alter table public.run_lab_tickets enable row level security;
alter table public.run_lab_reports enable row level security;
alter table public.run_lab_queue enable row level security;
alter table public.run_lab_notices enable row level security;
revoke all on public.run_lab_tickets, public.run_lab_reports, public.run_lab_queue, public.run_lab_notices from anon, authenticated;
grant select, insert, update, delete on public.run_lab_tickets, public.run_lab_reports, public.run_lab_queue, public.run_lab_notices to service_role;
