alter table public.reservations
  add column if not exists expires_at timestamptz;

drop index if exists public.reservations_night_seat_paid_uidx;

create unique index if not exists reservations_night_seat_active_uidx
  on public.reservations (night_id, seat_id)
  where seat_id is not null and status in ('pending', 'paid');

create index if not exists reservations_pending_expires_at_idx
  on public.reservations (expires_at)
  where status = 'pending' and expires_at is not null;
