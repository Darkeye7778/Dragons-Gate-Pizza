create table if not exists public.discord_staff_activity_settings (
  guild_id text primary key check (guild_id ~ '^[0-9]{16,22}$'),
  channel_id text check (channel_id ~ '^[0-9]{16,22}$'),
  ping_role_ids text[] not null default '{}',
  joins text not null default 'off' check (joins in ('off', 'log', 'ping')),
  leaves text not null default 'off' check (leaves in ('off', 'log', 'ping')),
  deletions text not null default 'off' check (deletions in ('off', 'log', 'ping')),
  constraint discord_staff_activity_ping_roles check (
    cardinality(ping_role_ids) <= 2
    and array_position(ping_role_ids, null) is null
    and coalesce(ping_role_ids[1], guild_id) ~ '^[0-9]{16,22}$'
    and coalesce(ping_role_ids[2], guild_id) ~ '^[0-9]{16,22}$'
    and not (guild_id = any(ping_role_ids))
  )
);

alter table public.discord_staff_activity_settings enable row level security;
revoke all on public.discord_staff_activity_settings from anon, authenticated;
grant select, insert, update on public.discord_staff_activity_settings to service_role;
