"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { selectReservationSeat } from "@/app/actions/reserve";
import SeatMap from "@/components/SeatMap";
import type { TablePackageId } from "@/lib/tables";

type Props = {
  orderId: string;
  packageId: TablePackageId;
  takenSeatIds: string[];
};

export default function SeatPicker({
  orderId,
  packageId,
  takenSeatIds,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    if (!selectedSeatId) {
      setError("Pick a seat in the category you paid for.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await selectReservationSeat({
        orderId,
        seatId: selectedSeatId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
      <SeatMap
        mode="pick"
        packageId={packageId}
        selectedSeatId={selectedSeatId}
        takenSeatIds={takenSeatIds}
        onSelect={(seat) => {
          setSelectedSeatId(seat.id);
          setError(null);
        }}
      />

      {error ? (
        <p
          role="alert"
          className="mt-6 inline-flex items-center gap-2 text-sm text-white/70"
        >
          <span className="pass-signal" aria-hidden="true" />
          {error}
        </p>
      ) : (
        <p className="mt-6 text-sm text-white/45">
          Only seats in your paid category can be chosen.
        </p>
      )}

      <button
        type="button"
        disabled={pending || !selectedSeatId}
        onClick={onConfirm}
        className="btn-press mt-8 inline-flex items-center justify-center border border-white/80 bg-white px-8 py-3 font-heading text-[11px] tracking-[0.28em] text-black transition-colors duration-200 hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
      >
        {pending ? "Holding seat…" : "Confirm seat"}
      </button>
    </div>
  );
}
