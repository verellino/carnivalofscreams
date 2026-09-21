import type { Metadata } from "next";

import ReserveWorkspace from "@/components/ReserveWorkspace";
import { getCheckoutJsUrl, isDokuConfigured } from "@/lib/doku";

export const metadata: Metadata = {
  title: "Reserve a table",
  description:
    "Hold a table at Carnaval of Screams. Tap a table on the floor plan, pay the booking fee through DOKU within 60 minutes, then receive the invoice by email and WhatsApp.",
};

export const dynamic = "force-dynamic";

export default function ReservePage() {
  return (
    <ReserveWorkspace
      enabled={isDokuConfigured()}
      checkoutJsUrl={getCheckoutJsUrl()}
    />
  );
}
