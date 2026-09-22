import { getAreaOutline, VENUE_MAP } from "@/lib/venue-areas";

type Props = {
  className?: string;
  /** Area to spotlight on the plan; everything else dims behind it. */
  highlightAreaId?: string | null;
  highlightLabel?: string;
};

export default function SeatMap({
  className,
  highlightAreaId,
  highlightLabel,
}: Props) {
  const outline = getAreaOutline(highlightAreaId);
  const frame = `M0,0 H${VENUE_MAP.width} V${VENUE_MAP.height} H0 Z`;

  return (
    <div
      className={`pass-panel relative overflow-hidden bg-black ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={VENUE_MAP.src}
        alt={VENUE_MAP.alt}
        className="h-auto w-full"
      />
      {outline ? (
        <svg
          viewBox={`0 0 ${VENUE_MAP.width} ${VENUE_MAP.height}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          role="img"
          aria-label={
            highlightLabel
              ? `${highlightLabel} highlighted on the floor plan`
              : "Selected area highlighted on the floor plan"
          }
        >
          <path
            d={`${frame} ${outline}`}
            fillRule="evenodd"
            fill="rgba(5, 3, 8, 0.72)"
          />
          <path
            d={outline}
            fill="rgba(243, 207, 138, 0.16)"
            stroke="var(--gold-bright)"
            strokeWidth={9}
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </div>
  );
}
