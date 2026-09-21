"use client";

import { useState } from "react";

import {
  MAP_VIEWBOX,
  mapViewForPackage,
  SEATS,
  type VenueSeat,
} from "@/lib/seats";
import type { TablePackageId } from "@/lib/tables";

type Mode = "preview" | "pick";

type Props = {
  mode?: Mode;
  packageId?: TablePackageId;
  selectedSeatId?: string | null;
  takenSeatIds?: string[];
  hint?: string;
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
  hint,
  onSelect,
}: Props) {
  const taken = new Set(takenSeatIds);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const view = mapViewForPackage(packageId);
  const selected = selectedSeatId
    ? SEATS.find((seat) => seat.id === selectedSeatId)
    : undefined;

  return (
    <div className="pass-panel relative overflow-hidden bg-black">
      <svg
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
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
          const showRing =
            isTaken || (pickable && isHovered && !isSelected);
          const hitW = seat.w * 1.7;
          const hitH = seat.h * 1.7;

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
                    isTaken ? "rgba(196,69,58,0.28)" : "transparent"
                  }
                  stroke={
                    isTaken
                      ? "rgba(248,113,113,0.95)"
                      : HOVER_STROKE[seat.packageId]
                  }
                  strokeWidth={isTaken ? 5 : 4}
                  pointerEvents="none"
                />
              ) : null}
            </g>
          );
        })}

        {selected ? (
          <g transform={`translate(${selected.x} ${selected.y})`}>
            <circle
              r="34"
              fill="#fff"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="3"
            />
            <text
              y="7"
              textAnchor="middle"
              fill="#050308"
              fontSize="22"
              fontWeight="700"
              letterSpacing="1"
              fontFamily="var(--font-angie), Helvetica, sans-serif"
            >
              {selected.short}
            </text>
          </g>
        ) : null}
      </svg>
      {hint ? (
        <p className="pointer-events-none absolute bottom-3 left-3 right-3 font-heading text-[10px] tracking-[0.22em] text-white/70 sm:text-[11px]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
