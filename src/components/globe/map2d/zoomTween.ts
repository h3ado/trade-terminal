/**
 * Lightweight rAF-driven tween for camera (pan + zoom). Coalesces rapid wheel
 * / keyboard / button events into ~60fps interpolation so React only renders
 * once per frame instead of once per input event.
 *
 * Usage: const t = createCameraTween(applyFn); t.setTarget({zoom, pan}); t.snap(...);
 */
export type Camera = { zoom: number; pan: { x: number; y: number } };

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function createCameraTween(
  apply: (c: Camera) => void,
  durationMs = 120,
) {
  let raf: number | null = null;
  let from: Camera | null = null;
  let to: Camera | null = null;
  let start = 0;
  let current: Camera | null = null;

  const tick = (now: number) => {
    if (!from || !to) { raf = null; return; }
    const t = Math.min(1, (now - start) / durationMs);
    const e = easeOutCubic(t);
    const c: Camera = {
      zoom: from.zoom + (to.zoom - from.zoom) * e,
      pan: {
        x: from.pan.x + (to.pan.x - from.pan.x) * e,
        y: from.pan.y + (to.pan.y - from.pan.y) * e,
      },
    };
    current = c;
    apply(c);
    if (t < 1) raf = requestAnimationFrame(tick);
    else { raf = null; from = to; }
  };

  return {
    /** Set new target. `cur` is the live camera (read from React state). */
    setTarget(cur: Camera, target: Camera) {
      from = current ?? cur;
      to = target;
      start = performance.now();
      if (raf == null) raf = requestAnimationFrame(tick);
    },
    /** Jump immediately (no animation). */
    snap(target: Camera) {
      if (raf != null) { cancelAnimationFrame(raf); raf = null; }
      from = target; to = target; current = target;
      apply(target);
    },
    /** The latest in-flight target (for chaining wheel events). */
    getTarget(): Camera | null { return to; },
    dispose() { if (raf != null) cancelAnimationFrame(raf); raf = null; },
  };
}

/** Snap zoom toward an integer power-of-2 if within `tol` (e.g. 0.02 = 2%). */
export function snapTileZoom(z: number, tol = 0.02): number {
  if (z <= 1) return z;
  const log = Math.log2(z);
  const nearest = Math.round(log);
  const snapped = Math.pow(2, nearest);
  return Math.abs(z - snapped) / snapped < tol ? snapped : z;
}

/** Normalize a wheel event to a smooth zoom factor (cursor-anchored). */
export function wheelZoomFactor(e: WheelEvent | React.WheelEvent): number {
  let delta = e.deltaY;
  // Convert lines / pages → pixel-equivalent.
  // @ts-ignore - deltaMode exists at runtime
  const mode = (e as any).deltaMode ?? 0;
  if (mode === 1) delta *= 16;       // DOM_DELTA_LINE
  else if (mode === 2) delta *= 100; // DOM_DELTA_PAGE
  // Trackpad pinch arrives with ctrlKey=true and small deltas — finer scaling.
  const k = e.ctrlKey ? 0.012 : 0.0028;
  const factor = Math.exp(-delta * k);
  // Clamp so a runaway scroll can't multiply 50× in one frame.
  return Math.max(0.2, Math.min(5, factor));
}
