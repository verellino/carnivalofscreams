export const NIGHTS = [
  {
    id: "oct-30",
    day: "Day 1",
    label: "Friday 30 October",
    short: "30 Oct",
    date: "2026-10-30",
  },
  {
    id: "oct-31",
    day: "Day 2",
    label: "Saturday 31 October",
    short: "31 Oct",
    date: "2026-10-31",
  },
] as const;

export type NightId = (typeof NIGHTS)[number]["id"];

export const TABLE_PACKAGES = [
  {
    id: "regular",
    name: "Regular Table",
    seats: 4,
    tickets: 2,
    priceIdr: 200_000,
    minSpendIdr: 2_500_000,
    blurb: "Four seats. Booking fee includes two event tickets.",
    reservation: "1 Regular Table Reservation",
  },
  {
    id: "premium",
    name: "Premium Table",
    seats: 4,
    tickets: 2,
    priceIdr: 250_000,
    minSpendIdr: 3_000_000,
    blurb: "Four seats closer to the floor. Booking fee includes two event tickets.",
    reservation: "1 Premium Table Reservation",
  },
  {
    id: "communal",
    name: "Communal Table",
    seats: 6,
    tickets: 3,
    priceIdr: 300_000,
    minSpendIdr: 3_500_000,
    blurb: "Six seats. Booking fee includes three event tickets.",
    reservation: "1 Communal Table Reservation",
  },
  {
    id: "sofa",
    name: "Premium Sofa & Daybed",
    seats: 6,
    tickets: 3,
    priceIdr: 350_000,
    minSpendIdr: 6_000_000,
    blurb: "Six seats on a sofa or daybed. Booking fee includes three event tickets.",
    reservation: "1 Sofa or Daybed Reservation",
  },
] as const;

export type TablePackageId = (typeof TABLE_PACKAGES)[number]["id"];
export type TablePackage = (typeof TABLE_PACKAGES)[number];

export function asPackageId(value: unknown): TablePackageId | undefined {
  if (
    value === "regular" ||
    value === "premium" ||
    value === "communal" ||
    value === "sofa"
  ) {
    return value;
  }
  if (value === "standard") return "regular";
  if (value === "premiere") return "premium";
  if (value === "vip") return "sofa";
  return undefined;
}

export function getNight(id: string) {
  return NIGHTS.find((night) => night.id === id);
}

export function getTablePackage(id: string) {
  const resolved = asPackageId(id) ?? id;
  return TABLE_PACKAGES.find((pack) => pack.id === resolved);
}

export function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
