import { InstagramIcon } from "./InstagramIcon";
import { TikTokIcon } from "./TikTokIcon";

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/carnavalofscreams", icon: <InstagramIcon className="w-4 h-4" /> },
  { label: "TikTok", href: "https://www.tiktok.com/@carnavalofscreams", icon: <TikTokIcon className="w-4 h-4" /> },
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
            className="font-heading text-[11px] tracking-[0.15em] text-white/45 transition-colors duration-150 hover:text-white"
          >
            {s.icon}
          </a>
        ))}
      </div>
    </footer>
  );
}
