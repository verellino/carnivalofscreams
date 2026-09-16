import type { NightId } from "./tables";

export const LINEUP = [
  {
    id: "basboi",
    nightId: "oct-30" as const,
    day: "Day 1",
    name: "Basboi",
    date: "30th October 2026",
    image: "/images/guest-basboi.webp",
    alt: "Basboi arriving on Day 1 of Carnaval of Screams: The Arrival",
  },
  {
    id: "pemandu-karaoke-sedih",
    nightId: "oct-31" as const,
    day: "Day 2",
    name: "Pemandu Karaoke Sedih",
    date: "31st October 2026",
    image: "/images/guest-pemandu-karaoke-sedih.webp",
    alt: "Pemandu Karaoke Sedih arriving on Day 2 of Carnaval of Screams: The Arrival",
  },
] as const;

export function getLineup(nightId: NightId) {
  return LINEUP.find((guest) => guest.nightId === nightId);
}
