export default function ConfirmedLoading() {
  return (
    <div className="starfield relative isolate min-h-[70vh]">
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-6 pb-20 pt-36 text-center">
        <p className="font-heading text-xs tracking-[0.35em] text-gold-bright">
          Reservation
        </p>
        <h1 className="mt-4 font-heading text-4xl tracking-[0.08em] text-white">
          Checking payment…
        </h1>
      </div>
    </div>
  );
}
