"use client";

import { MAP_VIEWBOX, SEATS, type VenueSeat } from "@/lib/seats";
import type { TablePackageId } from "@/lib/tables";

type Mode = "preview" | "pick";

type Props = {
  mode?: Mode;
  packageId?: TablePackageId;
  selectedSeatId?: string | null;
  takenSeatIds?: string[];
  onSelect?: (seat: VenueSeat) => void;
};

const PACKAGE_STYLE: Record<
  TablePackageId,
  { fill: string; stroke: string }
> = {
  luxer: {
    fill: "rgba(192,132,252,0.28)",
    stroke: "rgba(216,180,254,0.95)",
  },
  etius: {
    fill: "rgba(56,189,248,0.28)",
    stroke: "rgba(125,211,252,0.95)",
  },
  tivex: {
    fill: "rgba(244,114,182,0.28)",
    stroke: "rgba(249,168,212,0.95)",
  },
  perio: {
    fill: "rgba(250,204,21,0.22)",
    stroke: "rgba(253,224,71,0.95)",
  },
  onomy: {
    fill: "rgba(34,211,238,0.28)",
    stroke: "rgba(103,232,249,0.95)",
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
          pointerEvents="none"
        />

        {SEATS.map((seat) => {
          const inCategory = !packageId || seat.packageId === packageId;
          const isTaken = taken.has(seat.id);
          const isSelected = selectedSeatId === seat.id;
          const pickable = mode === "pick" && inCategory && !isTaken;
          const dimmed = packageId ? !inCategory : false;
          const showPack = inCategory && (mode === "pick" || Boolean(packageId));
          const pack = PACKAGE_STYLE[seat.packageId];
          const fill = isSelected
            ? "rgba(255,255,255,0.38)"
            : isTaken
              ? "rgba(196,69,58,0.45)"
              : showPack
                ? pack.fill
                : "transparent";
          const stroke = isSelected
            ? "rgba(255,255,255,0.95)"
            : isTaken
              ? "rgba(196,69,58,0.95)"
              : showPack
                ? pack.stroke
                : "transparent";
          const hitW = seat.w * 1.45;
          const hitH = seat.h * 1.45;

          return (
            <g
              key={seat.id}
              opacity={dimmed ? 0.16 : 1}
              transform={`translate(${seat.x} ${seat.y}) rotate(${seat.rotate})`}
            >
              <title>
                {isTaken ? `${seat.short} held` : seat.label}
              </title>
              <rect
                x={-hitW / 2}
                y={-hitH / 2}
                width={hitW}
                height={hitH}
                rx="12"
                fill="transparent"
                pointerEvents={pickable ? "all" : "none"}
                style={{ cursor: pickable ? "pointer" : "default" }}
                onPointerDown={(event) => {
                  if (!pickable) return;
                  event.preventDefault();
                  onSelect?.(seat);
                }}
                onClick={(event) => {
                  if (!pickable) return;
                  event.preventDefault();
                  onSelect?.(seat);
                }}
              />
              <rect
                x={-seat.w / 2}
                y={-seat.h / 2}
                width={seat.w}
                height={seat.h}
                rx="10"
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected || isTaken ? 4 : 3}
                pointerEvents="none"
              />
              {mode === "pick" && packageId && inCategory ? (
                <text
                  y="6"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="15"
                  letterSpacing="1"
                  fontFamily="var(--font-angie), Helvetica, sans-serif"
                  transform={`rotate(${-seat.rotate})`}
                  pointerEvents="none"
                >
                  {seat.short}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
