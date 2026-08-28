"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
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
        <div className="mx-auto flex max-w-6xl items-start justify-between">
          <Link href="/" aria-label="Carnaval of Screams — home" className="block">
            <Image
              src="/images/cos-logo-gold.webp"
              alt="Carnaval of Screams"
              width={900}
              height={367}
              priority
              className="h-10 w-auto sm:h-12"
            />
          </Link>

          <div className="text-right font-heading">
            <p className="text-[11px] tracking-[0.25em] text-gold-bright sm:text-sm">
              31<sup className="text-[0.6em]">ST</sup> OCTOBER 2026
            </p>
            <p className="mt-1 text-[9px] tracking-[0.2em] text-mist/70 sm:text-[11px]">
              YOGYAKARTA, INDONESIA
            </p>
          </div>
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-40 px-5 pb-5 sm:px-8 sm:pb-7">
        <div className="mx-auto flex w-fit items-center justify-between">
          <a
            href="#tickets"
            className="btn-press h-11 rounded-full bg-black border-white/15 border mr-4 px-5 py-3 font-heading text-[11px] font-semibold tracking-[0.15em] text-white shadow-[0_0_30px_-8px_rgba(255,255,255,0.8)] sm:px-6 sm:text-xs"
          >
            GET YOUR TICKETS
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="btn-press flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border border-white/15 bg-black/40 backdrop-blur-sm"
          >
            <span
              className="h-[1.5px] w-5 bg-gold-bright transition-transform duration-200"
              style={{
                transform: open
                  ? "translateY(3.25px) rotate(45deg)"
                  : "none",
                transitionTimingFunction: "var(--ease-out-strong)",
              }}
            />
            <span
              className="h-[1.5px] w-5 bg-gold-bright transition-transform duration-200"
              style={{
                transform: open
                  ? "translateY(-3.25px) rotate(-45deg)"
                  : "none",
                transitionTimingFunction: "var(--ease-out-strong)",
              }}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="starfield fixed inset-0 z-50 flex flex-col items-center justify-center"
            aria-label="Main"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="btn-press absolute right-5 top-5 rounded-full border border-white/15 bg-black/40 px-4 py-2 font-heading text-[11px] tracking-[0.2em] text-mist backdrop-blur-sm sm:right-8 sm:top-7"
            >
              CLOSE ✕
            </button>

            <ul className="relative z-10 flex flex-col items-center gap-5 sm:gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.23, 1, 0.32, 1],
                    delay: 0.06 + i * 0.045,
                  }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-heading text-2xl tracking-[0.08em] text-mist transition-colors duration-150 hover:text-gold-bright sm:text-3xl"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
