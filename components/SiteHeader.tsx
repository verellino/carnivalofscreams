"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/dev" },
  { label: "Event", href: "#" },
  { label: "Hall of Cos", href: "#" },
  { label: "Reservation", href: "#" },
  { label: "Ticket", href: "#" },
  { label: "Partnership", href: "#" },
  { label: "Gallery", href: "#" },
  { label: "About Us", href: "#" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dev" aria-label="Carnaval of Screams — home" className="block">
            <Image
              src="/images/LOGO-COS-2026-trimmed.webp"
              alt="Carnaval of Screams"
              width={900}
              height={367}
              priority
              className="h-12 w-auto sm:h-20"
            />
          </Link>

          <div className="text-right font-heading">
            <p className="text-[11px] tracking-[0.25em] text-white sm:text-sm">
              30<sup className="text-[0.6em]">TH</sup> — 31<sup className="text-[0.6em]">ST</sup> OCT 2026
            </p>
            <p className="mt-1 text-[9px] tracking-[0.2em] text-mist/70 sm:text-[11px]">
              YOGYAKARTA, INDONESIA
            </p>
          </div>
        </div>
      </header>
    </>
  );
}
