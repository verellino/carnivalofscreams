"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";

import { createReservation } from "@/app/actions/reserve";
import {
  formatIdr,
  NIGHTS,
  TABLE_PACKAGES,
  type NightId,
  type TablePackageId,
} from "@/lib/tables";

type SnapPayResult = {
  order_id?: string;
  [key: string]: unknown;
};

type Props = {
  clientKey: string;
  snapJsUrl: string;
};

function waitForSnap() {
  return new Promise<NonNullable<Window["snap"]>>((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.snap) {
        resolve(window.snap);
        return;
      }
      if (Date.now() - started > 8000) {
        reject(new Error("Payment is still loading. Please try again."));
        return;
      }
      window.setTimeout(tick, 80);
    };
    tick();
  });
}

export default function ReserveForm({ clientKey, snapJsUrl }: Props) {
  const router = useRouter();
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

  async function logSnapCallback(event: string, payload: unknown) {
    try {
      await fetch("/api/midtrans/snap-callback", {
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

  function goToConfirmed(result: SnapPayResult) {
    const orderId = result.order_id;
    if (!orderId) {
      setError("Payment finished, but we could not read your order. Check your email.");
      setPaying(false);
      return;
    }
    router.push(`/reserve/confirmed?order_id=${encodeURIComponent(orderId)}`);
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
        const snap = await waitForSnap();
        snap.pay(result.token, {
          onSuccess: (payResult) => {
            void logSnapCallback("onSuccess", payResult).finally(() =>
              goToConfirmed(payResult),
            );
          },
          onPending: (payResult) => {
            void logSnapCallback("onPending", payResult).finally(() =>
              goToConfirmed(payResult),
            );
          },
          onError: (payResult) => {
            void logSnapCallback("onError", payResult).finally(() => {
              setPaying(false);
              setError("Payment did not go through. Try another method.");
            });
          },
          onClose: () => {
            void logSnapCallback("onClose", {});
            setPaying(false);
          },
        });
      } catch (err) {
        setPaying(false);
        setError(
          err instanceof Error ? err.message : "Could not open payment.",
        );
      }
    });
  }

  return (
    <>
      {clientKey ? (
        <Script
          id="midtrans-snap"
          src={snapJsUrl}
          data-client-key={clientKey}
          strategy="afterInteractive"
        />
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <fieldset className="min-w-0">
          <legend className="font-heading text-sm tracking-[0.22em] text-gold-bright">
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
                      ? "border-gold bg-gold/15 text-white"
                      : "border-white/15 bg-black/30 text-mist hover:border-white/35"
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
          <legend className="font-heading text-sm tracking-[0.22em] text-gold-bright">
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
                      ? "border-gold bg-gold/12"
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
                    <span className="font-heading text-sm tracking-widest text-gold-bright">
                      {formatIdr(pack.priceIdr)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-mist/80">
                    {pack.seats} seats · {pack.blurb}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="font-heading text-xs tracking-[0.2em] text-mist/80">
              Full name
            </span>
            <input
              required
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-heading text-xs tracking-[0.2em] text-mist/80">
              Email
            </span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-heading text-xs tracking-[0.2em] text-mist/80">
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
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-heading text-xs tracking-[0.2em] text-mist/80">
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
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="font-heading text-xs tracking-[0.2em] text-mist/80">
              Notes <span className="text-mist/40">(optional)</span>
            </span>
            <textarea
              name="notes"
              rows={3}
              maxLength={400}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="resize-y border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-gold"
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-pink">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !clientKey}
          className="btn-press inline-flex items-center justify-center rounded-full border border-white/15 bg-white px-10 py-4 font-heading text-sm font-semibold tracking-widest text-black shadow-[0_0_50px_-10px_rgba(255,255,255,0.9)] transition-shadow duration-200 hover:shadow-[0_0_64px_-8px_rgba(255,255,255,1)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
        >
          {busy
            ? "Opening payment…"
            : `Pay ${formatIdr(table.priceIdr)} to reserve`}
        </button>

        {!clientKey ? (
          <p className="text-sm text-mist/70">
            Midtrans client key is missing. Add it to the environment before
            taking payments.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-mist/55">
            You will pay through Midtrans. After the transfer clears, we confirm
            your table by email.
          </p>
        )}
      </form>
    </>
  );
}
