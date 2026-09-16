"use client";

import { MAP_VIEWBOX, SOFAS, type SofaSeat } from "@/lib/seats";
import type { TablePackageId } from "@/lib/tables";

type Mode = "preview" | "pick";

type Props = {
  mode?: Mode;
  packageId?: TablePackageId;
  selectedSeatId?: string | null;
  takenSeatIds?: string[];
  onSelect?: (seat: SofaSeat) => void;
};

const PACKAGE_STYLE: Record<
  TablePackageId,
  { fill: string; stroke: string }
> = {
  sofa: {
    fill: "rgba(56,189,248,0.22)",
    stroke: "rgba(125,211,252,0.95)",
  },
  premium: {
    fill: "rgba(250,204,21,0.18)",
    stroke: "rgba(250,204,21,0.9)",
  },
  regular: {
    fill: "rgba(255,255,255,0.12)",
    stroke: "rgba(255,255,255,0.85)",
  },
  communal: {
    fill: "rgba(244,114,182,0.2)",
    stroke: "rgba(244,114,182,0.9)",
  },
};

export default function SeatMap({
  mode = "preview",
  packageId,
  selectedSeatId,
  takenSeatIds = [],
  onSelect,
}: Props) {
  const taken = new Set(takenSeatIds);

  return (
    <div className="pass-panel relative overflow-hidden">
      <svg
        viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
        className="relative z-10 h-auto w-full"
        role="img"
        aria-label="Venue floor plan"
      >
        <image
          href="/images/venue-layout.webp"
          width={MAP_VIEWBOX.width}
          height={MAP_VIEWBOX.height}
        />

        {SOFAS.map((seat) => {
          const inCategory = !packageId || seat.packageId === packageId;
          const isTaken = taken.has(seat.id);
          const isSelected = selectedSeatId === seat.id;
          const pickable = mode === "pick" && inCategory && !isTaken;
          const dimmed = packageId ? !inCategory : false;
          const pack = PACKAGE_STYLE[seat.packageId];
          const fill = isSelected
            ? "rgba(255,255,255,0.28)"
            : isTaken
              ? "rgba(196,69,58,0.35)"
              : inCategory
                ? pack.fill
                : "transparent";
          const stroke = isSelected
            ? "rgba(255,255,255,0.95)"
            : isTaken
              ? "rgba(196,69,58,0.9)"
              : inCategory
                ? pack.stroke
                : "rgba(255,255,255,0.2)";

          return (
            <g
              key={seat.id}
              opacity={dimmed ? 0.22 : 1}
              style={{ cursor: pickable ? "pointer" : "default" }}
              onClick={() => {
                if (pickable) onSelect?.(seat);
              }}
            >
              <circle
                cx={seat.x}
                cy={seat.y}
                r="26"
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected || isTaken ? 4 : 3}
              />
              <text
                x={seat.x}
                y={seat.y + 6}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="16"
                letterSpacing="1"
                fontFamily="var(--font-angie), Helvetica, sans-serif"
              >
                {seat.short}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
