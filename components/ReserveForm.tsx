"use client";

import Script from "next/script";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import "@/types/doku-checkout";
import { createReservation } from "@/app/actions/reserve";
import { getLineup } from "@/lib/lineup";
import { getSeat, SEATS } from "@/lib/seats";
import {
  formatIdr,
  NIGHTS,
  RESID_AREA,
  TABLE_PACKAGES,
  type NightId,
  type TablePackageId,
} from "@/lib/tables";

export type ReserveStep = "identity" | "night" | "seat" | "pay";

export type ReservePreview = {
  step: ReserveStep;
  packageId: TablePackageId | null;
  nightId: NightId;
  seatId: string | null;
};

type Props = {
  enabled: boolean;
  checkoutJsUrl: string;
  takenSeatIds: string[];
  mapPick?: { id: string; nonce: number } | null;
  onPreviewChange?: (preview: ReservePreview) => void;
};

const STEPS: ReserveStep[] = ["identity", "night", "seat", "pay"];
const STEP_LABELS = ["Details", "Day", "Table", "Pay"] as const;

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

const NIK_RE = /^\d{16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{9,16}$/;

export default function ReserveForm({
  enabled,
  checkoutJsUrl,
  takenSeatIds,
  mapPick,
  onPreviewChange,
}: Props) {
  const [step, setStep] = useState<ReserveStep>("identity");
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nightId, setNightId] = useState<NightId>("oct-30");
  const [packageId, setPackageId] = useState<TablePackageId | null>(null);
  const [seatId, setSeatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const orderIdRef = useRef<string | null>(null);
  const [appliedMapNonce, setAppliedMapNonce] = useState(0);

  const table = packageId
    ? TABLE_PACKAGES.find((pack) => pack.id === packageId)
    : undefined;
  const seat = seatId ? getSeat(seatId) : undefined;
  const busy = pending || paying;
  const stepIndex = STEPS.indexOf(step);
  const availableSeats = SEATS.filter(
    (item) => !takenSeatIds.includes(item.id),
  );

  useEffect(() => {
    onPreviewChange?.({ step, packageId, nightId, seatId });
  }, [step, packageId, nightId, seatId, onPreviewChange]);

  if (mapPick && mapPick.nonce !== appliedMapNonce) {
    const mapped = getSeat(mapPick.id);
    if (
      mapped &&
      step === "seat" &&
      !takenSeatIds.includes(mapped.id)
    ) {
      setAppliedMapNonce(mapPick.nonce);
      if (packageId !== mapped.packageId) setPackageId(mapped.packageId);
      if (seatId !== mapped.id) setSeatId(mapped.id);
      setError(null);
    } else {
      setAppliedMapNonce(mapPick.nonce);
    }
  }

  function logCheckoutCallback(event: string, payload: unknown) {
    void fetch("/api/doku/checkout-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        orderId: orderIdRef.current,
        payload: payload ?? {},
      }),
      keepalive: true,
    }).catch(() => {
      // Persistence is best-effort from the browser; HTTP notification is source of truth.
    });
  }

  function identityError() {
    if (name.trim().length < 2 || name.trim().length > 80) {
      return "Please enter your full name.";
    }
    if (!NIK_RE.test(nik.replace(/\s/g, ""))) {
      return "Please enter a 16-digit NIK.";
    }
    if (!PHONE_RE.test(phone.replace(/[\s()-]/g, ""))) {
      return "Please enter a valid phone number.";
    }
    if (!EMAIL_RE.test(email.trim())) {
      return "Please enter a valid email.";
    }
    return null;
  }

  function goNext() {
    setError(null);
    if (step === "identity") {
      const message = identityError();
      if (message) {
        setError(message);
        return;
      }
      setStep("night");
      return;
    }
    if (step === "night") {
      setStep("seat");
      return;
    }
    if (step === "seat") {
      if (!seatId || !availableSeats.some((item) => item.id === seatId)) {
        setError(
          availableSeats.length === 0
            ? "Every table is held for this night. Try the other night."
            : "Tap a table on the floor plan.",
        );
        return;
      }
      setStep("pay");
    }
  }

  function goBack() {
    setError(null);
    if (step === "night") setStep("identity");
    if (step === "seat") setStep("night");
    if (step === "pay") setStep("seat");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "pay") {
      goNext();
      return;
    }

    if (!seatId || !packageId) {
      setError("Tap a table on the floor plan.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createReservation({
        name,
        nik,
        email,
        phone,
        nightId,
        packageId,
        seatId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      orderIdRef.current = result.orderId;
      setPaying(true);
      try {
        const loadCheckout = await waitForJokulCheckout();
        logCheckoutCallback("overlay_open", {
          payment_url: result.paymentUrl,
        });
        loadCheckout(result.paymentUrl);
      } catch (err) {
        logCheckoutCallback("overlay_error", {
          message: err instanceof Error ? err.message : "unknown",
        });
        window.location.assign(result.paymentUrl);
        return;
      } finally {
        setPaying(false);
      }
    });
  }

  const night = NIGHTS.find((item) => item.id === nightId);

  return (
    <>
      {enabled && checkoutJsUrl ? (
        <Script
          id="doku-checkout"
          src={checkoutJsUrl}
          strategy="afterInteractive"
        />
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <ol className="grid grid-cols-4 gap-1 text-center">
          {STEPS.map((item, index) => (
            <li
              key={item}
              className={`font-heading text-[9px] tracking-[0.18em] sm:text-[10px] ${
                index === stepIndex
                  ? "text-white"
                  : index < stepIndex
                    ? "text-white/55"
                    : "text-white/25"
              }`}
            >
              {STEP_LABELS[index]}
            </li>
          ))}
        </ol>

        {step === "identity" ? (
          <div className="grid gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-heading text-[11px] tracking-[0.28em] text-white/50">
                Name
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
                NIK
              </span>
              <input
                required
                name="nik"
                inputMode="numeric"
                autoComplete="off"
                maxLength={16}
                placeholder="16 digits"
                value={nik}
                onChange={(event) =>
                  setNik(event.target.value.replace(/\D/g, "").slice(0, 16))
                }
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
          </div>
        ) : null}

        {step === "night" ? (
          <fieldset className="min-w-0">
            <legend className="font-heading text-[11px] tracking-[0.32em] text-white/50">
              Choose a night
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              {NIGHTS.map((item) => {
                const selected = nightId === item.id;
                const lineup = getLineup(item.id);
                return (
                  <label
                    key={item.id}
                    className={`cursor-pointer border p-4 text-left transition-colors ${
                      selected
                        ? "border-white/80 bg-white/10 text-white"
                        : "border-white/15 bg-black/30 text-white/55 hover:border-white/35"
                    }`}
                  >
                    <input
                      type="radio"
                      name="night"
                      value={item.id}
                      checked={selected}
                      onChange={() => {
                        setNightId(item.id);
                        setSeatId(null);
                        setPackageId(null);
                      }}
                      className="sr-only"
                    />
                    <span className="font-heading text-sm tracking-[0.16em] text-white">
                      {item.day}
                    </span>
                    <span className="mt-1 block text-sm text-white/70">
                      {item.label}
                    </span>
                    {lineup ? (
                      <span className="mt-2 block text-sm text-white/45">
                        Lineup · {lineup.name}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {step === "seat" ? (
          <fieldset className="min-w-0">
            <legend className="font-heading text-[11px] tracking-[0.32em] text-white/50">
              Choose a table
            </legend>
            {seat && table ? (
              <div className="mt-4 border border-white/80 bg-white/10 px-4 py-4">
                <p className="font-heading text-lg tracking-[0.16em] text-white">
                  {seat.short}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {table.name} · {table.furniture} · {table.seats} pax
                </p>
                <p className="mt-3 font-heading text-sm tracking-[0.12em] text-white">
                  {formatIdr(table.priceIdr)}
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {table.tickets} tickets included · min. spend{" "}
                  {formatIdr(table.minSpendIdr)}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                Tap a labeled table on the floor plan. The area and price come
                from that table.
              </p>
            )}
            <ul className="mt-5 space-y-1.5 text-xs leading-relaxed text-white/45">
              {TABLE_PACKAGES.map((pack) => (
                <li
                  key={pack.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span>
                    {pack.name.replace(" Area", "")} {pack.range}
                  </span>
                  <span className="shrink-0 text-white/65">
                    {formatIdr(pack.priceIdr)}
                  </span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3">
                <span>{RESID_AREA.name.replace(" Area", "")}</span>
                <span className="shrink-0">Invite only</span>
              </li>
            </ul>
          </fieldset>
        ) : null}

        {step === "pay" ? (
          <div className="space-y-3 text-sm text-white/65">
            <p>
              <span className="text-white/40">Name</span> {name}
            </p>
            <p>
              <span className="text-white/40">NIK</span> {nik}
            </p>
            <p>
              <span className="text-white/40">Phone</span> {phone}
            </p>
            <p>
              <span className="text-white/40">Email</span> {email}
            </p>
            <p>
              <span className="text-white/40">Day</span> {night?.day} ·{" "}
              {night?.label}
            </p>
            <p>
              <span className="text-white/40">Table</span> {seat?.short}
              {table ? ` · ${table.name}` : ""}
            </p>
            <p>
              <span className="text-white/40">Booking fee</span>{" "}
              {table ? formatIdr(table.priceIdr) : "—"}
            </p>
            <p>
              <span className="text-white/40">Minimum spend</span>{" "}
              {table ? `${formatIdr(table.minSpendIdr)} at the venue` : "—"}
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="inline-flex items-center gap-2 text-sm text-white/70"
          >
            <span className="pass-signal" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {step !== "identity" ? (
            <button
              type="button"
              onClick={goBack}
              disabled={busy}
              className="btn-press inline-flex items-center justify-center border border-white/20 bg-transparent px-5 py-3 font-heading text-[11px] tracking-[0.28em] text-white/70 transition-colors duration-200 hover:border-white/50 hover:text-white disabled:opacity-40"
            >
              Back
            </button>
          ) : null}

          <button
            type="submit"
            disabled={
              busy ||
              (step === "pay" && !enabled) ||
              (step === "seat" && !seatId)
            }
            className="btn-press inline-flex items-center justify-center border border-white/80 bg-white px-5 py-3 font-heading text-[11px] tracking-[0.28em] text-black transition-colors duration-200 hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black sm:text-xs"
          >
            {step === "pay"
              ? busy
                ? "Opening payment…"
                : `Pay ${table ? formatIdr(table.priceIdr) : ""}`.trim()
              : "Continue"}
          </button>
        </div>

        {step === "pay" && !enabled ? (
          <p className="inline-flex items-center gap-2 text-sm text-white/55">
            <span className="pass-signal" aria-hidden="true" />
            DOKU is not configured yet. Add the client ID and secret key before
            taking payments.
          </p>
        ) : null}

        {step === "pay" ? (
          <p className="text-xs leading-relaxed text-white/40">
            Pay the booking fee within 60 minutes to keep this table. The hold
            and the payment expire together. Minimum spend is paid at the venue
            and is not included in the booking fee. Extra guests buy their own
            tickets. We send the invoice by email and WhatsApp.
          </p>
        ) : null}
      </form>
    </>
  );
}
