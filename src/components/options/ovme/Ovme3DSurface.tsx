// Bloomberg-style 3D implied volatility surface using react-three-fiber.
// Strikes (moneyness) on X, term on Z, IV on Y. Colored green→red, black wireframe overlay,
// side wall smile + term projections, axis labels, orbit controls.
import React, { useMemo, useState } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Line, Html } from "@react-three/drei";
import { RotateCw, Crosshair } from "lucide-react";
import * as THREE from "three";

interface Props { ticker?: string; redact?: boolean; liveIvAt?: (strike: number, dte: number) => number | null }

// Surface grid
const STRIKE_COUNT = 16;
const TERM_COUNT = 8;
const STRIKES = Array.from({ length: STRIKE_COUNT }, (_, i) => 447 + i * 5); // 447..522
const TERMS = [0, 1, 5, 14, 30, 60, 90, 180]; // DTE
const TERM_LABELS = ["0DTE", "1D", "5D", "2W", "1M", "2M", "3M", "6M"];

function ivAt(strike: number, days: number, spot = 482) {
  const m = (strike - spot) / spot;
  // ATM term structure
  const atm = 21 + Math.log(days + 1) * 1.2;
  // Smile curvature decays with sqrt(time) — sharp at 0DTE, flat at 6M
  const smileScale = 4200 / Math.sqrt(days + 2);
  const smile = m * m * smileScale;
  // Put skew likewise stronger short-dated
  const skewScale = (m < 0 ? 130 : 35) / Math.sqrt(days + 2);
  const skew = Math.abs(m) * skewScale;
  return Math.max(20, Math.min(36, atm + smile + skew));
}

// Map IV → 4-stop ramp matching the legend: green → yellow-green → orange → red
export type Stop = { t: number; h: number; s: number; l: number };
const DEFAULT_STOPS: Stop[] = [
  { t: 0.0,  h: 140, s: 1.00, l: 0.38 }, // deep emerald valley
  { t: 0.50, h: 115, s: 1.00, l: 0.42 }, // rich green midpoint
  { t: 0.70, h: 70,  s: 1.00, l: 0.48 }, // saturated lime/yellow shoulders
  { t: 0.85, h: 28,  s: 1.00, l: 0.48 }, // deep orange
  { t: 1.0,  h: 0,   s: 1.00, l: 0.45 }, // deep red corners
];
// vibrance: 0 = dim/desaturated, 50 = default, 100 = max bright/saturated
// intensity: 0 = lighter/pastel, 50 = default, 100 = deeper/darker (lightness only)
function applyVibrance(s: number, l: number, vibrance: number, intensity: number = 50) {
  const v = (vibrance - 50) / 50; // -1..+1
  const i = (intensity - 50) / 50; // -1..+1, positive = deeper (darker)
  return {
    s: Math.max(0, Math.min(1, s + v * 0.40)),
    l: Math.max(0.10, Math.min(0.85, l + v * 0.20 - i * 0.25)),
  };
}
function ivColor(iv: number, lo: number, hi: number, vibrance: number, intensity: number, stops: Stop[]) {
  const t = Math.max(0, Math.min(1, (iv - lo) / (hi - lo)));
  let a = stops[0], b = stops[stops.length - 1];
  for (let k = 0; k < stops.length - 1; k++) {
    if (t >= stops[k].t && t <= stops[k + 1].t) {
      a = stops[k]; b = stops[k + 1]; break;
    }
  }
  const f = (t - a.t) / (b.t - a.t || 1);
  const h = a.h + (b.h - a.h) * f;
  const sRaw = a.s + (b.s - a.s) * f;
  const lRaw = a.l + (b.l - a.l) * f;
  const { s, l } = applyVibrance(sRaw, lRaw, vibrance, intensity);
  return new THREE.Color().setHSL(h / 360, s, l);
}

