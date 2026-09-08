create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc', now()),
  event text not null,
  order_id text,
  method text,
  path text,
  ip text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_order_id_idx on public.audit_logs (order_id);
create index if not exists audit_logs_event_idx on public.audit_logs (event);

create table if not exists public.midtrans_callbacks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc', now()),
  source text not null,
  event text,
  order_id text,
  transaction_id text,
  transaction_status text,
  status_code text,
  payment_type text,
  signature_valid boolean,
  ip text,
  user_agent text,
  headers jsonb,
  payload jsonb not null
);

create index if not exists midtrans_callbacks_created_at_idx on public.midtrans_callbacks (created_at desc);
create index if not exists midtrans_callbacks_order_id_idx on public.midtrans_callbacks (order_id);
create index if not exists midtrans_callbacks_source_idx on public.midtrans_callbacks (source);

alter table public.audit_logs enable row level security;
alter table public.midtrans_callbacks enable row level security;

revoke all on table public.audit_logs from anon, authenticated, public;
revoke all on table public.midtrans_callbacks from anon, authenticated, public;
grant all on table public.audit_logs to postgres, service_role;
grant all on table public.midtrans_callbacks to postgres, service_role;
grant usage, select on sequence public.audit_logs_id_seq to postgres, service_role;
grant usage, select on sequence public.midtrans_callbacks_id_seq to postgres, service_role;
