"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/dev" },
  { label: "Ticket", href: "#" },
  { label: "Reservation", href: "#" },
] as const;

export default function SiteHeader() {
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  const moveTo = useCallback((tab: HTMLElement, animate: boolean) => {
    const pill = pillRef.current;
    if (!pill) return;

    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
      return;
    }

    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.style.width = `${tab.offsetWidth}px`;
  }, []);

  const scrollTabIntoView = useCallback((tab: HTMLElement, smooth: boolean) => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    tab.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: smooth && !reduceMotion ? "smooth" : "auto",
    });
  }, []);

  const moveToActive = useCallback(
    (animate: boolean) => {
      const tab = barRef.current?.querySelector<HTMLElement>(
        '.t-tab[aria-selected="true"]',
      );
      if (!tab) return;
      moveTo(tab, animate);
      scrollTabIntoView(tab, false);
    },
    [moveTo, scrollTabIntoView],
  );

  useLayoutEffect(() => {
    moveToActive(false);

    const bar = barRef.current;
    if (!bar) return;

    const observer = new ResizeObserver(() => moveToActive(false));
    observer.observe(bar);

    const onResize = () => moveToActive(false);
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [moveToActive]);

  function select(index: number) {
    setActive(index);
    const tab = barRef.current?.querySelectorAll<HTMLElement>(".t-tab")[index];
    if (!tab) return;
    moveTo(tab, true);
    scrollTabIntoView(tab, true);
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-100 flex justify-center pt-8">
      <div
        ref={barRef}
        className="t-tabs pointer-events-auto border border-white/30 shadow-[0px_2px_48px_0px_rgba(217,169,79,0.25)]"
        role="tablist"
        aria-label="Site"
        onKeyDown={(event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          const tabs = [
            ...(barRef.current?.querySelectorAll<HTMLElement>(".t-tab") ?? []),
          ];
          const current = tabs.findIndex(
            (tab) => tab.getAttribute("aria-selected") === "true",
          );
          const delta = event.key === "ArrowRight" ? 1 : -1;
          const next = (current + delta + tabs.length) % tabs.length;
          select(next);
          tabs[next]?.focus();
        }}
      >
        <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
        {NAV_LINKS.map((link, index) => (
          <button
            key={link.label}
            type="button"
            className="t-tab font-heading flex items-center text-center text-[11px] md:text-sm"
            role="tab"
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => select(index)}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
}