function legendGradient(vibrance: number, intensity: number, stops: Stop[]) {
  // sample N stops from high→low IV (top to bottom of legend)
  const ts = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0];
  const css = ts.map((t) => {
    let a = stops[0], b = stops[stops.length - 1];
    for (let k = 0; k < stops.length - 1; k++) {
      if (t >= stops[k].t && t <= stops[k + 1].t) {
        a = stops[k]; b = stops[k + 1]; break;
      }
    }
    const f = (t - a.t) / (b.t - a.t || 1);
    const h = a.h + (b.h - a.h) * f;
    const { s, l } = applyVibrance(a.s + (b.s - a.s) * f, a.l + (b.l - a.l) * f, vibrance, intensity);
    return `hsl(${h.toFixed(0)}, ${(s * 100).toFixed(0)}%, ${(l * 100).toFixed(0)}%)`;
  });
  return `linear-gradient(to bottom, ${css.join(", ")})`;
}

// Hex <-> HSL helpers for the color picker
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return { h, s, l };
}
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}


// Gap between surface and projection walls
const WALL_GAP = 2.4;

const SURF_W = 10;   // world units across moneyness
const SURF_D = 6;    // world units across term
const HEIGHT = 4;    // world units of IV scale

const IV_LO = 20;
const IV_HI = 36;

function ivToY(iv: number) {
  return ((iv - IV_LO) / (IV_HI - IV_LO)) * HEIGHT;
}
function strikeToX(i: number) {
  return -SURF_W / 2 + (i / (STRIKE_COUNT - 1)) * SURF_W;
}
function termToZ(i: number) {
  return -SURF_D / 2 + (i / (TERM_COUNT - 1)) * SURF_D;
}

