import type { Metadata } from "next";
import "./globals.css";

// og:image has to be an absolute URL. Without this Next falls back to the
// per-deployment vercel.app host, so social caches pin to a stale deploy.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Carnaval of Screams",
  description:
    "Indonesia's greatest Halloween festival. Two nights of masks, music and mayhem in Yogyakarta, 31 October to 1 November 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
