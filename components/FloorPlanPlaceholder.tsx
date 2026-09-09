const TABLES = [
  [160, 220],
  [320, 220],
  [480, 220],
  [160, 370],
  [320, 370],
  [480, 370],
  [160, 520],
  [320, 520],
  [480, 520],
] as const;

const LINE = "rgba(255,255,255,0.28)";
const LINE_SOFT = "rgba(255,255,255,0.14)";

export default function FloorPlanPlaceholder() {
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
        aria-label="Venue floor plan coming soon"
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

        {TABLES.map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle
              cx={cx}
              cy={cy}
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="4 6"
            />
            <circle cx={cx} cy={cy} r="10" fill="rgba(255,255,255,0.2)" />
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <circle
                  key={deg}
                  cx={cx + Math.cos(rad) * 34}
                  cy={cy + Math.sin(rad) * 34}
                  r="5"
                  fill="rgba(255,255,255,0.28)"
                />
              );
            })}
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/45">
        <div className="px-8 py-6 text-center">
          <p className="font-heading text-[11px] tracking-[0.38em] text-white/45">
            Floor plan
          </p>
          <p className="mt-2 font-heading text-2xl tracking-[0.14em] text-white sm:text-3xl">
            Coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