function Surface({
  vibrance,
  intensity,
  hoverDetails,
  stops,
  liveIvAt,
}: {
  vibrance: number;
  intensity: number;
  hoverDetails: boolean;
  stops: Stop[];
  liveIvAt?: (strike: number, dte: number) => number | null;
}) {
  const [hover, setHover] = useState<
    | { point: THREE.Vector3; strike: number; term: string; iv: number }
    | null
  >(null);

  // Build geometry + wireframe + projections in one memo
  const { geometry, wireGeometry, smileLines, termLines, ivTable } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SURF_W, SURF_D, STRIKE_COUNT - 1, TERM_COUNT - 1);
    geo.rotateX(-Math.PI / 2); // make it horizontal (X-Z plane)

    const colors: number[] = [];
    const pos = geo.attributes.position;

    // Build IV table
    const iv: number[][] = [];
    for (let j = 0; j < TERM_COUNT; j++) {
      iv[j] = [];
      for (let i = 0; i < STRIKE_COUNT; i++) iv[j][i] = liveIvAt?.(STRIKES[i], TERMS[j]) ?? ivAt(STRIKES[i], TERMS[j]);
    }

    // Displace vertices vertically + assign vertex colors.
    // PlaneGeometry indexing: vertex (i,j) → index = j*(STRIKE_COUNT) + i
    for (let j = 0; j < TERM_COUNT; j++) {
      for (let i = 0; i < STRIKE_COUNT; i++) {
        const idx = j * STRIKE_COUNT + i;
        const v = iv[j][i];
        pos.setY(idx, ivToY(v));
        const c = ivColor(v, IV_LO, IV_HI, vibrance, intensity, stops);
        colors.push(c.r, c.g, c.b);
      }
    }
    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const wire = new THREE.WireframeGeometry(geo);

    // Smile lines (back wall)
    const smile: [number, number, number][][] = [];
    for (let j = 0; j < TERM_COUNT; j++) {
      const line: [number, number, number][] = [];
      for (let i = 0; i < STRIKE_COUNT; i++) {
        line.push([strikeToX(i), ivToY(iv[j][i]), -SURF_D / 2 - WALL_GAP - 0.01]);
      }
      smile.push(line);
    }

    // Term lines (right wall)
    const term: [number, number, number][][] = [];
    for (let i = 0; i < STRIKE_COUNT; i += 2) {
      const line: [number, number, number][] = [];
      for (let j = 0; j < TERM_COUNT; j++) {
        line.push([SURF_W / 2 + WALL_GAP + 0.01, ivToY(iv[j][i]), termToZ(j)]);
      }
      term.push(line);
    }

    return { geometry: geo, wireGeometry: wire, smileLines: smile, termLines: term, ivTable: iv };
  }, [vibrance, intensity, stops, liveIvAt]);

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (!hoverDetails) return;
    e.stopPropagation();
    const face = e.face;
    if (!face) return;
    // pick the vertex of the face nearest the hit point
    const idxAttr = geometry.index;
    const posAttr = geometry.attributes.position;
    const tri = [face.a, face.b, face.c];
    let best = tri[0];
    let bestD = Infinity;
    const v = new THREE.Vector3();
    for (const vi of tri) {
      v.fromBufferAttribute(posAttr, vi);
      const d = v.distanceToSquared(e.point);
      if (d < bestD) { bestD = d; best = vi; }
    }
    const j = Math.floor(best / STRIKE_COUNT);
    const i = best % STRIKE_COUNT;
    const strike = STRIKES[i];
    const term = TERM_LABELS[j];
    const iv = ivTable[j][i];
    const pt = new THREE.Vector3().fromBufferAttribute(posAttr, best);
    setHover({ point: pt, strike, term, iv });
  };

  const handleOut = () => setHover(null);

  return (
    <>
      {/* Colored surface */}
      <mesh
        geometry={geometry}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
      >
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>

      {hoverDetails && hover && (
        <Html
          position={[hover.point.x, hover.point.y + 0.15, hover.point.z]}
          style={{ pointerEvents: "none", transform: "translate(8px, -100%)" }}
        >
          <div className="bg-black/85 border border-accent px-2 py-1 text-[10px] font-mono text-accent whitespace-nowrap leading-tight">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">STRIKE</span><span>{hover.strike}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">TERM</span><span>{hover.term}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">IV</span><span>{hover.iv.toFixed(2)}%</span></div>
          </div>
        </Html>
      )}


      {/* Black wireframe overlay */}
      <lineSegments geometry={wireGeometry}>
        <lineBasicMaterial color="#000000" linewidth={1} transparent opacity={0.85} />
      </lineSegments>

      {/* Floor shadow */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SURF_W, SURF_D]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.6} />
      </mesh>

      {/* Back wall (smile projection panel) */}
      <BackWall />
      {smileLines.map((pts, i) => (
        <Line key={`s-${i}`} points={pts} color="#ffffff" lineWidth={0.8} transparent opacity={0.55} />
      ))}

      {/* Right wall (term structure projection panel) */}
      <RightWall />
      {termLines.map((pts, i) => (
        <Line key={`t-${i}`} points={pts} color="#ffffff" lineWidth={0.8} transparent opacity={0.55} />
      ))}

      {/* Axis labels */}
      <AxisLabels />
    </>
  );
}

function BackWall() {
  // Faint grid panel at z = -SURF_D/2 - WALL_GAP
  const zPos = -SURF_D / 2 - WALL_GAP - 0.02;
  const lines = useMemo(() => {
    const segs: [number, number, number][][] = [];
    const cols = 8;
    const rows = 5;
    for (let i = 0; i <= cols; i++) {
      const x = -SURF_W / 2 + (i / cols) * SURF_W;
      segs.push([[x, 0, zPos], [x, HEIGHT, zPos]]);
    }
    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * HEIGHT;
      segs.push([[-SURF_W / 2, y, zPos], [SURF_W / 2, y, zPos]]);
    }
    return segs;
  }, [zPos]);
  return (
    <>
      {lines.map((p, i) => (
        <Line key={i} points={p} color="#ffffff" lineWidth={0.5} transparent opacity={0.25} />
      ))}
      {[20, 24, 28, 32, 36].map((v) => (
        <Text key={v} position={[-SURF_W / 2 - 0.3, ivToY(v), zPos - 0.01]} fontSize={0.22}
          color="#d1d5db" anchorX="right" anchorY="middle">
          {v.toFixed(2)}
        </Text>
      ))}
    </>
  );
}

