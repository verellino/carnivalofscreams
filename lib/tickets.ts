export type Pass = {
  id: string;
  kicker: string;
  name: string;
  price: string;
  when: string;
  description: string;
  soldOut: boolean;
};

export const PASSES: Pass[] = [
  {
    id: "early-bird-1-day",
    kicker: "1 Day Pass",
    name: "Early Bird",
    price: "Rp99.000",
    when: "Friday, 30 Oct or Saturday, 31 Oct 2026",
    description:
      "Be there before the story unfolds. Choose your night — one ticket, one person, one day.",
    soldOut: true,
  },
  {
    id: "early-bird-2-day",
    kicker: "2 Day Pass",
    name: "Early Bird",
    price: "Rp160.000",
    when: "Friday 30 Oct – Saturday 31 Oct 2026",
    description:
      "Two nights, one pass. The full experience at Tip Tap Toe Yogyakarta.",
    soldOut: true,
  },
  {
    id: "blind-1-day",
    kicker: "1 Day Pass",
    name: "Blind Ticket",
    price: "Rp75.000",
    when: "Friday, 30 Oct or Saturday, 31 Oct 2026",
    description:
      "The first wave. Be there before the story unfolds — pick Friday or Saturday.",
    soldOut: true,
  },
  {
    id: "blind-2-day",
    kicker: "2 Day Pass",
    name: "Blind Ticket",
    price: "Rp120.000",
    when: "Friday 30 Oct – Saturday 31 Oct 2026",
    description:
      "The first wave, both nights. Two evenings, one pass — the full experience.",
    soldOut: true,
  },
];
