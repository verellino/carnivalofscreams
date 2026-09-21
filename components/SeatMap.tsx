type Props = {
  className?: string;
};

export default function SeatMap({ className }: Props) {
  return (
    <div className={`pass-panel overflow-hidden bg-black ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/venue-layout.webp"
        alt="Carnaval of Screams 2026 floor plan"
        className="h-auto w-full"
      />
    </div>
  );
}