function RightWall() {
  const xPos = SURF_W / 2 + WALL_GAP + 0.02;
  const lines = useMemo(() => {
    const segs: [number, number, number][][] = [];
    const cols = 6;
    const rows = 5;
    for (let i = 0; i <= cols; i++) {
      const z = -SURF_D / 2 + (i / cols) * SURF_D;
      segs.push([[xPos, 0, z], [xPos, HEIGHT, z]]);
    }
    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * HEIGHT;
      segs.push([[xPos, y, -SURF_D / 2], [xPos, y, SURF_D / 2]]);
    }
    return segs;
  }, [xPos]);
  return (
    <>
      {lines.map((p, i) => (
        <Line key={i} points={p} color="#ffffff" lineWidth={0.5} transparent opacity={0.25} />
      ))}
      {[20, 24, 28, 32, 36].map((v) => (
        <Text key={v} position={[xPos + 0.4, ivToY(v), SURF_D / 2 + 0.05]} fontSize={0.2}
          color="#d1d5db" anchorX="left" anchorY="middle">
          {v.toFixed(2)}
        </Text>
      ))}
    </>
  );
}

function AxisLabels() {
  return (
    <>
      {/* Strike (moneyness) labels along front edge */}
      {STRIKES.map((s, i) => {
        if (i % 2 !== 0) return null;
        return (
          <Text key={s} position={[strikeToX(i), -0.05, SURF_D / 2 + 0.4]}
            fontSize={0.24} color="hsl(28, 100%, 55%)" rotation={[-Math.PI / 2.4, 0, -Math.PI / 12]}
            anchorX="center" anchorY="top">
            {s}%
          </Text>
        );
      })}
      <Text position={[0, -0.05, SURF_D / 2 + 1.2]} fontSize={0.32} color="#e5e7eb"
        rotation={[-Math.PI / 2, 0, 0]} anchorX="center" anchorY="top">
        MONEYNESS
      </Text>

      {/* Term labels along right edge */}
      {TERM_LABELS.map((t, j) => {
        if (j % 2 !== 0) return null;
        return (
          <Text key={t} position={[SURF_W / 2 + 0.35, -0.05, termToZ(j)]}
            fontSize={0.22} color="hsl(28, 100%, 55%)" rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
            anchorX="center" anchorY="top">
            {t}
          </Text>
        );
      })}
      <Text position={[SURF_W / 2 + 1.2, -0.05, 0]} fontSize={0.32} color="#e5e7eb"
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]} anchorX="center" anchorY="top">
        TERM
      </Text>
    </>
  );
}

