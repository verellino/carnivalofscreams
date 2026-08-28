"use client";

import Image from "next/image";
import { motion } from "motion/react";

import Starfield from "./Starfield";

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
    <section className="relative bg-ink flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <Starfield className="absolute inset-0 z-0 h-full w-full" />

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
        className="relative z-10 mt-4 w-full max-w-4xl sm:mt-6"
      >
        <Image
          src="/images/LOGO-COS-2026.webp"
          alt="Carnaval of Screams"
          width={1800}
          height={390}
          priority
          className="h-auto w-full [mask-image:radial-gradient(ellipse_78%_70%_at_50%_50%,black_55%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_78%_70%_at_50%_50%,black_55%,transparent_100%)]"
        />
      </motion.div>

      <motion.p
        variants={item}
        initial="hidden"
        animate="show"
        custom={0.4}
        className="relative z-10 mt-2 font-heading text-xs tracking-[0.5em] text-gold-bright sm:mt-4 sm:text-lg"
      >
        YOGYAKARTA, INDONESIA
      </motion.p>

      <motion.p
        variants={item}
        initial="hidden"
        animate="show"
        custom={0.55}
        className="relative z-10 mt-6 font-heading text-[11px] tracking-[0.4em] text-white/80 sm:mt-8 sm:text-sm sm:tracking-[0.5em]"
      >
        31<sup className="text-[0.6em]">ST</sup> OCTOBER — 1<sup className="text-[0.6em]">ST</sup> NOVEMBER 2026
      </motion.p>
    </section>
  );
}
