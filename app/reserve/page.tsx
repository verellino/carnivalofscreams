import type { Metadata } from "next";

import ReserveWorkspace from "@/components/ReserveWorkspace";
import { getCheckoutJsUrl, isDokuConfigured } from "@/lib/doku";

export const metadata: Metadata = {
  title: "Reserve a table",
  description:
    "Hold a sofa at Carnaval of Screams. Pick the sofa, pay through DOKU within 60 minutes, then receive the invoice by email and WhatsApp.",
};

export default function ReservePage() {
  return (
    <ReserveWorkspace
      enabled={isDokuConfigured()}
      checkoutJsUrl={getCheckoutJsUrl()}
    />
  );
}
