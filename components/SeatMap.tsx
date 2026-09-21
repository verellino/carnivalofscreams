"use client";

import { useState } from "react";

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

const HOVER_STROKE: Record<TablePackageId, string> = {
  luxer: "rgba(216,180,254,0.95)",
  etius: "rgba(125,211,252,0.95)",
  tivex: "rgba(249,168,212,0.95)",
  perio: "rgba(253,224,71,0.95)",
  onomy: "rgba(103,232,249,0.95)",
};

export default function SeatMap({
  mode = "preview",
  packageId,
  selectedSeatId,
  takenSeatIds = [],
  onSelect,
}: Props) {
  const taken = new Set(takenSeatIds);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
          const isHovered = hoveredId === seat.id;
          const pickable = mode === "pick" && inCategory && !isTaken;
          const showRing = isSelected || isTaken || (pickable && isHovered);
          const hitW = seat.w * 1.55;
          const hitH = seat.h * 1.55;

          return (
            <g
              key={seat.id}
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
                onPointerEnter={() => {
                  if (pickable) setHoveredId(seat.id);
                }}
                onPointerLeave={() => {
                  setHoveredId((current) =>
                    current === seat.id ? null : current,
                  );
                }}
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
              {showRing ? (
                <rect
                  x={-seat.w / 2}
                  y={-seat.h / 2}
                  width={seat.w}
                  height={seat.h}
                  rx="10"
                  fill={
                    isSelected
                      ? "rgba(255,255,255,0.16)"
                      : isTaken
                        ? "rgba(196,69,58,0.28)"
                        : "transparent"
                  }
                  stroke={
                    isSelected
                      ? "rgba(255,255,255,0.95)"
                      : isTaken
                        ? "rgba(248,113,113,0.95)"
                        : HOVER_STROKE[seat.packageId]
                  }
                  strokeWidth={isSelected || isTaken ? 5 : 4}
                  pointerEvents="none"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
