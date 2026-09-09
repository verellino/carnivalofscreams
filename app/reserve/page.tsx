import type { Metadata } from "next";

import FloorPlanPlaceholder from "@/components/FloorPlanPlaceholder";
import ReserveForm from "@/components/ReserveForm";
import {
  getMidtransClientKey,
  getSnapJsUrl,
} from "@/lib/midtrans";

export const metadata: Metadata = {
  title: "Reserve a table",
  description:
    "Hold a table at Carnaval of Screams, then pay through Midtrans. We confirm your reservation after payment.",
};

export default function ReservePage() {
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
          Pick Friday or Saturday and a table. Pay the hold through Midtrans. We
          confirm your party by email once the payment lands.
        </p>
        <div className="mt-12">
          <FloorPlanPlaceholder />
        </div>
      </div>

      <div className="pass-panel p-6 sm:p-8">
        <ReserveForm
          clientKey={getMidtransClientKey()}
          snapJsUrl={getSnapJsUrl()}
        />
      </div>
    </div>
  );
}
