alter table public.reservations
  add column if not exists nik text,
  add column if not exists seat_id text,
  add column if not exists invoice_email_sent_at timestamptz;

create unique index if not exists reservations_night_seat_paid_uidx
  on public.reservations (night_id, seat_id)
  where seat_id is not null and status = 'paid';
