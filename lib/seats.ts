import type { TablePackageId } from "./tables";

export type SofaSeat = {
  id: string;
  packageId: TablePackageId;
  label: string;
  short: string;
  x: number;
  y: number;
};

export const SOFAS: SofaSeat[] = [
  { id: "vip-1", packageId: "vip", label: "VIP 1", short: "V1", x: 160, y: 220 },
  { id: "vip-2", packageId: "vip", label: "VIP 2", short: "V2", x: 320, y: 220 },
  { id: "vip-3", packageId: "vip", label: "VIP 3", short: "V3", x: 480, y: 220 },
  {
    id: "premiere-1",
    packageId: "premiere",
    label: "Premiere 1",
    short: "P1",
    x: 160,
    y: 370,
  },
  {
    id: "premiere-2",
    packageId: "premiere",
    label: "Premiere 2",
    short: "P2",
    x: 320,
    y: 370,
  },
  {
    id: "premiere-3",
    packageId: "premiere",
    label: "Premiere 3",
    short: "P3",
    x: 480,
    y: 370,
  },
  {
    id: "standard-1",
    packageId: "standard",
    label: "Standard 1",
    short: "S1",
    x: 160,
    y: 520,
  },
  {
    id: "standard-2",
    packageId: "standard",
    label: "Standard 2",
    short: "S2",
    x: 320,
    y: 520,
  },
  {
    id: "standard-3",
    packageId: "standard",
    label: "Standard 3",
    short: "S3",
    x: 480,
    y: 520,
  },
];

export function getSeat(id: string) {
  return SOFAS.find((seat) => seat.id === id);
}

export function seatsForPackage(packageId: TablePackageId) {
  return SOFAS.filter((seat) => seat.packageId === packageId);
}
