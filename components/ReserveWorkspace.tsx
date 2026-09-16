"use client";

import { useState } from "react";

import ReserveForm from "@/components/ReserveForm";
import SeatMap from "@/components/SeatMap";
import type { TablePackageId } from "@/lib/tables";

type Props = {
  enabled: boolean;
  checkoutJsUrl: string;
};

export default function ReserveWorkspace({ enabled, checkoutJsUrl }: Props) {
  const [packageId, setPackageId] = useState<TablePackageId>("premiere");

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
          Hold a sofa for the night
        </p>
        <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
          Enter your details, pick a night and a sofa category, then pay through
          DOKU. After payment you choose the sofa. We send the invoice by email
          and WhatsApp.
        </p>
        <div className="mt-12">
          <SeatMap mode="preview" packageId={packageId} />
        </div>
      </div>

      <div className="pass-panel p-6 sm:p-8">
        <ReserveForm
          enabled={enabled}
          checkoutJsUrl={checkoutJsUrl}
          onPackageIdChange={setPackageId}
        />
      </div>
    </div>
  );
}
