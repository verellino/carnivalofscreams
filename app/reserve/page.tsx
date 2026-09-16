import type { Metadata } from "next";

import ReserveWorkspace from "@/components/ReserveWorkspace";
import { getCheckoutJsUrl, isDokuConfigured } from "@/lib/doku";

export const metadata: Metadata = {
  title: "Reserve a table",
  description:
    "Hold a sofa at Carnaval of Screams. Pay the category through DOKU, pick your sofa, then receive the invoice by email and WhatsApp.",
};

export default function ReservePage() {
  return (
    <ReserveWorkspace
      enabled={isDokuConfigured()}
      checkoutJsUrl={getCheckoutJsUrl()}
    />
  );
}
