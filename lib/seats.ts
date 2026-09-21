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
  luxer: { w: 36, h: 52 },
  etius: { w: 90, h: 68 },
  tivex: { w: 76, h: 36 },
  perio: { w: 64, h: 50 },
  onomy: { w: 40, h: 40 },
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
    { n: 1, x: 46.2, y: 31.2, rotate: 8 },
    { n: 2, x: 56.6, y: 33.0, rotate: 8 },
    { n: 3, x: 66.8, y: 34.8, rotate: 8 },
    { n: 4, x: 76.2, y: 37.0, rotate: 8 },
  ]),
  ...seats("luxer", "luxer", "L", "Luxer", [
    { n: 1, x: 32.6, y: 34.8 },
    { n: 2, x: 32.6, y: 38.4 },
    { n: 3, x: 32.8, y: 42.2 },
    { n: 4, x: 35.8, y: 48.0, rotate: -18, w: 56, h: 34 },
    { n: 5, x: 38.8, y: 51.0, rotate: -18, w: 56, h: 34 },
    { n: 6, x: 49.6, y: 53.2, rotate: 90, w: 56, h: 34 },
    { n: 7, x: 53.8, y: 53.4, rotate: 90, w: 56, h: 34 },
    { n: 8, x: 58.0, y: 53.6, rotate: 90, w: 56, h: 34 },
    { n: 9, x: 63.2, y: 51.4, rotate: 28, w: 56, h: 34 },
    { n: 10, x: 67.2, y: 49.4, rotate: 28, w: 56, h: 34 },
    { n: 11, x: 71.2, y: 47.4, rotate: 28, w: 56, h: 34 },
    { n: 12, x: 75.2, y: 45.4, rotate: 28, w: 56, h: 34 },
    { n: 13, x: 59.0, y: 62.4, rotate: 90, w: 56, h: 34 },
    { n: 14, x: 55.4, y: 62.4, rotate: 90, w: 56, h: 34 },
    { n: 15, x: 51.8, y: 62.4, rotate: 90, w: 56, h: 34 },
    { n: 16, x: 48.2, y: 62.4, rotate: 90, w: 56, h: 34 },
    { n: 17, x: 44.6, y: 62.4, rotate: 90, w: 56, h: 34 },
    { n: 18, x: 41.0, y: 62.4, rotate: 90, w: 56, h: 34 },
    { n: 19, x: 35.4, y: 59.2, rotate: -22, w: 56, h: 34 },
    { n: 20, x: 32.8, y: 56.6, rotate: -22, w: 56, h: 34 },
    { n: 21, x: 30.2, y: 53.0, rotate: -28, w: 56, h: 34 },
    { n: 22, x: 28.0, y: 50.0, rotate: -28, w: 56, h: 34 },
    { n: 23, x: 26.8, y: 45.0 },
    { n: 24, x: 26.8, y: 41.4 },
    { n: 25, x: 26.8, y: 38.0 },
    { n: 26, x: 26.8, y: 34.6 },
  ]),
  ...seats("tivex", "tivex", "T", "Tivex", [
    { n: 1, x: 23.2, y: 57.8, rotate: -28 },
    { n: 2, x: 28.8, y: 60.2, rotate: -28 },
    { n: 3, x: 33.4, y: 63.2, rotate: -28 },
    { n: 4, x: 20.4, y: 61.2, rotate: -28 },
    { n: 5, x: 24.4, y: 63.8, rotate: -28 },
    { n: 6, x: 28.4, y: 66.2, rotate: -28 },
    { n: 7, x: 33.0, y: 69.6, rotate: -28 },
    { n: 8, x: 36.2, y: 70.0, rotate: -8 },
    { n: 9, x: 16.6, y: 64.4, rotate: -28 },
    { n: 10, x: 19.0, y: 66.8, rotate: -28 },
    { n: 11, x: 21.6, y: 69.4, rotate: -28 },
    { n: 12, x: 24.8, y: 72.0, rotate: -28 },
    { n: 13, x: 29.0, y: 74.6, rotate: -28 },
    { n: 14, x: 46.2, y: 67.8, w: 88, h: 38 },
    { n: 15, x: 51.4, y: 67.8, w: 88, h: 38 },
    { n: 16, x: 56.6, y: 67.8, w: 88, h: 38 },
    { n: 17, x: 61.8, y: 67.8, w: 88, h: 38 },
  ]),
  ...seats("perio", "perio", "P", "Perio", [
    { n: 1, x: 56.4, y: 72.4, w: 50, h: 58 },
    { n: 2, x: 65.8, y: 68.4, rotate: 10, w: 74, h: 46 },
    { n: 3, x: 72.4, y: 65.4, rotate: 22, w: 74, h: 48 },
  ]),
  ...seats("onomy", "onomy", "O", "Onomy", [
    { n: 1, x: 42.0, y: 73.4 },
    { n: 2, x: 46.0, y: 73.4 },
    { n: 3, x: 50.0, y: 73.4 },
    { n: 4, x: 64.6, y: 73.4 },
    { n: 5, x: 69.0, y: 73.4 },
    { n: 6, x: 73.6, y: 68.8 },
    { n: 7, x: 77.6, y: 66.4 },
    { n: 8, x: 68.4, y: 63.8 },
    { n: 9, x: 71.6, y: 60.4 },
    { n: 10, x: 75.2, y: 63.4 },
  ]),
];

export function getSeat(id: string) {
  return SEATS.find((seat) => seat.id === id);
}

export function seatsForPackage(packageId: TablePackageId) {
  return SEATS.filter((seat) => seat.packageId === packageId);
}

export function nearestSeat(
  x: number,
  y: number,
  options?: {
    packageId?: TablePackageId;
    takenIds?: Iterable<string>;
    maxDist?: number;
  },
) {
  const taken = new Set(options?.takenIds);
  let best: VenueSeat | undefined;
  let bestDist = options?.maxDist ?? 96;

  for (const seat of SEATS) {
    if (options?.packageId && seat.packageId !== options.packageId) continue;
    if (taken.has(seat.id)) continue;
    const radius = Math.max(seat.w, seat.h) * 0.85;
    const dist = Math.hypot(seat.x - x, seat.y - y);
    const limit = Math.max(bestDist, radius);
    if (dist <= limit && dist < bestDist) {
      best = seat;
      bestDist = dist;
    }
  }

  return best;
}

function viewAround(points: VenueSeat[], pad: number) {
  if (points.length === 0) {
    return { x: 0, y: 0, width: MAP_VIEWBOX.width, height: MAP_VIEWBOX.height };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const seat of points) {
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

export function mapViewForPackage(packageId?: TablePackageId) {
  if (!packageId) {
    return { x: 0, y: 0, width: MAP_VIEWBOX.width, height: MAP_VIEWBOX.height };
  }
  return viewAround(seatsForPackage(packageId), 220);
}

/** Crop empty Resid / stage space so bookable tables read larger. */
export function mapViewForBookable() {
  return viewAround(SEATS, 160);
}
