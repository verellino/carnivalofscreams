import { getSql } from "./db";
import { getSeat } from "./seats";
import type { NightId, TablePackageId } from "./tables";

export type ReservationRecord = {
  orderId: string;
  name: string;
  nik: string | null;
  email: string;
  phone: string;
  nightId: NightId;
  packageId: TablePackageId;
  partySize: number;
  notes: string | null;
  amountIdr: number;
  status: string;
  paymentUrl: string | null;
  paymentToken: string | null;
  channelId: string | null;
  transactionStatus: string | null;
  paidAt: Date | null;
  seatId: string | null;
  whatsappMessageId: string | null;
  whatsappSentAt: Date | null;
  invoiceEmailSentAt: Date | null;
};

type ReservationRow = {
  order_id: string;
  name: string;
  nik: string | null;
  email: string;
  phone: string;
  night_id: string;
  package_id: string;
  party_size: number;
  notes: string | null;
  amount_idr: number;
  status: string;
  payment_url: string | null;
  payment_token: string | null;
  channel_id: string | null;
  transaction_status: string | null;
  paid_at: Date | null;
  seat_id: string | null;
  whatsapp_message_id: string | null;
  whatsapp_sent_at: Date | null;
  invoice_email_sent_at: Date | null;
};

function asNightId(value: string): NightId | undefined {
  if (value === "oct-30" || value === "oct-31") return value;
  return undefined;
}

function asPackageId(value: string): TablePackageId | undefined {
  if (value === "standard" || value === "premiere" || value === "vip") {
    return value;
  }
  return undefined;
}

function mapReservation(row: ReservationRow): ReservationRecord | null {
  const nightId = asNightId(row.night_id);
  const packageId = asPackageId(row.package_id);
  if (!nightId || !packageId) return null;

  return {
    orderId: row.order_id,
    name: row.name,
    nik: row.nik,
    email: row.email,
    phone: row.phone,
    nightId,
    packageId,
    partySize: row.party_size,
    notes: row.notes,
    amountIdr: row.amount_idr,
    status: row.status,
    paymentUrl: row.payment_url,
    paymentToken: row.payment_token,
    channelId: row.channel_id,
    transactionStatus: row.transaction_status,
    paidAt: row.paid_at,
    seatId: row.seat_id,
    whatsappMessageId: row.whatsapp_message_id,
    whatsappSentAt: row.whatsapp_sent_at,
    invoiceEmailSentAt: row.invoice_email_sent_at,
  };
}

export async function insertReservation(entry: {
  orderId: string;
  name: string;
  nik: string;
  email: string;
  phone: string;
  nightId: NightId;
  packageId: TablePackageId;
  partySize: number;
  notes?: string;
  amountIdr: number;
  paymentUrl?: string | null;
  paymentToken?: string | null;
}) {
  const sql = getSql();
  await sql`
    insert into public.reservations (
      order_id,
      name,
      nik,
      email,
      phone,
      night_id,
      package_id,
      party_size,
      notes,
      amount_idr,
      payment_url,
      payment_token,
      status
    ) values (
      ${entry.orderId},
      ${entry.name},
      ${entry.nik},
      ${entry.email},
      ${entry.phone},
      ${entry.nightId},
      ${entry.packageId},
      ${entry.partySize},
      ${entry.notes ?? null},
      ${entry.amountIdr},
      ${entry.paymentUrl ?? null},
      ${entry.paymentToken ?? null},
      ${"pending"}
    )
  `;
}

export async function insertReservationSafe(
  entry: Parameters<typeof insertReservation>[0],
) {
  try {
    await insertReservation(entry);
  } catch (error) {
    console.error("[reservations] failed to insert reservation", error);
  }
}

export async function getReservation(orderId: string) {
  const sql = getSql();
  const rows = await sql<ReservationRow[]>`
    select
      order_id,
      name,
      nik,
      email,
      phone,
      night_id,
      package_id,
      party_size,
      notes,
      amount_idr,
      status,
      payment_url,
      payment_token,
      channel_id,
      transaction_status,
      paid_at,
      seat_id,
      whatsapp_message_id,
      whatsapp_sent_at,
      invoice_email_sent_at
    from public.reservations
    where order_id = ${orderId}
    limit 1
  `;

  const row = rows[0];
  return row ? mapReservation(row) : null;
}

