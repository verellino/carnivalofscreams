"use client";

import { SOFAS, type SofaSeat } from "@/lib/seats";
import type { TablePackageId } from "@/lib/tables";

const LINE = "rgba(255,255,255,0.28)";
const LINE_SOFT = "rgba(255,255,255,0.14)";

type Mode = "preview" | "pick";

type Props = {
  mode?: Mode;
  packageId?: TablePackageId;
  selectedSeatId?: string | null;
  takenSeatIds?: string[];
  onSelect?: (seat: SofaSeat) => void;
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
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(255,255,255,0.06) 27px, rgba(255,255,255,0.06) 28px), repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(255,255,255,0.06) 27px, rgba(255,255,255,0.06) 28px)",
        }}
      />

      <svg
        viewBox="0 0 640 760"
        className="relative z-10 h-auto w-full"
        role="img"
        aria-label="Venue floor plan"
      >
        <rect
          x="28"
          y="28"
          width="584"
          height="704"
          fill="none"
          stroke={LINE}
          strokeWidth="1"
        />
        <rect
          x="40"
          y="40"
          width="560"
          height="680"
          fill="none"
          stroke={LINE_SOFT}
          strokeDasharray="6 8"
        />

        <rect
          x="170"
          y="56"
          width="300"
          height="72"
          fill="rgba(255,255,255,0.06)"
          stroke={LINE}
        />
        <text
          x="320"
          y="98"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="18"
          letterSpacing="6"
          fontFamily="var(--font-angie), Helvetica, sans-serif"
        >
          STAGE
        </text>

        {SOFAS.map((seat) => {
          const inCategory = !packageId || seat.packageId === packageId;
          const isTaken = taken.has(seat.id);
          const isSelected = selectedSeatId === seat.id;
          const pickable = mode === "pick" && inCategory && !isTaken;
          const dimmed = packageId ? !inCategory : false;
          const fill = isSelected
            ? "rgba(255,255,255,0.22)"
            : isTaken
              ? "rgba(196,69,58,0.18)"
              : inCategory
                ? "rgba(255,255,255,0.08)"
                : "transparent";
          const stroke = isSelected
            ? "rgba(255,255,255,0.95)"
            : isTaken
              ? "rgba(196,69,58,0.7)"
              : inCategory
                ? "rgba(255,255,255,0.55)"
                : "rgba(255,255,255,0.18)";

          return (
            <g
              key={seat.id}
              opacity={dimmed ? 0.28 : 1}
              style={{ cursor: pickable ? "pointer" : "default" }}
              onClick={() => {
                if (pickable) onSelect?.(seat);
              }}
            >
              <circle
                cx={seat.x}
                cy={seat.y}
                r="48"
                fill={fill}
                stroke={stroke}
                strokeDasharray={isTaken || isSelected ? undefined : "4 6"}
              />
              <circle
                cx={seat.x}
                cy={seat.y}
                r="10"
                fill="rgba(255,255,255,0.2)"
              />
              {[0, 60, 120, 180, 240, 300].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <circle
                    key={deg}
                    cx={seat.x + Math.cos(rad) * 34}
                    cy={seat.y + Math.sin(rad) * 34}
                    r="5"
                    fill="rgba(255,255,255,0.28)"
                  />
                );
              })}
              <text
                x={seat.x}
                y={seat.y + 70}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                letterSpacing="3"
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
