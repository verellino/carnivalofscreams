import Image from "next/image";

const GUESTS = [
  {
    id: "basboi",
    name: "Basboi",
    day: "Day 1",
    date: "30th October 2026",
    image: "/images/guest-basboi.webp",
    alt: "Basboi arriving on Day 1 of Carnaval of Screams: The Arrival",
  },
  {
    id: "pemandu-karaoke-sedih",
    name: "Pemandu Karaoke Sedih",
    day: "Day 2",
    date: "31st October 2026",
    image: "/images/guest-pemandu-karaoke-sedih.webp",
    alt: "Pemandu Karaoke Sedih arriving on Day 2 of Carnaval of Screams: The Arrival",
  },
] as const;

export default function GuestStars() {
  return (
    <section
      id="guest-stars"
      className="relative isolate scroll-mt-28 overflow-hidden bg-ink px-6 pb-24 pt-24 sm:pb-28 sm:pt-32"
    >
      <div className="relative mx-auto w-full max-w-6xl text-center">
        <p className="font-heading text-[11px] tracking-[0.42em] text-white/55 sm:text-xs">
          Guest Stars
        </p>
        <h2 className="pass-title mt-5 font-heading text-5xl tracking-[0.14em] text-white sm:text-7xl">
          Arriving
        </h2>
        <p className="mt-6 font-heading text-sm tracking-[0.28em] text-white sm:text-xl">
          Two nights full of surprises.
        </p>

        <ul className="mt-16 grid list-none gap-8 p-0 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {GUESTS.map((guest) => (
            <li key={guest.id} className="group text-left">
              <figure className="overflow-hidden border border-white/12 bg-ink-soft transition-[border-color,transform] duration-300 group-hover:-translate-y-1 group-hover:border-white/35">
                <Image
                  src={guest.image}
                  alt={guest.alt}
                  width={576}
                  height={1024}
                  sizes="(min-width: 640px) 40vw, 90vw"
                  className="h-auto w-full"
                />
              </figure>
              <div className="mt-5 px-1">
                <p className="font-heading text-[11px] tracking-[0.32em] text-white/50">
                  {guest.day}
                  <span className="mx-3 text-white/25" aria-hidden="true">
                    ·
                  </span>
                  {guest.date}
                </p>
                <h3 className="mt-3 font-heading text-2xl tracking-[0.08em] text-white sm:text-[1.7rem]">
                  {guest.name}
                </h3>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
