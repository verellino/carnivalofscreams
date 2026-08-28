import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
