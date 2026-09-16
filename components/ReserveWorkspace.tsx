"use client";

import { useCallback, useEffect, useState } from "react";

import { listTakenSeatIdsAction } from "@/app/actions/reserve";
import ReserveForm, {
  type ReservePreview,
} from "@/components/ReserveForm";
import SeatMap from "@/components/SeatMap";

type Props = {
  enabled: boolean;
  checkoutJsUrl: string;
};

export default function ReserveWorkspace({ enabled, checkoutJsUrl }: Props) {
  const [preview, setPreview] = useState<ReservePreview>({
    step: "identity",
    packageId: "sofa",
    nightId: "oct-30",
    seatId: null,
  });
  const [mapSeatId, setMapSeatId] = useState<string | null>(null);
  const [takenSeatIds, setTakenSeatIds] = useState<string[]>([]);

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-28 pt-24 sm:pt-32 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start lg:gap-16 lg:pb-36">
      <div>
        <p className="font-heading text-[11px] tracking-[0.42em] text-white/55 sm:text-xs">
          Table reservation
        </p>
        <h1 className="pass-title mt-5 font-heading text-5xl tracking-[0.14em] text-white sm:text-7xl">
          Reserve
        </h1>
        <p className="mt-6 font-heading text-sm tracking-[0.28em] text-white sm:text-xl">
          Hold a table for the night
        </p>
        <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
          Enter your details, pick a night, a table, and the seat on the floor
          plan, then pay the booking fee through DOKU. That locks the seat for
          60 minutes. Minimum spend is paid at the venue. We send the invoice
          by email and WhatsApp.
        </p>
        <div className="mt-12">
          <SeatMap
            mode={preview.step === "seat" ? "pick" : "preview"}
            packageId={
              preview.step === "identity" || preview.step === "night"
                ? undefined
                : preview.packageId
            }
            selectedSeatId={preview.seatId}
            takenSeatIds={takenSeatIds}
            onSelect={(seat) => setMapSeatId(seat.id)}
          />
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-heading text-[10px] tracking-[0.18em] text-white/45">
            <li className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              Sofa & daybed
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Premium
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white" />
              Regular
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-300" />
              Communal
            </li>
          </ul>
        </div>
      </div>

      <div className="pass-panel p-6 sm:p-8">
        <ReserveForm
          enabled={enabled}
          checkoutJsUrl={checkoutJsUrl}
          takenSeatIds={takenSeatIds}
          mapSeatId={mapSeatId}
          onPreviewChange={onPreviewChange}
        />
      </div>
    </div>
  );
}
