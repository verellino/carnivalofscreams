create table if not exists public.reservations (
  order_id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  name text not null,
  email text not null,
  phone text not null,
  night_id text not null,
  package_id text not null,
  party_size integer not null,
  notes text,
  amount_idr integer not null,
  status text not null default 'pending',
  payment_url text,
  payment_token text,
  channel_id text,
  transaction_status text,
  paid_at timestamptz,
  whatsapp_message_id text,
  whatsapp_sent_at timestamptz
);

create index if not exists reservations_created_at_idx on public.reservations (created_at desc);
create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists reservations_email_idx on public.reservations (email);
create index if not exists reservations_phone_idx on public.reservations (phone);

create table if not exists public.doku_callbacks (
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

create index if not exists doku_callbacks_created_at_idx on public.doku_callbacks (created_at desc);
create index if not exists doku_callbacks_order_id_idx on public.doku_callbacks (order_id);
create index if not exists doku_callbacks_source_idx on public.doku_callbacks (source);

alter table public.reservations enable row level security;
alter table public.doku_callbacks enable row level security;

revoke all on table public.reservations from anon, authenticated, public;
revoke all on table public.doku_callbacks from anon, authenticated, public;

grant all on table public.reservations to postgres, service_role;
grant all on table public.doku_callbacks to postgres, service_role;
grant usage, select on sequence public.doku_callbacks_id_seq to postgres, service_role;
