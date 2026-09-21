"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  MAP_VIEWBOX,
  mapViewForBookable,
  mapViewForPackage,
  nearestSeat,
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
  onSelect?: (seat: VenueSeat) => void;
  fit?: "full" | "bookable";
  className?: string;
};

const HOVER_STROKE: Record<TablePackageId, string> = {
  luxer: "rgba(216,180,254,0.95)",
  etius: "rgba(125,211,252,0.95)",
  tivex: "rgba(249,168,212,0.95)",
  perio: "rgba(253,224,71,0.95)",
  onomy: "rgba(103,232,249,0.95)",
};

const MIN_SCALE = 1;
const MAX_SCALE = 3.6;

function clampPan(scale: number, x: number, y: number, width: number, height: number) {
  if (scale <= 1) return { x: 0, y: 0 };
  return {
    x: Math.min(0, Math.max(width - width * scale, x)),
    y: Math.min(0, Math.max(height - height * scale, y)),
  };
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function SeatMap({
  mode = "preview",
  packageId,
  selectedSeatId,
  takenSeatIds = [],
  onSelect,
  fit = "bookable",
  className,
}: Props) {
  const taken = new Set(takenSeatIds);
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const pinch = useRef<{
    dist: number;
    scale: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const view =
    packageId
      ? mapViewForPackage(packageId)
      : fit === "full"
        ? { x: 0, y: 0, width: MAP_VIEWBOX.width, height: MAP_VIEWBOX.height }
        : mapViewForBookable();
  const selected = selectedSeatId
    ? SEATS.find((seat) => seat.id === selectedSeatId)
    : undefined;
  const primed = useRef(false);

  function toSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const local = point.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  function zoomAt(clientX: number, clientY: number, nextScale: number) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const cx = (px - pan.x) / scale;
    const cy = (py - pan.y) / scale;
    const nextPan = clampPan(
      clamped,
      px - cx * clamped,
      py - cy * clamped,
      rect.width,
      rect.height,
    );
    setScale(clamped);
    setPan(nextPan);
  }

  function resetView() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  useLayoutEffect(() => {
    if (primed.current) return;
    const frame = frameRef.current;
    const svg = svgRef.current;
    if (!frame || !svg) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0 || rect.width >= 768) {
      primed.current = true;
      return;
    }
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    primed.current = true;
    const focus =
      SEATS.find((seat) => seat.id === "tivex-6") ??
      SEATS[Math.floor(SEATS.length / 2)];
    const point = svg.createSVGPoint();
    point.x = focus.x;
    point.y = focus.y;
    const screen = point.matrixTransform(ctm);
    zoomAt(screen.x, screen.y, 2.3);
  });

  function pickAt(clientX: number, clientY: number) {
    if (mode !== "pick") return;
    const local = toSvg(clientX, clientY);
    if (!local) return;
    const seat = nearestSeat(local.x, local.y, {
      packageId,
      takenIds: taken,
      maxDist: 110,
    });
    if (seat) onSelect?.(seat);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    frameRef.current?.setPointerCapture(event.pointerId);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: distance(a, b),
        scale,
        panX: pan.x,
        panY: pan.y,
      };
      drag.current = null;
      return;
    }

    drag.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const nextDist = distance(a, b);
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, (pinch.current.scale * nextDist) / pinch.current.dist),
      );
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      zoomAt(midX, midY, nextScale);
      return;
    }

    if (drag.current) {
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      if (Math.hypot(dx, dy) > 8) drag.current.moved = true;
      if (drag.current.moved && scale > 1) {
        const frame = frameRef.current?.getBoundingClientRect();
        if (!frame) return;
        setPan(
          clampPan(
            scale,
            drag.current.panX + dx,
            drag.current.panY + dy,
            frame.width,
            frame.height,
          ),
        );
      }
    }

    if (mode === "pick" && event.pointerType === "mouse") {
      const local = toSvg(event.clientX, event.clientY);
      if (!local) return;
      const seat = nearestSeat(local.x, local.y, {
        packageId,
        takenIds: taken,
        maxDist: 70,
      });
      setHoveredId(seat?.id ?? null);
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const wasDrag = drag.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    if (pointers.current.size === 0 && wasDrag && !wasDrag.moved) {
      pickAt(event.clientX, event.clientY);
    }

    if (pointers.current.size === 0) drag.current = null;
  }

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const next = scale * (event.deltaY < 0 ? 1.12 : 0.9);
    zoomAt(event.clientX, event.clientY, next);
  }

  return (
    <div
      ref={frameRef}
      className={`pass-panel relative w-full overflow-hidden bg-black touch-none ${className ?? ""}`}
      style={{ aspectRatio: `${view.width} / ${view.height}` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => setHoveredId(null)}
      onWheel={onWheel}
    >
      <div
        className="absolute inset-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          className="h-full w-full"
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
            const showRing =
              isTaken || isSelected || (mode === "pick" && inCategory && isHovered);

            if (!showRing) return null;

            return (
              <g
                key={seat.id}
                transform={`translate(${seat.x} ${seat.y}) rotate(${seat.rotate})`}
                pointerEvents="none"
              >
                <rect
                  x={-seat.w / 2}
                  y={-seat.h / 2}
                  width={seat.w}
                  height={seat.h}
                  rx="10"
                  fill={
                    isTaken
                      ? "rgba(196,69,58,0.28)"
                      : isSelected
                        ? "rgba(255,255,255,0.16)"
                        : "transparent"
                  }
                  stroke={
                    isTaken
                      ? "rgba(248,113,113,0.95)"
                      : isSelected
                        ? "#fff"
                        : HOVER_STROKE[seat.packageId]
                  }
                  strokeWidth={isSelected || isTaken ? 5 : 4}
                />
              </g>
            );
          })}

          {selected ? (
            <g transform={`translate(${selected.x} ${selected.y})`} pointerEvents="none">
              <rect
                x="-40"
                y="-18"
                width="80"
                height="36"
                rx="18"
                fill="#fff"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="2"
              />
              <text
                y="6"
                textAnchor="middle"
                fill="#050308"
                fontSize="18"
                fontWeight="700"
                letterSpacing="1"
                fontFamily="var(--font-angie), Helvetica, sans-serif"
              >
                {selected.short}
              </text>
            </g>
          ) : null}
        </svg>
      </div>

      <div className="pointer-events-auto absolute bottom-3 right-3 z-20 flex gap-1">
        <button
          type="button"
          onClick={() => {
            const frame = frameRef.current?.getBoundingClientRect();
            if (!frame) return;
            zoomAt(frame.left + frame.width / 2, frame.top + frame.height / 2, scale * 1.25);
          }}
          className="flex h-9 w-9 items-center justify-center border border-white/30 bg-black/70 font-heading text-lg text-white"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            const frame = frameRef.current?.getBoundingClientRect();
            if (!frame) return;
            zoomAt(frame.left + frame.width / 2, frame.top + frame.height / 2, scale / 1.25);
          }}
          className="flex h-9 w-9 items-center justify-center border border-white/30 bg-black/70 font-heading text-lg text-white"
          aria-label="Zoom out"
        >
          −
        </button>
        {scale > 1.02 ? (
          <button
            type="button"
            onClick={resetView}
            className="flex h-9 items-center justify-center border border-white/30 bg-black/70 px-2 font-heading text-[10px] tracking-[0.16em] text-white"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