function LegendScale({
  vibrance,
  intensity,
  stops,
  onClick,
}: {
  vibrance: number;
  intensity: number;
  stops: Stop[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Click to edit colors"
      className="flex items-center gap-1 hover:opacity-90 cursor-pointer group"
    >
      <span className="text-[9px] font-mono text-accent group-hover:text-accent">IV %</span>
      <div
        className="w-4 border border-transparent group-hover:border-accent transition-colors"
        style={{
          height: "clamp(64px, 28vh, 200px)",
          background: legendGradient(vibrance, intensity, stops),
        }}
      />
      <div
        className="flex flex-col justify-between text-[9px] font-mono text-accent"
        style={{ height: "clamp(64px, 28vh, 200px)" }}
      >
        <span>{IV_HI.toFixed(0)}</span>
        <span>{Math.round((IV_LO + IV_HI) / 2)}</span>
        <span>{IV_LO.toFixed(0)}</span>
      </div>
    </button>
  );
}

function LegendEditor({
  stops,
  setStops,
  vibrance,
  intensity,
  onClose,
}: {
  stops: Stop[];
  setStops: (s: Stop[]) => void;
  vibrance: number;
  intensity: number;
  onClose: () => void;
}) {
  const barRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ idx: number; startY: number; startT: number; moved: boolean } | null>(null);
  const [pickerIdx, setPickerIdx] = React.useState<number | null>(null);

  const onPointerDown = (idx: number) => (e: React.PointerEvent) => {
    if (idx === 0 || idx === stops.length - 1) {
      // pinned ends: click opens picker
      setPickerIdx(idx);
      return;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { idx, startY: e.clientY, startT: stops[idx].t, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > 3) d.moved = true;
    // top of bar = t=1, bottom = t=0
    let t = 1 - (e.clientY - rect.top) / rect.height;
    const prev = stops[d.idx - 1].t + 0.01;
    const next = stops[d.idx + 1].t - 0.01;
    t = Math.max(prev, Math.min(next, t));
    const ns = stops.map((s, i) => (i === d.idx ? { ...s, t } : s));
    setStops(ns);
  };
  const onPointerUp = (idx: number) => (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d && !d.moved) setPickerIdx(idx);
    dragRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const setStopColor = (idx: number, hex: string) => {
    const { h, s, l } = hexToHSL(hex);
    setStops(stops.map((st, i) => (i === idx ? { ...st, h, s, l } : st)));
  };

  const presets = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444", "#3b82f6", "#a855f7", "#ec4899"];
  const BAR_H = "clamp(180px, 50vh, 320px)";

  return (
    <div className="absolute top-3 left-[148px] z-30 bg-black/90 border border-accent p-3 flex flex-col gap-2 pointer-events-auto">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Edit Colors</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] font-mono text-muted-foreground hover:text-accent px-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex gap-3">
        {/* Gradient bar with handles */}
        <div className="relative flex items-stretch">
          <div
            ref={barRef}
            className="w-6 border border-border"
            style={{ height: BAR_H, background: legendGradient(vibrance, intensity, stops) }}
          />
          {stops.map((s, idx) => {
            const top = `calc(${(1 - s.t) * 100}% - 6px)`;
            const hex = hslToHex(s.h, s.s, s.l);
            const pinned = idx === 0 || idx === stops.length - 1;
            return (
              <div
                key={idx}
                onPointerDown={onPointerDown(idx)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp(idx)}
                className={`absolute left-7 flex items-center gap-1 ${pinned ? "cursor-pointer" : "cursor-ns-resize"}`}
                style={{ top, touchAction: "none" }}
                title={pinned ? "Click to recolor (position pinned)" : "Drag to reposition · click to recolor"}
              >
                <div
                  className="w-4 h-3 border border-border"
                  style={{ background: hex }}
                />
                <span className="text-[9px] font-mono text-muted-foreground">
                  {(s.t * 100).toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Right column: picker / reset */}
        <div className="flex flex-col justify-between gap-2 min-w-[140px]" style={{ height: BAR_H }}>
          {pickerIdx !== null ? (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-accent uppercase tracking-wider">
                Stop {pickerIdx + 1} color
              </span>
              <input
                type="color"
                value={hslToHex(stops[pickerIdx].h, stops[pickerIdx].s, stops[pickerIdx].l)}
                onChange={(e) => setStopColor(pickerIdx, e.target.value)}
                className="w-full h-8 cursor-pointer bg-transparent border border-border"
              />
              <div className="grid grid-cols-4 gap-1">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setStopColor(pickerIdx, p)}
                    className="w-6 h-6 border border-border hover:border-accent"
                    style={{ background: p }}
                    title={p}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPickerIdx(null)}
                className="text-[9px] font-mono text-muted-foreground hover:text-accent self-start"
              >
                ← back
              </button>
            </div>
          ) : (
            <span className="text-[9px] font-mono text-muted-foreground leading-tight">
              Drag middle handles to change how much each color dominates. Click any handle to recolor.
            </span>
          )}
          <button
            type="button"
            onClick={() => setStops(DEFAULT_STOPS.map((s) => ({ ...s })))}
            className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider border border-border hover:border-accent px-2 py-1 self-start"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}


function ControlSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-black/60 border border-border px-3 py-2">
      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider w-16">
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-[hsl(28,100%,55%)] cursor-pointer"
      />
      <span className="text-[10px] font-mono text-accent w-6 text-right">{value}</span>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 bg-black/60 border px-3 py-2 transition-colors ${
        active
          ? "border-accent text-accent"
          : "border-border text-muted-foreground hover:text-accent hover:border-accent"
      }`}
    >
      {icon}
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function HelpText() {
  return (
    <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-muted-foreground pointer-events-none">
      Drag to rotate · Scroll to zoom · Right-drag to pan
    </div>
  );
}

export default function Ovme3DSurface({ ticker = "SPY", redact = false, liveIvAt }: Props) {
  const [vibrance, setVibrance] = useState(65);
  const [intensity, setIntensity] = useState(50);
  const [autoRotate, setAutoRotate] = useState(false);
  const [hoverDetails, setHoverDetails] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [stops, setStops] = useState<Stop[]>(() => DEFAULT_STOPS.map((s) => ({ ...s })));
  const [editorOpen, setEditorOpen] = useState(false);
  return (
    <div className="card-terminal p-0 relative overflow-hidden">
      <div className="px-4 py-2 border-b border-border">
        <h3 className="text-sm font-mono font-bold text-accent uppercase tracking-wider">
          Volatility Surface — {ticker}
        </h3>
      </div>
      <div className="relative" style={{ height: 620, background: "#0a0a0a" }}>
        {redact ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-xs">
            •• REDACTED ••
          </div>
        ) : (
          <>
            {/* Top-left: clickable badge + (optional) legend */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-[120px]">
              <button
                type="button"
                onClick={() => setControlsVisible((v) => !v)}
                aria-pressed={controlsVisible}
                title={controlsVisible ? "Hide controls" : "Show controls"}
                className="border border-accent px-2 py-1 self-start flex-shrink-0 bg-black/60 hover:bg-accent/10 transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-accent tracking-wider uppercase whitespace-nowrap">
                  {ticker} IVOL Surface
                </span>
              </button>
              {controlsVisible && (
                <LegendScale
                  vibrance={vibrance}
                  intensity={intensity}
                  stops={stops}
                  onClick={() => setEditorOpen((v) => !v)}
                />
              )}
            </div>

            {controlsVisible && editorOpen && (
              <LegendEditor
                stops={stops}
                setStops={setStops}
                vibrance={vibrance}
                intensity={intensity}
                onClose={() => setEditorOpen(false)}
              />
            )}

            {controlsVisible && (
              <>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                  <ToolbarButton
                    active={autoRotate}
                    onClick={() => setAutoRotate((v) => !v)}
                    icon={<RotateCw className="w-3 h-3" />}
                    label="Auto-Rotate"
                  />
                  <ToolbarButton
                    active={hoverDetails}
                    onClick={() => setHoverDetails((v) => !v)}
                    icon={<Crosshair className="w-3 h-3" />}
                    label="Details"
                  />
                </div>
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                  <ControlSlider label="Intensity" value={intensity} onChange={setIntensity} />
                  <ControlSlider label="Vibrance" value={vibrance} onChange={setVibrance} />
                </div>
              </>
            )}

            <HelpText />
            <Canvas
              camera={{ position: [12, 7, 14], fov: 36 }}
              dpr={[1, 2]}
              style={{ cursor: hoverDetails ? "crosshair" : "default" }}
            >
              <color attach="background" args={["#0a0a0a"]} />
              <ambientLight intensity={1.0} />
              <Surface vibrance={vibrance} intensity={intensity} hoverDetails={hoverDetails} stops={stops} liveIvAt={liveIvAt} />

              <OrbitControls
                enablePan
                enableZoom
                enableRotate
                autoRotate={autoRotate}
                autoRotateSpeed={1.2}
                minDistance={6}
                maxDistance={40}
                target={[0, HEIGHT / 2, 0]}
              />
            </Canvas>
          </>
        )}
      </div>
    </div>
  );
}
