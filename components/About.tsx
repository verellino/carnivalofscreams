import Link from "next/link";

import ArrivalGroundAlt from "@/components/ArrivalGroundAlt";

const FACTS = [
  { kicker: "First edition", name: "2023", detail: "Halloween in Yogyakarta." },
  { kicker: "Per event", name: "2,000+", detail: "Attendees in a single night." },
  { kicker: "Seasons", name: "Two", detail: "Editions in 2023 and 2024." },
] as const;

export default function About() {
  return (
    <section className="relative isolate flex min-h-svh flex-1 flex-col overflow-hidden bg-ink px-6 pb-28 pt-24 sm:pb-36 sm:pt-32">
      <ArrivalGroundAlt />

      <div className="relative mx-auto w-full max-w-6xl text-center">
        <p className="font-heading text-[11px] tracking-[0.42em] text-white/55 sm:text-xs">
          Carnaval of Screams
        </p>
        <h1 className="pass-title mt-5 font-heading text-5xl tracking-[0.14em] text-white sm:text-7xl">
          About Us
        </h1>
        <p className="mt-6 font-heading text-sm tracking-[0.28em] text-white sm:text-xl">
          Yogyakarta, since 2023
        </p>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          Carnaval of Screams (COS) is Yogyakarta&apos;s premier Halloween event
          promoter, delivering electrifying, immersive horror experiences. Since
          2023, COS has set the standard for Halloween celebrations, attracting
          over 2,000 attendees per event.
        </p>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          With two successful editions in 2023 and 2024, COS continues to push
          boundaries with high-energy performances, eerie atmospheres, and
          cutting-edge production. Each year, we introduce new themes,
          attractions, and interactive elements to elevate the experience.
        </p>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3 sm:gap-5">
          {FACTS.map((fact) => (
            <article key={fact.name} className="pass-panel flex flex-col px-6 py-7 sm:px-7">
              <span className="font-heading text-[11px] tracking-[0.32em] text-white/50">
                {fact.kicker}
              </span>
              <h3 className="mt-5 font-heading text-2xl tracking-[0.08em] text-white sm:text-[1.7rem]">
                {fact.name}
              </h3>
              <span aria-hidden="true" className="pass-rule" />
              <p className="text-sm leading-relaxed text-white/65">{fact.detail}</p>
            </article>
          ))}
        </div>

        <Link
          href="/gallery"
          className="btn-press mt-16 inline-flex items-center justify-center border border-white/80 bg-white px-5 py-3 font-heading text-[11px] tracking-[0.28em] text-black transition-colors duration-200 hover:bg-transparent hover:text-white"
        >
          Past events
        </Link>
      </div>
    </section>
  );
}
