"use client";

import Image from "next/image";
import { motion } from "motion/react";

import VideoBackground from "./VideoBackground";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const item = {
  hidden: { opacity: 0, y: 18 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  }),
};

export default function Splash() {
  return (
    <section className="relative flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center">
      <VideoBackground className="absolute inset-0 z-0" />

      <motion.p
        variants={item}
        initial="hidden"
        animate="show"
        custom={0.1}
        className="relative z-10 font-heading text-[11px] tracking-[0.45em] text-white/80 sm:text-base sm:tracking-[0.6em]"
      >
        THE GREATEST HALLOWEEN FESTIVAL
      </motion.p>

      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        custom={0.25}
        className="relative z-10 mt-4 w-full sm:mt-6"
        style={{ maxWidth: "min(86vw, 620px, calc(32svh * 1.81))" }}
      >
        <Image
          src="/images/LOGO-COS-2026-trimmed.webp"
          alt="Carnaval of Screams"
          width={2281}
          height={1258}
          priority
          className="h-auto w-full [mask-image:radial-gradient(ellipse_78%_70%_at_50%_50%,black_55%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_78%_70%_at_50%_50%,black_55%,transparent_100%)]"
        />
      </motion.div>

      <motion.p
        variants={item}
        initial="hidden"
        animate="show"
        custom={0.4}
        className="relative z-10 mt-2 font-heading text-xs tracking-[0.4em] text-white sm:mt-4 sm:text-lg sm:tracking-[0.5em]"
      >
        31<sup className="text-[0.6em]">ST</sup> OCTOBER — 1<sup className="text-[0.6em]">ST</sup> NOVEMBER 2026
      </motion.p>

      <motion.p
        variants={item}
        initial="hidden"
        animate="show"
        custom={0.55}
        className="relative z-10 mt-3 font-heading text-[10px] tracking-[0.35em] text-white/70 sm:mt-4 sm:text-xs sm:tracking-[0.45em]"
      >
        YOGYAKARTA, INDONESIA
      </motion.p>
    </section>
  );
}
