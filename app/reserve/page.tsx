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
    <div className="starfield relative isolate overflow-hidden">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-32 sm:pt-36 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start lg:gap-16">
        <div>
          <p className="font-heading text-xs tracking-[0.35em] text-gold-bright">
            Table reservation
          </p>
          <h1 className="mt-4 max-w-xl font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl">
            Hold your spot in the dark.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-mist/80">
            Pick a night and a table. Pay the hold through Midtrans. We confirm
            your party by email once the payment lands.
          </p>
          <div className="mt-10">
            <FloorPlanPlaceholder />
          </div>
        </div>

        <div className="border border-white/12 bg-ink/70 p-6 backdrop-blur-sm sm:p-8">
          <ReserveForm
            clientKey={getMidtransClientKey()}
            snapJsUrl={getSnapJsUrl()}
          />
        </div>
      </div>
    </div>
  );
}
