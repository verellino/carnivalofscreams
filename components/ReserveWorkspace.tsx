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
    packageId: "luxer",
    nightId: "oct-30",
    seatId: null,
  });
  const [mapPick, setMapPick] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const [takenSeatIds, setTakenSeatIds] = useState<string[]>([]);

  const selectedSeat = preview.seatId ? getSeat(preview.seatId) : undefined;
  const selectedArea = getTablePackage(preview.packageId);
  const picking =
    preview.step === "seat" || preview.step === "category";
  const focusedPackageId =
    preview.step === "seat" || preview.step === "pay"
      ? preview.packageId
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

  const hint =
    preview.step === "seat" && selectedArea
      ? `Tap ${selectedArea.range} on the map`
      : picking
        ? "Tap a table on the map"
        : undefined;

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
            packageId={focusedPackageId}
            selectedSeatId={preview.seatId}
            takenSeatIds={takenSeatIds}
            hint={hint}
            onSelect={(seat) =>
              setMapPick({ id: seat.id, nonce: Date.now() })
            }
          />
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
