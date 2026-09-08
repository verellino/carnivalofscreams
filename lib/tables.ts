export const NIGHTS = [
  {
    id: "oct-30",
    label: "Friday 30 October",
    short: "30 Oct",
    date: "2026-10-30",
  },
  {
    id: "oct-31",
    label: "Saturday 31 October",
    short: "31 Oct",
    date: "2026-10-31",
  },
] as const;

export type NightId = (typeof NIGHTS)[number]["id"];

export const TABLE_PACKAGES = [
  {
    id: "standard",
    name: "Standard Table",
    seats: 6,
    priceIdr: 3_500_000,
    blurb: "Six seats near the floor. First pour of the night.",
  },
  {
    id: "premiere",
    name: "Premiere Table",
    seats: 8,
    priceIdr: 6_500_000,
    blurb: "Raised sightlines, eight seats, host service.",
  },
  {
    id: "vip",
    name: "VIP Booth",
    seats: 10,
    priceIdr: 12_000_000,
    blurb: "Private booth, ten seats, closest to the stage.",
  },
] as const;

export type TablePackageId = (typeof TABLE_PACKAGES)[number]["id"];
export type TablePackage = (typeof TABLE_PACKAGES)[number];

export function getNight(id: string) {
  return NIGHTS.find((night) => night.id === id);
}

export function getTablePackage(id: string) {
  return TABLE_PACKAGES.find((pack) => pack.id === id);
}

export function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
