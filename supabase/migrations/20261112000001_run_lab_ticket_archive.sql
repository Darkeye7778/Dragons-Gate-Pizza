alter table public.run_lab_tickets
  add column if not exists archive_url text,
  add column if not exists close_notice_id text;
