import type { TablePackageId } from "./tables";

export type VenueSeat = {
  id: string;
  packageId: TablePackageId;
  label: string;
  short: string;
  x: number;
  y: number;
  rotate: number;
  w: number;
  h: number;
};

type SeatPoint = {
  n: number;
  x: number;
  y: number;
  rotate?: number;
  w?: number;
  h?: number;
};

/** COS26 isometric floor plan, matching public/images/venue-layout.webp */
export const MAP_VIEWBOX = { width: 2400, height: 1742 };

const SIZE: Record<TablePackageId, { w: number; h: number }> = {
  luxer: { w: 34, h: 54 },
  etius: { w: 92, h: 70 },
  tivex: { w: 72, h: 44 },
  perio: { w: 64, h: 50 },
  onomy: { w: 44, h: 44 },
};

function pct(x: number, y: number) {
  return {
    x: Math.round((x / 100) * MAP_VIEWBOX.width),
    y: Math.round((y / 100) * MAP_VIEWBOX.height),
  };
}

function seats(
  packageId: TablePackageId,
  idPrefix: string,
  prefix: string,
  name: string,
  points: SeatPoint[],
): VenueSeat[] {
  const size = SIZE[packageId];
  return points.map((point) => {
    const { x, y } = pct(point.x, point.y);
    return {
      id: `${idPrefix}-${point.n}`,
      packageId,
      label: `${name} ${point.n}`,
      short: `${prefix}${point.n}`,
      x,
      y,
      rotate: point.rotate ?? 0,
      w: point.w ?? size.w,
      h: point.h ?? size.h,
    };
  });
}

