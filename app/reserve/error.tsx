"use client";

export default function ReserveError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-heading text-xs tracking-[0.35em] text-gold-bright">
        Reservation
      </p>
      <h1 className="mt-4 font-heading text-3xl tracking-[0.08em] text-white">
        Something slipped.
      </h1>
      <p className="mt-3 text-sm text-mist/75">
        The reservation page failed to load. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-press mt-8 rounded-full border border-white/15 bg-white px-8 py-3 font-heading text-sm tracking-widest text-black"
      >
        Try again
      </button>
    </div>
  );
}
