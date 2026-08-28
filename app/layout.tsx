import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carnaval of Screams — Chariot 2026",
  description:
    "The greatest Halloween festival. Carnaval of Screams: Chariot — Yogyakarta, Indonesia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
