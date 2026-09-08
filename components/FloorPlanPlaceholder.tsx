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

export default function FloorPlanPlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-[2px] border border-gold/35 bg-ink-soft/80">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(217,169,79,0.08) 27px, rgba(217,169,79,0.08) 28px), repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(217,169,79,0.08) 27px, rgba(217,169,79,0.08) 28px)",
        }}
      />

      <svg
        viewBox="0 0 640 760"
        className="relative z-10 h-auto w-full"
        role="img"
        aria-label="Venue floor plan coming soon"
      >
        <rect x="28" y="28" width="584" height="704" fill="none" stroke="rgba(217,169,79,0.35)" strokeWidth="1.5" />
        <rect x="40" y="40" width="560" height="680" fill="none" stroke="rgba(217,169,79,0.18)" strokeDasharray="6 8" />

        <rect x="170" y="56" width="300" height="72" rx="2" fill="rgba(217,169,79,0.12)" stroke="#d9a94f" />
        <text
          x="320"
          y="98"
          textAnchor="middle"
          fill="#f3cf8a"
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
              stroke="rgba(243,207,138,0.55)"
              strokeDasharray="4 6"
            />
            <circle cx={cx} cy={cy} r="10" fill="rgba(217,169,79,0.35)" />
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <circle
                  key={deg}
                  cx={cx + Math.cos(rad) * 34}
                  cy={cy + Math.sin(rad) * 34}
                  r="5"
                  fill="rgba(205,191,224,0.35)"
                />
              );
            })}
          </g>
        ))}

        <text
          x="320"
          y="670"
          textAnchor="middle"
          fill="rgba(205,191,224,0.55)"
          fontSize="11"
          letterSpacing="4"
          fontFamily="var(--font-angie), Helvetica, sans-serif"
        >
          TABLE MAP ARRIVES WITH THE LAYOUT
        </text>
      </svg>

      <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/35">
        <div className="-rotate-6 border-2 border-gold bg-ink/80 px-6 py-4 text-center shadow-[0_0_40px_-12px_rgba(217,169,79,0.9)]">
          <p className="font-heading text-xs tracking-[0.35em] text-gold-bright">
            FLOOR PLAN
          </p>
          <p className="mt-1 font-heading text-2xl tracking-[0.18em] text-white sm:text-3xl">
            COMING SOON
          </p>
        </div>
      </div>
    </div>
  );
}
