"use client";

import Script from "next/script";
import { useRef, useState, useTransition, type FormEvent } from "react";

import "@/types/doku-checkout";
import { createReservation } from "@/app/actions/reserve";
import {
  formatIdr,
  NIGHTS,
  TABLE_PACKAGES,
  type NightId,
  type TablePackageId,
} from "@/lib/tables";

type Props = {
  enabled: boolean;
  checkoutJsUrl: string;
};

function waitForJokulCheckout() {
  return new Promise<NonNullable<Window["loadJokulCheckout"]>>(
    (resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (typeof window.loadJokulCheckout === "function") {
          resolve(window.loadJokulCheckout);
          return;
        }
        if (Date.now() - started > 8000) {
          reject(new Error("Payment is still loading. Please try again."));
          return;
        }
        window.setTimeout(tick, 80);
      };
      tick();
    },
  );
}

export default function ReserveForm({ enabled, checkoutJsUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nightId, setNightId] = useState<NightId>("oct-30");
  const [packageId, setPackageId] = useState<TablePackageId>("premiere");
  const [partySize, setPartySize] = useState(4);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const orderIdRef = useRef<string | null>(null);

  const table = TABLE_PACKAGES.find((pack) => pack.id === packageId)!;
  const busy = pending || paying;
  const seats = Math.min(partySize, table.seats);

  async function logCheckoutCallback(event: string, payload: unknown) {
    try {
      await fetch("/api/doku/checkout-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          orderId: orderIdRef.current,
          payload: payload ?? {},
        }),
        keepalive: true,
      });
    } catch {
      // Persistence is best-effort from the browser; HTTP notification is source of truth.
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createReservation({
        name,
        email,
        phone,
        nightId,
        packageId,
        partySize: seats,
        notes,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      orderIdRef.current = result.orderId;
      setPaying(true);
      try {
        const loadCheckout = await waitForJokulCheckout();
        await logCheckoutCallback("overlay_open", {
          payment_url: result.paymentUrl,
        });
        loadCheckout(result.paymentUrl);
      } catch (err) {
        await logCheckoutCallback("overlay_error", {
          message: err instanceof Error ? err.message : "unknown",
        });
        window.location.assign(result.paymentUrl);
        return;
      } finally {
        setPaying(false);
      }
    });
  }

  return (
    <>
      {enabled && checkoutJsUrl ? (
        <Script
          id="doku-checkout"
          src={checkoutJsUrl}
          strategy="afterInteractive"
        />
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <fieldset className="min-w-0">
          <legend className="font-heading text-[11px] tracking-[0.32em] text-white/50">
            Choose a night
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {NIGHTS.map((night) => {
              const selected = nightId === night.id;
              return (
                <label
                  key={night.id}
                  className={`cursor-pointer border px-4 py-3 text-center transition-colors ${
                    selected
                      ? "border-white/80 bg-white/10 text-white"
                      : "border-white/15 bg-black/30 text-white/55 hover:border-white/35"
                  }`}
                >
                  <input
                    type="radio"
                    name="night"
                    value={night.id}
                    checked={selected}
                    onChange={() => setNightId(night.id)}
                    className="sr-only"
                  />
                  <span className="font-heading text-xs tracking-[0.18em] sm:text-sm">
                    {night.label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="font-heading text-[11px] tracking-[0.32em] text-white/50">
            Choose a table
          </legend>
          <div className="mt-3 flex flex-col gap-2">
            {TABLE_PACKAGES.map((pack) => {
              const selected = packageId === pack.id;
              return (
                <label
                  key={pack.id}
                  className={`cursor-pointer border p-4 transition-colors ${
                    selected
                      ? "border-white/80 bg-white/10"
                      : "border-white/15 bg-black/30 hover:border-white/35"
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={pack.id}
                    checked={selected}
                    onChange={() => {
                      setPackageId(pack.id);
                      setPartySize((size) => Math.min(size, pack.seats));
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-heading text-sm tracking-[0.16em] text-white sm:text-base">
                      {pack.name}
                    </span>
                    <span className="font-heading text-sm tracking-[0.12em] text-white">
                      {formatIdr(pack.priceIdr)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-white/55">
                    {pack.seats} seats · {pack.blurb}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="font-heading text-[11px] tracking-[0.28em] text-white/50">
              Full name
            </span>
            <input
              required
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-white/70"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-heading text-[11px] tracking-[0.28em] text-white/50">
              Email
            </span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-white/70"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-heading text-[11px] tracking-[0.28em] text-white/50">
              Phone
            </span>
            <input
              required
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              placeholder="0812…"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-white/70"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-heading text-[11px] tracking-[0.28em] text-white/50">
              Party size
            </span>
            <input
              required
              type="number"
              name="partySize"
              min={1}
              max={table.seats}
              value={seats}
              onChange={(event) =>
                setPartySize(
                  Math.min(
                    table.seats,
                    Math.max(1, Number(event.target.value) || 1),
                  ),
                )
              }
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-white/70"
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="font-heading text-[11px] tracking-[0.28em] text-white/50">
              Notes <span className="text-white/30">(optional)</span>
            </span>
            <textarea
              name="notes"
              rows={3}
              maxLength={400}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="resize-y border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-white/70"
            />
          </label>
        </div>

        {error ? (
          <p
            role="alert"
            className="inline-flex items-center gap-2 text-sm text-white/70"
          >
            <span className="pass-signal" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !enabled}
          className="btn-press inline-flex items-center justify-center border border-white/80 bg-white px-5 py-3 font-heading text-[11px] tracking-[0.28em] text-black transition-colors duration-200 hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black sm:text-xs"
        >
          {busy
            ? "Opening payment…"
            : `Pay ${formatIdr(table.priceIdr)} to reserve`}
        </button>

        {!enabled ? (
          <p className="inline-flex items-center gap-2 text-sm text-white/55">
            <span className="pass-signal" aria-hidden="true" />
            DOKU is not configured yet. Add the client ID and secret key before
            taking payments.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-white/40">
            You will pay through DOKU. After the transfer clears, we confirm
            your table by WhatsApp.
          </p>
        )}
      </form>
    </>
  );
}
