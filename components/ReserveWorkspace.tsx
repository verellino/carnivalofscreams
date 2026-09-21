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
    step: "identity",
    packageId: null,
    nightId: "oct-30",
    seatId: null,
  });
  const [mapPick, setMapPick] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const [takenSeatIds, setTakenSeatIds] = useState<string[]>([]);

  const selectedSeat = preview.seatId ? getSeat(preview.seatId) : undefined;
  const selectedArea = preview.packageId
    ? getTablePackage(preview.packageId)
    : undefined;
  const picking = preview.step === "seat";

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
    <div className="mx-auto w-full max-w-[92rem] px-4 pb-16 pt-20 sm:px-6 sm:pt-24 lg:px-8">
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

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <section className="min-w-0 flex-1">
          <SeatMap
            mode={picking ? "pick" : "preview"}
            selectedSeatId={preview.seatId}
            takenSeatIds={takenSeatIds}
            onSelect={(seat) =>
              setMapPick({ id: seat.id, nonce: Date.now() })
            }
          />
          {picking ? (
            <p className="mt-3 text-sm text-white/50">
              Tap a labeled table. Held tables are marked in red.
            </p>
          ) : (
            <p className="mt-3 text-sm text-white/40">
              Floor plan for Carnaval of Screams 2026.
            </p>
          )}
        </section>

        <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:max-h-[calc(100svh-8rem)] lg:w-[24rem] lg:overflow-y-auto">
          <div className="pass-panel p-5 sm:p-6">
            <ReserveForm
              enabled={enabled}
              checkoutJsUrl={checkoutJsUrl}
              takenSeatIds={takenSeatIds}
              mapPick={mapPick}
              onPreviewChange={onPreviewChange}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
