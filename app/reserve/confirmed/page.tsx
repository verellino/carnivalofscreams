import type { Metadata } from "next";
import Link from "next/link";

import {
  insertAuditLogSafe,
  insertMidtransCallbackSafe,
  requestMeta,
} from "@/lib/audit";
import {
  getTransactionStatus,
  isPaidStatus,
  isPendingStatus,
  summarizeReservation,
} from "@/lib/midtrans";

export const metadata: Metadata = {
  title: "Reservation status",
  description: "Your Carnaval of Screams table reservation status.",
};

export const dynamic = "force-dynamic";

const ORDER_ID_RE = /^COS-[A-Za-z0-9._~-]{1,46}$/;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function flattenSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      if (value[0]) flat[key] = value[0];
    } else if (typeof value === "string" && value.length > 0) {
      flat[key] = value;
    }
  }
  return flat;
}

export default async function ReservationConfirmedPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const query = flattenSearchParams(params);
  const orderId = (query.order_id ?? query.orderId ?? "").trim();
  const meta = await requestMeta();

  await insertMidtransCallbackSafe({
    source: "window_redirect",
    event: "finish",
    orderId: orderId || null,
    statusCode: query.status_code ?? null,
    transactionStatus: query.transaction_status ?? null,
    ip: meta.ip,
    userAgent: meta.userAgent,
    payload: query,
  });

  await insertAuditLogSafe({
    event: "reservation.confirmed.view",
    orderId: orderId || null,
    method: "GET",
    path: "/reserve/confirmed",
    ip: meta.ip,
    userAgent: meta.userAgent,
    payload: query,
  });

  if (!orderId || !ORDER_ID_RE.test(orderId)) {
    return (
      <StatusShell
        kicker="Reservation"
        title="We could not find that order."
        body="Check the link from Midtrans, or start a new table hold."
        action={{ href: "/reserve", label: "Reserve a table" }}
      />
    );
  }

  let status;
  try {
    status = await getTransactionStatus(orderId);
  } catch {
    return (
      <StatusShell
        kicker="Reservation"
        title="We could not check that payment."
        body="Try again in a moment. If you already paid, keep your Midtrans receipt."
        action={{ href: "/reserve", label: "Reserve a table" }}
      />
    );
  }

  if (status.status_code === "404" || !status.transaction_status) {
    return (
      <StatusShell
        kicker="Reservation"
        title="We could not find that order."
        body="If you just paid, wait a few seconds and refresh. Otherwise start a new table hold."
        action={{ href: "/reserve", label: "Reserve a table" }}
      />
    );
  }

  const summary = summarizeReservation(status);
  const paid = isPaidStatus(
    status.transaction_status,
    status.fraud_status,
  );
  const pending = isPendingStatus(status.transaction_status);

  const details = (
    <ul className="mt-8 space-y-2 text-sm text-mist/80">
      <li>
        <span className="text-mist/50">Order</span> {orderId}
      </li>
      {summary.night ? (
        <li>
          <span className="text-mist/50">Night</span> {summary.night.label}
        </li>
      ) : null}
      {summary.table ? (
        <li>
          <span className="text-mist/50">Table</span> {summary.table.name}
        </li>
      ) : null}
      {summary.partySize ? (
        <li>
          <span className="text-mist/50">Party</span> {summary.partySize}
        </li>
      ) : null}
      {summary.amountLabel ? (
        <li>
          <span className="text-mist/50">Amount</span> {summary.amountLabel}
        </li>
      ) : null}
    </ul>
  );

  if (paid) {
    return (
      <StatusShell
        kicker="Payment received"
        title="Your table is held."
        body="We will confirm your reservation by email. Bring the order number to the door."
        action={{ href: "/", label: "Back to the carnival" }}
      >
        {details}
      </StatusShell>
    );
  }

  if (pending) {
    return (
      <StatusShell
        kicker="Awaiting payment"
        title="Finish paying to keep the table."
        body="Complete the transfer in Midtrans. We confirm the table once the payment settles."
        action={{ href: "/reserve", label: "Start again" }}
      >
        {details}
      </StatusShell>
    );
  }

  return (
    <StatusShell
      kicker="Reservation"
      title="This payment is not confirmed."
      body="If you already paid, wait a moment and refresh. Otherwise try another table hold."
      action={{ href: "/reserve", label: "Reserve a table" }}
    >
      {details}
    </StatusShell>
  );
}

function StatusShell({
  kicker,
  title,
  body,
  action,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  action: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="starfield relative isolate min-h-[70vh] overflow-hidden">
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col px-6 pb-20 pt-36 text-center">
        <p className="font-heading text-xs tracking-[0.35em] text-gold-bright">
          {kicker}
        </p>
        <h1 className="mt-4 font-heading text-4xl tracking-[0.08em] text-white">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-mist/80">{body}</p>
        {children}
        <Link
          href={action.href}
          className="btn-press mt-10 inline-flex items-center justify-center self-center rounded-full border border-white/15 bg-white px-10 py-4 font-heading text-sm font-semibold tracking-widest text-black"
        >
          {action.label}
        </Link>
      </div>
    </div>
  );
}
