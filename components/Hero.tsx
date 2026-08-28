"use client";

import Image from "next/image";
import { motion } from "motion/react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const item = {
  hidden: { opacity: 0, y: 18 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  }),
};

export default function Hero() {
  return (
    <section className="starfield relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-40 pt-32 text-center sm:pb-44">
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
          src="/images/cos-logo-gold.webp"
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

      <motion.a
        href="#tickets"
        variants={item}
        initial="hidden"
        animate="show"
        custom={0.55}
        className="btn-press relative z-10 mt-10 rounded-full bg-black border-white/15 border px-10 py-5 font-heading text-sm font-semibold tracking-[0.2em] text-white shadow-[0_0_50px_-10px_rgba(255,255,255,0.9)] sm:mt-12 sm:px-14 sm:py-6 sm:text-base"
      >
        BLIND TICKET — CARNAVAL OF SCREAMS 2026
      </motion.a>
    </section>
  );
}
