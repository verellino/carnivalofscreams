import type { TablePackageId } from "./tables";

export type SofaSeat = {
  id: string;
  packageId: TablePackageId;
  label: string;
  short: string;
  x: number;
  y: number;
};

function seats(
  packageId: TablePackageId,
  idPrefix: string,
  prefix: string,
  name: string,
  points: Array<[number, number]>,
): SofaSeat[] {
  return points.map(([x, y], index) => {
    const n = index + 1;
    return {
      id: `${idPrefix}-${n}`,
      packageId,
      label: `${name} ${n}`,
      short: `${prefix}${n}`,
      x,
      y,
    };
  });
}

export const MAP_VIEWBOX = { width: 2200, height: 1746 };

export const SOFAS: SofaSeat[] = [
  ...seats("sofa", "daybed", "D", "Daybed", [
    [1006, 438],
    [1250, 483],
    [1467, 533],
    [1723, 594],
  ]),
  ...seats("sofa", "sofa", "S", "Sofa", [
    [557, 626],
    [557, 712],
    [558, 793],
    [558, 877],
    [686, 606],
    [686, 702],
    [685, 802],
    [608, 976],
    [655, 1045],
    [713, 1121],
    [743, 930],
    [805, 1000],
    [758, 1106],
    [1113, 972],
    [1194, 995],
    [1272, 1015],
    [1350, 1032],
    [877, 1198],
    [956, 1198],
    [1037, 1198],
    [1116, 1197],
    [1201, 1198],
    [1283, 1197],
    [1647, 783],
    [1586, 840],
    [1526, 900],
    [1466, 951],
  ]),
  ...seats("premium", "premium", "P", "Premium", [
    [896, 1305],
    [995, 1305],
    [1096, 1305],
    [1193, 1305],
  ]),
  ...seats("regular", "regular", "R", "Regular", [
    [883, 1395],
    [957, 1395],
    [1032, 1393],
    [1566, 1091],
    [1629, 1149],
    [1520, 1200],
    [1685, 1296],
    [1633, 1344],
    [1433, 1434],
    [1517, 1428],
  ]),
  ...seats("communal", "communal", "C", "Communal", [
    [1142, 1378],
    [1250, 1406],
    [1476, 1340],
    [1593, 1262],
  ]),
];

export function getSeat(id: string) {
  return SOFAS.find((seat) => seat.id === id);
}

export function seatsForPackage(packageId: TablePackageId) {
  return SOFAS.filter((seat) => seat.packageId === packageId);
}
