const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "X", href: "#" },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 flex flex-col items-center gap-4 border-t border-white/10 bg-ink px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="font-heading text-[11px] tracking-[0.15em] text-mist/60">
        © 2026 Carnaval of Screams. All rights reserved.
      </p>
      <div className="flex items-center gap-5">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="font-heading text-[11px] tracking-[0.15em] text-mist/60 transition-colors duration-150 hover:text-gold-bright"
          >
            {s.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
