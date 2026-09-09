export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

export function normalizeWheel(event: WheelEvent) {
  let pixelY = event.deltaY;

  if (event.deltaMode === 1) pixelY *= 16;
  if (event.deltaMode === 2) pixelY *= window.innerHeight;

  return { pixelY };
}
