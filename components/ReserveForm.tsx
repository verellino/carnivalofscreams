"use client";

import Script from "next/script";
import { useRef, useState, useTransition, type FormEvent } from "react";

import "@/types/doku-checkout";
import { createReservation } from "@/app/actions/reserve";
import { getLineup } from "@/lib/lineup";
import {
  formatIdr,
  NIGHTS,
  TABLE_PACKAGES,
  type NightId,
  type TablePackageId,
} from "@/lib/tables";

type Step = "identity" | "night" | "category" | "pay";

type Props = {
  enabled: boolean;
  checkoutJsUrl: string;
  onPackageIdChange?: (packageId: TablePackageId) => void;
};

const STEPS: Step[] = ["identity", "night", "category", "pay"];

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
  onPackageIdChange,
}: Props) {
  const [step, setStep] = useState<Step>("identity");
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nightId, setNightId] = useState<NightId>("oct-30");
  const [packageId, setPackageId] = useState<TablePackageId>("premiere");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const orderIdRef = useRef<string | null>(null);

  const table = TABLE_PACKAGES.find((pack) => pack.id === packageId)!;
  const busy = pending || paying;
  const stepIndex = STEPS.indexOf(step);

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
      setStep("category");
      return;
    }
    if (step === "category") {
      setStep("pay");
    }
  }

  function goBack() {
    setError(null);
    if (step === "night") setStep("identity");
    if (step === "category") setStep("night");
    if (step === "pay") setStep("category");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "pay") {
      goNext();
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
              {index === 0
                ? "Details"
                : index === 1
                  ? "Day"
                  : index === 2
                    ? "Category"
                    : "Pay"}
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
              {NIGHTS.map((night) => {
                const selected = nightId === night.id;
                const lineup = getLineup(night.id);
                return (
                  <label
                    key={night.id}
                    className={`cursor-pointer border p-4 text-left transition-colors ${
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
                    <span className="font-heading text-sm tracking-[0.16em] text-white">
                      {night.day}
                    </span>
                    <span className="mt-1 block text-sm text-white/70">
                      {night.label}
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

        {step === "category" ? (
          <fieldset className="min-w-0">
            <legend className="font-heading text-[11px] tracking-[0.32em] text-white/50">
              Choose a sofa category
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
                        onPackageIdChange?.(pack.id);
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
              <span className="text-white/40">Day</span>{" "}
              {NIGHTS.find((night) => night.id === nightId)?.day} ·{" "}
              {NIGHTS.find((night) => night.id === nightId)?.label}
            </p>
            <p>
              <span className="text-white/40">Category</span> {table.name} ·{" "}
              {formatIdr(table.priceIdr)}
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
            disabled={busy || (step === "pay" && !enabled)}
            className="btn-press inline-flex items-center justify-center border border-white/80 bg-white px-5 py-3 font-heading text-[11px] tracking-[0.28em] text-black transition-colors duration-200 hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black sm:text-xs"
          >
            {step === "pay"
              ? busy
                ? "Opening payment…"
                : `Pay ${formatIdr(table.priceIdr)}`
              : "Continue"}
          </button>
        </div>

        {step === "pay" && !enabled ? (
          <p className="inline-flex items-center gap-2 text-sm text-white/55">
            <span className="pass-signal" aria-hidden="true" />
            DOKU is not configured yet. Add the client ID and secret key before
            taking payments.
          </p>
        ) : step === "pay" ? (
          <p className="text-xs leading-relaxed text-white/40">
            Pay the sofa category through DOKU. After the transfer clears, pick
            your sofa. We send the invoice by email and WhatsApp.
          </p>
        ) : null}
      </form>
    </>
  );
}