export async function getReservationSafe(orderId: string) {
  try {
    return await getReservation(orderId);
  } catch (error) {
    console.error("[reservations] failed to load reservation", error);
    return null;
  }
}

export async function listTakenSeatIds(nightId: NightId) {
  const sql = getSql();
  const rows = await sql<{ seat_id: string }[]>`
    select seat_id
    from public.reservations
    where night_id = ${nightId}
      and seat_id is not null
      and status = ${"paid"}
  `;
  return rows.map((row) => row.seat_id);
}

export async function listTakenSeatIdsSafe(nightId: NightId) {
  try {
    return await listTakenSeatIds(nightId);
  } catch (error) {
    console.error("[reservations] failed to load taken seats", error);
    return [] as string[];
  }
}

export async function markReservationPaid(entry: {
  orderId: string;
  transactionStatus: string;
  channelId?: string | null;
}) {
  const sql = getSql();
  const rows = await sql<ReservationRow[]>`
    update public.reservations
    set
      status = ${"paid"},
      transaction_status = ${entry.transactionStatus},
      channel_id = ${entry.channelId ?? null},
      paid_at = coalesce(paid_at, timezone('utc', now()))
    where order_id = ${entry.orderId}
    returning
      order_id,
      name,
      nik,
      email,
      phone,
      night_id,
      package_id,
      party_size,
      notes,
      amount_idr,
      status,
      payment_url,
      payment_token,
      channel_id,
      transaction_status,
      paid_at,
      seat_id,
      whatsapp_message_id,
      whatsapp_sent_at,
      invoice_email_sent_at
  `;

  const row = rows[0];
  return row ? mapReservation(row) : null;
}

export async function markReservationPaidSafe(
  entry: Parameters<typeof markReservationPaid>[0],
) {
  try {
    return await markReservationPaid(entry);
  } catch (error) {
    console.error("[reservations] failed to mark reservation paid", error);
    return null;
  }
}

export async function claimReservationSeat(orderId: string, seatId: string) {
  const reservation = await getReservation(orderId);
  if (!reservation || reservation.status !== "paid") {
    throw new Error("Payment is not confirmed yet.");
  }

  const seat = getSeat(seatId);
  if (!seat || seat.packageId !== reservation.packageId) {
    throw new Error("That sofa is not in the category you paid for.");
  }

  if (reservation.seatId) {
    return reservation;
  }

  const sql = getSql();
  try {
    const rows = await sql<ReservationRow[]>`
      update public.reservations
      set seat_id = ${seatId}
      where order_id = ${orderId}
        and status = ${"paid"}
        and seat_id is null
      returning
        order_id,
        name,
        nik,
        email,
        phone,
        night_id,
        package_id,
        party_size,
        notes,
        amount_idr,
        status,
        payment_url,
        payment_token,
        channel_id,
        transaction_status,
        paid_at,
        seat_id,
        whatsapp_message_id,
        whatsapp_sent_at,
        invoice_email_sent_at
    `;

    const row = rows[0];
    if (!row) {
      throw new Error("That sofa was just taken. Pick another.");
    }
    return mapReservation(row);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code === "23505") {
      throw new Error("That sofa was just taken. Pick another.");
    }
    throw error;
  }
}

export async function markWhatsAppSent(orderId: string, messageId: string) {
  const sql = getSql();
  await sql`
    update public.reservations
    set
      whatsapp_message_id = ${messageId},
      whatsapp_sent_at = timezone('utc', now())
    where order_id = ${orderId}
  `;
}

export async function markWhatsAppSentSafe(orderId: string, messageId: string) {
  try {
    await markWhatsAppSent(orderId, messageId);
  } catch (error) {
    console.error("[reservations] failed to store WhatsApp message id", error);
  }
}

export async function markInvoiceEmailSent(orderId: string) {
  const sql = getSql();
  await sql`
    update public.reservations
    set invoice_email_sent_at = timezone('utc', now())
    where order_id = ${orderId}
  `;
}

export async function markInvoiceEmailSentSafe(orderId: string) {
  try {
    await markInvoiceEmailSent(orderId);
  } catch (error) {
    console.error("[reservations] failed to store invoice email time", error);
  }
}
