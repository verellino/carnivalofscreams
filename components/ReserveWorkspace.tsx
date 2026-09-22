"use client";

import { useCallback, useEffect, useState } from "react";

import { listTakenSeatIdsAction } from "@/app/actions/reserve";
import ReserveForm, {
  type ReservePreview,
} from "@/components/ReserveForm";
import SeatMap from "@/components/SeatMap";
import { getSeat } from "@/lib/seats";
import { getTablePackage } from "@/lib/tables";

type Props = {
  enabled: boolean;
  checkoutJsUrl: string;
};

export default function ReserveWorkspace({ enabled, checkoutJsUrl }: Props) {
  const [preview, setPreview] = useState<ReservePreview>({
    step: "night",
    packageId: null,
    nightId: "oct-30",
    seatId: null,
  });
  const [takenSeatIds, setTakenSeatIds] = useState<string[]>([]);

  const selectedSeat = preview.seatId ? getSeat(preview.seatId) : undefined;
  const selectedArea = preview.packageId
    ? getTablePackage(preview.packageId)
    : undefined;

  const onPreviewChange = useCallback((next: ReservePreview) => {
    setPreview(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listTakenSeatIdsAction(preview.nightId).then((ids) => {
      if (!cancelled) setTakenSeatIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [preview.nightId, preview.step]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-heading text-[11px] tracking-[0.42em] text-white/55">
            Table reservation
          </p>
          <h1 className="pass-title mt-2 font-heading text-4xl tracking-[0.14em] text-white sm:text-5xl">
            Reserve
          </h1>
        </div>
        {selectedSeat && selectedArea ? (
          <p className="font-heading text-sm tracking-[0.18em] text-white">
            {selectedSeat.short}
            <span className="text-white/45"> · {selectedArea.name}</span>
          </p>
        ) : null}
      </header>

      <div className="pass-panel p-5 sm:p-6">
        <ReserveForm
          enabled={enabled}
          checkoutJsUrl={checkoutJsUrl}
          takenSeatIds={takenSeatIds}
          onPreviewChange={onPreviewChange}
        />
      </div>

      <details className="mt-6 border border-white/15 bg-black/30">
        <summary className="cursor-pointer list-none px-4 py-3 font-heading text-[11px] tracking-[0.28em] text-white/55 transition-colors hover:text-white">
          View floor plan
        </summary>
        <div className="px-4 pb-4">
          <SeatMap />
          <p className="mt-3 text-sm text-white/45">
            Reference only. Every table is booked from the buttons above.
          </p>
        </div>
      </details>
    </div>
  );
}
