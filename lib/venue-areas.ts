import type { TablePackageId } from "./tables";

export const VENUE_MAP = {
  src: "/images/venue-layout.webp",
  alt: "Carnaval of Screams 2026 floor plan",
  width: 1200,
  height: 1200,
} as const;

/**
 * Tinted floor of each area, in floor-plan pixels. Perio and Onomy sit on the
 * bare floor, so they have no outline and are shown by their tables alone.
 */
export const AREA_OUTLINES: Partial<Record<TablePackageId, string>> = {
  luxer:
    "M265,300 L455,300 L600,420 L1140,520 L830,790 L440,790 L380,760 L265,590Z",
  etius: "M455,300 L480,200 L1200,360 L1200,490 L1090,450 L960,455Z",
  tivex:
    "M95,720 L240,590 L270,595 L440,775 L745,775 L745,850 L450,850 L310,945 L255,945Z",
};

/** Centre of each printed table, keyed by seat short code (E1, L12, …). */
export const TABLE_POINTS: Record<string, [number, number]> = {
  E1: [628, 282], E2: [772, 320], E3: [908, 357], E4: [1054, 397],
  L1: [385, 340], L2: [385, 390], L3: [385, 437], L4: [408, 523],
  L5: [446, 568], L6: [592, 638], L7: [653, 648], L8: [708, 655],
  L9: [880, 605], L10: [925, 578], L11: [963, 548], L12: [1000, 520],
  L13: [765, 753], L14: [710, 747], L15: [655, 743], L16: [604, 735],
  L17: [553, 728], L18: [498, 720], L19: [425, 652], L20: [390, 612],
  L21: [350, 578], L22: [320, 545], L23: [310, 480], L24: [310, 432],
  L25: [310, 388], L26: [310, 343],
  T1: [262, 625], T2: [300, 665], T3: [345, 715], T4: [208, 670],
  T5: [248, 710], T6: [290, 750], T7: [330, 795], T8: [408, 805],
  T9: [150, 712], T10: [190, 748], T11: [218, 793], T12: [250, 828],
  T13: [285, 870], T14: [510, 800], T15: [575, 810], T16: [638, 815],
  T17: [698, 820],
  P1: [742, 885], P2: [868, 838], P3: [958, 833],
  O1: [485, 860], O2: [540, 868], O3: [595, 872], O4: [870, 910],
  O5: [935, 915], O6: [990, 885], O7: [1035, 850], O8: [910, 778],
  O9: [955, 733], O10: [995, 772],
};

export function getAreaOutline(packageId: string | null | undefined) {
  if (!packageId) return undefined;
  return AREA_OUTLINES[packageId as TablePackageId];
}