export const SEATS: VenueSeat[] = [
  ...seats("etius", "etius", "E", "Etius", [
    { n: 1, x: 46.6, y: 31.8, rotate: 8 },
    { n: 2, x: 57.2, y: 33.6, rotate: 8 },
    { n: 3, x: 67.2, y: 35.6, rotate: 8 },
    { n: 4, x: 76.4, y: 37.6, rotate: 8 },
  ]),
  ...seats("luxer", "luxer", "L", "Luxer", [
    { n: 1, x: 35.4, y: 38.8 },
    { n: 2, x: 35.4, y: 42.4 },
    { n: 3, x: 35.6, y: 46.0 },
    { n: 4, x: 38.4, y: 50.6, rotate: -38 },
    { n: 5, x: 40.8, y: 53.4, rotate: -38 },
    { n: 6, x: 51.2, y: 52.2, rotate: 90 },
    { n: 7, x: 55.0, y: 52.6, rotate: 90 },
    { n: 8, x: 58.6, y: 53.0, rotate: 90 },
    { n: 9, x: 65.4, y: 51.4, rotate: 32 },
    { n: 10, x: 68.4, y: 49.6, rotate: 32 },
    { n: 11, x: 71.4, y: 47.8, rotate: 32 },
    { n: 12, x: 74.4, y: 46.0, rotate: 32 },
    { n: 13, x: 62.2, y: 62.6, rotate: 90 },
    { n: 14, x: 58.8, y: 62.6, rotate: 90 },
    { n: 15, x: 55.0, y: 62.6, rotate: 90 },
    { n: 16, x: 51.0, y: 62.6, rotate: 90 },
    { n: 17, x: 47.0, y: 62.6, rotate: 90 },
    { n: 18, x: 43.0, y: 62.6, rotate: 90 },
    { n: 19, x: 44.2, y: 59.2, rotate: -28 },
    { n: 20, x: 41.0, y: 57.6, rotate: -28 },
    { n: 21, x: 36.0, y: 55.8, rotate: -38 },
    { n: 22, x: 33.0, y: 53.6, rotate: -38 },
    { n: 23, x: 30.4, y: 49.4 },
    { n: 24, x: 30.3, y: 45.8 },
    { n: 25, x: 30.2, y: 42.2 },
    { n: 26, x: 30.2, y: 38.6 },
  ]),
  ...seats("tivex", "tivex", "T", "Tivex", [
    { n: 1, x: 32.8, y: 54.8, rotate: -30 },
    { n: 2, x: 37.0, y: 56.2, rotate: -30 },
    { n: 3, x: 40.8, y: 59.2, rotate: -30 },
    { n: 4, x: 29.4, y: 58.4, rotate: -30 },
    { n: 5, x: 33.6, y: 60.0, rotate: -30 },
    { n: 6, x: 37.4, y: 61.8, rotate: -30 },
    { n: 7, x: 40.8, y: 64.4, rotate: -30 },
    { n: 8, x: 45.8, y: 65.8, rotate: -30 },
    { n: 9, x: 25.6, y: 62.2, rotate: -30 },
    { n: 10, x: 28.4, y: 64.4, rotate: -30 },
    { n: 11, x: 31.8, y: 67.0, rotate: -30 },
    { n: 12, x: 35.0, y: 69.4, rotate: -30 },
    { n: 13, x: 37.8, y: 71.8, rotate: -30 },
    { n: 14, x: 45.4, y: 67.6 },
    { n: 15, x: 50.0, y: 67.6 },
    { n: 16, x: 54.6, y: 67.6 },
    { n: 17, x: 59.2, y: 67.6 },
  ]),
  ...seats("perio", "perio", "P", "Perio", [
    { n: 1, x: 57.6, y: 73.2, w: 52, h: 58 },
    { n: 2, x: 66.6, y: 68.0, rotate: 8, w: 72, h: 48 },
    { n: 3, x: 74.8, y: 66.2, rotate: 18, w: 72, h: 52 },
  ]),
  ...seats("onomy", "onomy", "O", "Onomy", [
    { n: 1, x: 44.8, y: 73.2 },
    { n: 2, x: 49.2, y: 73.2 },
    { n: 3, x: 53.6, y: 73.2 },
    { n: 4, x: 66.8, y: 73.0 },
    { n: 5, x: 71.0, y: 72.8 },
    { n: 6, x: 74.8, y: 69.6 },
    { n: 7, x: 78.4, y: 67.2 },
    { n: 8, x: 69.8, y: 63.0 },
    { n: 9, x: 73.2, y: 60.2 },
    { n: 10, x: 74.6, y: 63.0 },
  ]),
];

export function getSeat(id: string) {
  return SEATS.find((seat) => seat.id === id);
}

export function seatsForPackage(packageId: TablePackageId) {
  return SEATS.filter((seat) => seat.packageId === packageId);
}

export function mapViewForPackage(packageId?: TablePackageId) {
  const seats = packageId ? seatsForPackage(packageId) : SEATS;
  if (!packageId || seats.length === 0) {
    return { x: 0, y: 0, width: MAP_VIEWBOX.width, height: MAP_VIEWBOX.height };
  }

  const pad = 220;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const seat of seats) {
    const radius = Math.max(seat.w, seat.h) / 2 + pad;
    minX = Math.min(minX, seat.x - radius);
    minY = Math.min(minY, seat.y - radius);
    maxX = Math.max(maxX, seat.x + radius);
    maxY = Math.max(maxY, seat.y + radius);
  }

  const aspect = MAP_VIEWBOX.width / MAP_VIEWBOX.height;
  let width = Math.max(maxX - minX, 1);
  let height = Math.max(maxY - minY, 1);
  if (width / height > aspect) {
    height = width / aspect;
  } else {
    width = height * aspect;
  }

  let x = (minX + maxX) / 2 - width / 2;
  let y = (minY + maxY) / 2 - height / 2;
  x = Math.min(Math.max(0, x), MAP_VIEWBOX.width - width);
  y = Math.min(Math.max(0, y), MAP_VIEWBOX.height - height);

  return { x, y, width, height };
}
