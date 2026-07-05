import { useState, useMemo } from 'react';
import {
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  useWeather, useAirQuality,
  wmoLabel, wmoIcon, wmoSeverity, cToF, aqiLabel, aqiColor, commodityImpact,
  FINANCIAL_CENTERS, COMMODITY_CITIES, ALL_CITIES,
  type CityWeather, type WeatherNow, type HourlyPoint, type DayForecast,
} from '@/hooks/useWeather';

// ── unit / format helpers ────────────────────────────────────────────────────

type Unit = 'F' | 'C';

function t(c: number, u: Unit) { return u === 'F' ? Math.round(cToF(c)) : Math.round(c); }
function tStr(c: number, u: Unit) { return `${t(c, u)}°`; }
function kmph(v: number) { return `${Math.round(v)} km/h`; }
function fmtHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDay(date: string) {
  const d = new Date(date + 'T12:00:00');
  return ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
}
function fmtSunTime(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtUpdated(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

const UV_LABEL = (v: number) => v <= 2 ? 'Low' : v <= 5 ? 'Moderate' : v <= 7 ? 'High' : v <= 10 ? 'Very High' : 'Extreme';
const UV_COLOR = (v: number) => v <= 2 ? 'text-positive' : v <= 5 ? 'text-[hsl(50,100%,55%)]' : v <= 7 ? 'text-accent' : 'text-negative';

// ── small shared components ───────────────────────────────────────────────────

function StatBox({ label, value, sub, valueClass = 'text-foreground' }: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="border border-border p-2 flex flex-col gap-0.5">
      <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={`text-[13px] font-mono font-bold tabular-nums leading-none ${valueClass}`}>{value}</span>
      {sub && <span className="text-[8px] font-mono text-muted-foreground">{sub}</span>}
    </div>
  );
}

function SevDot({ code }: { code: number }) {
  const s = wmoSeverity(code);
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
      s === 'danger' ? 'bg-negative animate-pulse' : s === 'warn' ? 'bg-accent' : 'bg-positive'
    }`} />
  );
}

// ── wind compass ─────────────────────────────────────────────────────────────

function WindCompass({ deg, size = 72 }: { deg: number; size?: number }) {
  const r = size / 2 - 2;
  const cx = size / 2, cy = size / 2;
  const rad = (deg - 90) * Math.PI / 180;
  const tipX = cx + Math.cos(rad) * r * 0.72;
  const tipY = cy + Math.sin(rad) * r * 0.72;
  const tailX = cx - Math.cos(rad) * r * 0.38;
  const tailY = cy - Math.sin(rad) * r * 0.38;
  // arrowhead
  const ah = 8;
  const leftRad = rad + Math.PI * 0.75;
  const rightRad = rad - Math.PI * 0.75;
  const lx = tipX + Math.cos(leftRad) * ah;
  const ly = tipY + Math.sin(leftRad) * ah;
  const rx = tipX + Math.cos(rightRad) * ah;
  const ry = tipY + Math.sin(rightRad) * ah;
  const cardinals = ['N', 'E', 'S', 'W'];
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={2} fill="hsl(var(--muted-foreground))" />
      {cardinals.map((d, i) => {
        const a = i * 90 * Math.PI / 180 - Math.PI / 2;
        return (
          <text key={d} x={cx + Math.cos(a) * (r - 9)} y={cy + Math.sin(a) * (r - 9)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{d}</text>
        );
      })}
      <line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" />
      <polygon points={`${tipX},${tipY} ${lx},${ly} ${rx},${ry}`} fill="hsl(var(--accent))" />
    </svg>
  );
}

// ── city selector tab bar ─────────────────────────────────────────────────────

function CityTabs({
  cities, selected, onSelect, data,
}: { cities: typeof FINANCIAL_CENTERS; selected: string; onSelect: (k: string) => void; data: Record<string, CityWeather> }) {
  return (
    <div className="flex overflow-x-auto border-b border-border bg-surface-deep" style={{ scrollbarWidth: 'none' }}>
      {cities.map(c => {
        const cw = data[c.key];
        const now = cw?.now;
        const active = selected === c.key;
        const sev = now ? wmoSeverity(now.code) : 'ok';
        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            className={`flex flex-col items-start px-3 py-1.5 border-r border-border shrink-0 transition-colors text-left ${
              active ? 'bg-surface-elevated border-b-2 border-b-accent' : 'hover:bg-surface-elevated/60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono font-bold text-accent">{c.key}</span>
              {sev !== 'ok' && <SevDot code={now?.code ?? 0} />}
            </div>
            <div className="text-[9px] font-mono text-foreground">{c.name}</div>
            {now && (
              <div className="text-[8px] font-mono text-muted-foreground tabular-nums">
                {wmoIcon(now.code, now.is_day)} —
              </div>
            )}
            {!now && cw?.error && <div className="text-[7px] text-negative font-mono">ERR</div>}
          </button>
        );
      })}
    </div>
  );
}

// ── OVERVIEW tab ─────────────────────────────────────────────────────────────

function OverviewTab({ cw, unit }: { cw: CityWeather; unit: Unit }) {
  const now = cw.now;
  const { aq, aqLoading } = useAirQuality(cw.city.lat, cw.city.lon, !!now);
  const today = cw.days[0];

  if (!now) return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono">
      {cw.error ? `Error: ${cw.error}` : 'Loading…'}
    </div>
  );

  return (
    <div className="flex flex-col gap-0 overflow-y-auto flex-1 min-h-0">

      {/* Hero strip */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-border bg-surface-primary">
        <div className="flex items-end gap-3">
          <span className="text-6xl leading-none font-mono font-bold text-foreground tabular-nums">
            {tStr(now.temp_c, unit)}
          </span>
          <div className="flex flex-col gap-0.5 mb-1">
            <span className="text-[28px] leading-none">{wmoIcon(now.code, now.is_day)}</span>
          </div>
        </div>
        <div className="border-l border-border pl-5 flex flex-col gap-1">
          <span className="text-[11px] font-mono font-bold text-foreground">{wmoLabel(now.code)}</span>
          <span className="text-[9px] font-mono text-muted-foreground">Feels like {tStr(now.feels_c, unit)}</span>
          <span className="text-[9px] font-mono text-muted-foreground">
            High {tStr(today?.max_c ?? now.temp_c, unit)} · Low {tStr(today?.min_c ?? now.temp_c, unit)}
          </span>
          {cw.city.exchange && (
            <span className="text-[8px] font-mono text-accent mt-1">{cw.city.exchange}</span>
          )}
        </div>
        <div className="border-l border-border pl-5 flex flex-col gap-0.5 text-[9px] font-mono">
          <span className="text-muted-foreground">Sunrise <span className="text-foreground">{fmtSunTime(today?.sunrise ?? '')}</span></span>
          <span className="text-muted-foreground">Sunset  <span className="text-foreground">{fmtSunTime(today?.sunset ?? '')}</span></span>
          {today && <span className="text-muted-foreground">Day length <span className="text-foreground">
            {(() => {
              try {
                const diff = new Date(today.sunset).getTime() - new Date(today.sunrise).getTime();
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return `${h}h ${m}m`;
              } catch { return '—'; }
            })()}
          </span></span>}
        </div>
        <div className="border-l border-border pl-5 grid grid-cols-2 gap-x-8 gap-y-0.5 text-[9px] font-mono">
          {[
            { l: 'Humidity',   v: `${now.humidity}%` },
            { l: 'Dew Pt',     v: `${tStr(now.dew_c, unit)}` },
            { l: 'Pressure',   v: `${Math.round(now.pressure_hpa)} hPa` },
            { l: 'Visibility', v: `${now.visibility_km.toFixed(1)} km` },
          ].map(s => (
            <div key={s.l}>
              <span className="text-muted-foreground">{s.l} </span>
              <span className="text-foreground font-bold">{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border-b border-border">
        <StatBox label="Wind Speed"  value={kmph(now.wind_kph)}  sub={`From ${now.wind_dir}`} />
        <StatBox label="Wind Gusts"  value={kmph(now.gust_kph)}  sub={`Direction ${now.wind_deg}°`} />
        <StatBox label="Humidity"    value={`${now.humidity}%`}   sub={`Dew ${tStr(now.dew_c, unit)}`} />
        <StatBox label="Cloud Cover" value={`${now.cloud}%`}      sub={now.cloud < 30 ? 'Mostly clear' : now.cloud < 70 ? 'Partly cloudy' : 'Overcast'} />
        <StatBox label="UV Index"    value={`${now.uv.toFixed(1)}`} sub={UV_LABEL(now.uv)} valueClass={UV_COLOR(now.uv)} />
        <StatBox label="Pressure"    value={`${Math.round(now.pressure_hpa)}`} sub="hPa" />
      </div>

      {/* Wind compass + air quality side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-border">

        {/* Wind panel */}
        <div className="border-r border-border p-3 flex items-center gap-4">
          <WindCompass deg={now.wind_deg} size={88} />
          <div className="flex flex-col gap-1 text-[9px] font-mono">
            <div className="text-[7px] text-accent font-bold uppercase tracking-widest mb-1">Wind Detail</div>
            {[
              { l: 'Speed',     v: kmph(now.wind_kph) },
              { l: 'Gusts',     v: kmph(now.gust_kph) },
              { l: 'Direction', v: `${now.wind_dir} (${now.wind_deg}°)` },
              today && { l: 'Day Max', v: kmph(today.wind_max_kph) },
              today && { l: 'Day Gust', v: kmph(today.gust_max_kph) },
            ].filter(Boolean).map((s: any) => (
              <div key={s.l} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{s.l}</span>
                <span className="text-foreground font-bold">{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Air quality */}
        <div className="border-r border-border p-3 flex flex-col gap-2">
          <div className="text-[7px] text-accent font-bold uppercase tracking-widest">Air Quality (US AQI)</div>
          {aqLoading && <span className="text-[8px] text-muted-foreground animate-pulse">Loading…</span>}
          {aq && (
            <>
              <div className="flex items-end gap-2">
                <span className={`text-[28px] font-mono font-bold tabular-nums leading-none ${aqiColor(aq.us_aqi ?? 0)}`}>
                  {aq.us_aqi ?? '—'}
                </span>
                <span className={`text-[10px] font-mono mb-1 ${aqiColor(aq.us_aqi ?? 0)}`}>
                  {aqiLabel(aq.us_aqi ?? 0)}
                </span>
              </div>
              {/* AQI bar */}
              <div className="w-full h-2 rounded-sm overflow-hidden flex">
                {[50,50,50,50,100,Infinity].map((seg, i) => {
                  const colors = ['bg-positive','bg-[hsl(50,100%,55%)]','bg-accent','bg-[hsl(15,100%,55%)]','bg-negative','bg-[hsl(300,60%,40%)]'];
                  return <div key={i} className={`flex-1 h-full ${colors[i]} opacity-${i * 15 + 30}`} />;
                })}
              </div>
              <div className="relative h-1">
                <div className="absolute top-0 h-1 w-1 bg-foreground rounded-full"
                  style={{ left: `${Math.min(99, ((aq.us_aqi ?? 0) / 300) * 100)}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[8px] font-mono mt-1">
                {[
                  { l: 'PM2.5', v: aq.pm2_5 != null ? `${aq.pm2_5.toFixed(1)} µg/m³` : '—' },
                  { l: 'PM10',  v: aq.pm10  != null ? `${aq.pm10.toFixed(1)} µg/m³` : '—' },
                  { l: 'O₃',   v: aq.o3    != null ? `${aq.o3.toFixed(1)} µg/m³` : '—' },
                  { l: 'NO₂',  v: aq.no2   != null ? `${aq.no2.toFixed(1)} µg/m³` : '—' },
                ].map(s => (
                  <div key={s.l}><span className="text-muted-foreground">{s.l} </span><span className="text-foreground">{s.v}</span></div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Precip summary */}
        <div className="p-3 flex flex-col gap-2">
          <div className="text-[7px] text-accent font-bold uppercase tracking-widest">Precipitation</div>
          <div className="flex flex-col gap-1 text-[9px] font-mono">
            {[
              { l: 'Current',    v: `${now.precip_mm.toFixed(1)} mm` },
              today && { l: 'Day Total',  v: `${today.precip_mm.toFixed(1)} mm` },
              today && { l: 'Prob (day)', v: `${today.precip_prob}%` },
              today && { l: 'Rain hours', v: `${today.precip_hours}h` },
              { l: 'Humidity',   v: `${now.humidity}%` },
              { l: 'Visibility', v: `${now.visibility_km.toFixed(1)} km` },
            ].filter(Boolean).map((s: any) => (
              <div key={s.l} className="flex justify-between">
                <span className="text-muted-foreground">{s.l}</span>
                <span className="text-foreground font-bold">{s.v}</span>
              </div>
            ))}
          </div>
          {today && (
            <div className="mt-1">
              <div className="flex justify-between text-[7px] font-mono text-muted-foreground mb-0.5">
                <span>PRECIP PROBABILITY</span>
                <span>{today.precip_prob}%</span>
              </div>
              <div className="w-full h-[3px] bg-border overflow-hidden">
                <div className="h-full bg-[hsl(210,80%,55%)]" style={{ width: `${today.precip_prob}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7-day forecast */}
      <div>
        <div className="flex items-center px-3 py-1 border-b border-border bg-surface-deep">
          <span className="text-[7px] font-mono font-bold text-accent uppercase tracking-widest">7-Day Forecast</span>
        </div>
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `repeat(${cw.days.length}, 1fr)` }}>
          {cw.days.map(d => (
            <div key={d.date} className="border-r border-border last:border-r-0 px-2 py-2 flex flex-col gap-1 items-center">
              <span className="text-[8px] font-mono font-bold text-accent">{fmtDay(d.date)}</span>
              <span className="text-[8px] font-mono text-muted-foreground">{d.date.slice(5)}</span>
              <span className="text-[18px] my-0.5">{wmoIcon(d.code)}</span>
              <span className="text-[8px] font-mono text-muted-foreground text-center leading-tight">{wmoLabel(d.code)}</span>
              <div className="flex gap-1 text-[9px] font-mono">
                <span className="text-foreground font-bold">{tStr(d.max_c, unit)}</span>
                <span className="text-muted-foreground">{tStr(d.min_c, unit)}</span>
              </div>
              <div className="w-full mt-0.5">
                <div className="flex justify-between text-[6px] font-mono text-muted-foreground">
                  <span>💧</span><span>{d.precip_prob}%</span>
                </div>
                <div className="w-full h-[2px] bg-border mt-0.5">
                  <div className="h-full bg-[hsl(210,80%,55%)]" style={{ width: `${d.precip_prob}%` }} />
                </div>
              </div>
              {d.precip_mm > 0.5 && <span className="text-[7px] font-mono text-[hsl(210,80%,60%)]">{d.precip_mm.toFixed(1)}mm</span>}
              <div className="text-[6px] font-mono text-muted-foreground">UV {d.uv_max.toFixed(0)}</div>
              <div className="text-[6px] font-mono text-muted-foreground">{kmph(d.wind_max_kph)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HOURLY tab ───────────────────────────────────────────────────────────────

function HourlyTab({ cw, unit }: { cw: CityWeather; unit: Unit }) {
  const pts = cw.hourly;
  if (!pts.length) return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono">No hourly data</div>
  );

  const chartData = pts.map(h => ({
    time:      fmtHour(h.time),
    temp:      t(h.temp_c, unit),
    feels:     t(h.feels_c, unit),
    precip:    h.precip_prob,
    wind:      Math.round(h.wind_kph),
    gust:      Math.round(h.gust_kph),
    humidity:  h.humidity,
  }));

  const tempMin = Math.min(...chartData.map(d => d.temp)) - 2;
  const tempMax = Math.max(...chartData.map(d => d.temp)) + 2;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Chart */}
      <div className="h-[200px] border-b border-border p-2 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} interval={3} tickLine={false} axisLine={false} />
            <YAxis yAxisId="temp" domain={[tempMin, tempMax]} tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}°`} width={28} axisLine={false} tickLine={false} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} width={28} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 }}
              labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <ReferenceLine yAxisId="pct" y={50} stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <Area yAxisId="pct" dataKey="precip" fill="hsl(210 80% 55% / 0.18)" stroke="hsl(210,80%,55%)" strokeWidth={1} name="Precip %" dot={false} />
            <Line yAxisId="temp" dataKey="temp" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name={`Temp °${unit}`} />
            <Line yAxisId="temp" dataKey="feels" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Feels like" />
            <Line yAxisId="pct" dataKey="humidity" stroke="hsl(185,70%,50%)" strokeWidth={1} strokeDasharray="2 2" dot={false} name="Humidity %" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex text-[7px] font-mono text-muted-foreground border-b border-border px-2 py-[2px] bg-surface-deep sticky top-0">
          {['TIME','','CONDITIONS','TEMP','FEELS','PRECIP%','PRECIP','WIND','GUST','HUM%','CLOUD','VIS','PRES','UV'].map(h => (
            <span key={h} className={`${h === 'CONDITIONS' ? 'flex-1' : h === 'TIME' ? 'w-12' : h === '' ? 'w-5 text-center' : 'w-14 text-right'} shrink-0`}>{h}</span>
          ))}
        </div>
        {pts.map((h, i) => (
          <div key={h.time} className={`flex items-center px-2 py-[2px] border-b border-border text-[8px] font-mono ${i % 2 === 0 ? '' : 'bg-surface-elevated/20'} hover:bg-white/[0.03]`}>
            <span className="w-12 shrink-0 text-accent font-bold">{fmtHour(h.time)}</span>
            <span className="w-5 shrink-0 text-center">{wmoIcon(h.code)}</span>
            <span className="flex-1 text-muted-foreground truncate">{wmoLabel(h.code)}</span>
            <span className="w-14 text-right shrink-0 text-foreground font-bold">{tStr(h.temp_c, unit)}</span>
            <span className="w-14 text-right shrink-0 text-muted-foreground">{tStr(h.feels_c, unit)}</span>
            <span className={`w-14 text-right shrink-0 ${h.precip_prob > 60 ? 'text-[hsl(210,80%,60%)]' : 'text-foreground'}`}>{h.precip_prob}%</span>
            <span className="w-14 text-right shrink-0 text-muted-foreground">{h.precip_mm.toFixed(1)}mm</span>
            <span className="w-14 text-right shrink-0 text-foreground">{Math.round(h.wind_kph)}</span>
            <span className="w-14 text-right shrink-0 text-muted-foreground">{Math.round(h.gust_kph)}</span>
            <span className="w-14 text-right shrink-0 text-foreground">{h.humidity}%</span>
            <span className="w-14 text-right shrink-0 text-muted-foreground">{h.cloud}%</span>
            <span className="w-14 text-right shrink-0 text-muted-foreground">{h.visibility_km.toFixed(1)}km</span>
            <span className="w-14 text-right shrink-0 text-muted-foreground">{Math.round(h.pressure_hpa)}</span>
            <span className={`w-14 text-right shrink-0 ${UV_COLOR(h.uv)}`}>{h.uv.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COMPARE tab ───────────────────────────────────────────────────────────────

function CompareTab({ data, cities, unit }: { data: Record<string, CityWeather>; cities: typeof FINANCIAL_CENTERS; unit: Unit }) {
  const cols = ['CITY', 'TEMP', 'FEELS', 'CONDITIONS', 'WIND', 'GUST', 'HUM%', 'CLOUD%', 'PRECIP', 'PRES', 'VIS', 'UV'];
  const rows = cities.map(c => ({ c, cw: data[c.key] })).filter(r => r.cw?.now);

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="min-w-[700px]">
        <div className="flex text-[7px] font-mono text-muted-foreground border-b border-border px-2 py-[2px] bg-surface-deep sticky top-0">
          {cols.map((h, i) => (
            <span key={h} className={`shrink-0 ${i === 0 ? 'w-36' : i === 3 ? 'flex-1' : 'w-20 text-right'}`}>{h}</span>
          ))}
        </div>
        {rows.map(({ c, cw }) => {
          const n = cw.now!;
          return (
            <div key={c.key} className="flex items-center px-2 py-[3px] border-b border-border hover:bg-white/[0.03] text-[9px] font-mono">
              <div className="w-36 shrink-0">
                <div className="font-bold text-accent">{c.key} · {c.name}</div>
                {c.exchange && <div className="text-[7px] text-muted-foreground">{c.exchange}</div>}
              </div>
              <span className="w-20 text-right shrink-0 text-foreground font-bold tabular-nums">{tStr(n.temp_c, unit)}</span>
              <span className="w-20 text-right shrink-0 text-muted-foreground tabular-nums">{tStr(n.feels_c, unit)}</span>
              <div className="flex-1 flex items-center gap-1">
                <span>{wmoIcon(n.code, n.is_day)}</span>
                <span className="text-muted-foreground truncate">{wmoLabel(n.code)}</span>
              </div>
              <span className="w-20 text-right shrink-0 text-foreground">{Math.round(n.wind_kph)} km/h</span>
              <span className="w-20 text-right shrink-0 text-muted-foreground">{Math.round(n.gust_kph)}</span>
              <span className="w-20 text-right shrink-0 text-foreground">{n.humidity}%</span>
              <span className="w-20 text-right shrink-0 text-muted-foreground">{n.cloud}%</span>
              <span className="w-20 text-right shrink-0 text-muted-foreground">{n.precip_mm.toFixed(1)}mm</span>
              <span className="w-20 text-right shrink-0 text-muted-foreground">{Math.round(n.pressure_hpa)}</span>
              <span className="w-20 text-right shrink-0 text-muted-foreground">{n.visibility_km.toFixed(1)}km</span>
              <span className={`w-20 text-right shrink-0 ${UV_COLOR(n.uv)}`}>{n.uv.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── COMMODITIES tab ───────────────────────────────────────────────────────────

function CommoditiesTab({ data, unit }: { data: Record<string, CityWeather>; unit: Unit }) {
  const impactColor = (l: 'HIGH' | 'MED' | 'LOW') =>
    l === 'HIGH' ? 'text-negative' : l === 'MED' ? 'text-accent' : 'text-positive';
  const impactBg = (l: 'HIGH' | 'MED' | 'LOW') =>
    l === 'HIGH' ? 'bg-negative/10 border-negative/30' : l === 'MED' ? 'bg-accent/10 border-accent/30' : 'bg-positive/10 border-positive/30';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Alert banner for HIGH impacts */}
      {(() => {
        const highs = COMMODITY_CITIES
          .map(c => ({ c, cw: data[c.key], impact: commodityImpact(c, data[c.key]?.now ?? null) }))
          .filter(r => r.impact?.level === 'HIGH');
        if (!highs.length) return null;
        return (
          <div className="border-b border-negative/40 bg-negative/10 px-3 py-1.5 flex items-start gap-2">
            <span className="text-negative text-[9px] font-mono font-bold shrink-0">⚠ HIGH IMPACT</span>
            <div className="flex flex-col gap-0.5">
              {highs.map(r => (
                <span key={r.c.key} className="text-[8px] font-mono text-negative">
                  {r.c.key} {r.c.name} — {r.impact!.note}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Column headers */}
      <div className="flex text-[7px] font-mono text-muted-foreground border-b border-border px-2 py-[2px] bg-surface-deep sticky top-0">
        {['LOC','REGION','COMMODITY','TEMP','CONDITIONS','WIND','PRECIP','IMPACT','NOTES'].map((h, i) => (
          <span key={h} className={`shrink-0 ${
            i === 0 ? 'w-10' :
            i === 1 ? 'w-28' :
            i === 2 ? 'w-32' :
            i === 3 ? 'w-16 text-right' :
            i === 4 ? 'w-28' :
            i === 5 ? 'w-24' :
            i === 6 ? 'w-20 text-right' :
            i === 7 ? 'w-12' :
            'flex-1'
          }`}>{h}</span>
        ))}
      </div>

      {COMMODITY_CITIES.map(city => {
        const cw = data[city.key];
        const now = cw?.now;
        const impact = commodityImpact(city, now ?? null);
        return (
          <div key={city.key} className="border-b border-border hover:bg-white/[0.02]">
            <div className="flex items-center px-2 py-[4px] text-[9px] font-mono">
              <span className="w-10 shrink-0 font-bold text-accent">{city.key}</span>
              <span className="w-28 shrink-0 text-foreground">{city.name}</span>
              <span className="w-32 shrink-0 text-muted-foreground">{city.commodity}</span>
              <span className="w-16 text-right shrink-0 text-foreground font-bold tabular-nums">
                {now ? tStr(now.temp_c, unit) : '—'}
              </span>
              <div className="w-28 shrink-0 flex items-center gap-1">
                {now && <span>{wmoIcon(now.code, now.is_day)}</span>}
                <span className="text-muted-foreground truncate">{now ? wmoLabel(now.code) : '—'}</span>
              </div>
              <span className="w-24 shrink-0 text-muted-foreground">{now ? `${Math.round(now.wind_kph)} km/h ${now.wind_dir}` : '—'}</span>
              <span className="w-20 text-right shrink-0 text-muted-foreground">{now ? `${now.precip_mm.toFixed(1)}mm` : '—'}</span>
              {impact && (
                <>
                  <span className={`w-12 shrink-0 text-[8px] font-bold ${impactColor(impact.level)}`}>{impact.level}</span>
                  <span className={`flex-1 text-[8px] font-mono px-1.5 py-0.5 border ${impactBg(impact.level)} ${impactColor(impact.level)}`}>
                    {impact.note}
                  </span>
                </>
              )}
            </div>
            {/* 7-day temp range for this commodity city */}
            {cw?.days?.length > 0 && (
              <div className="flex px-2 pb-1.5 gap-0.5 pl-10">
                {cw.days.slice(0, 7).map(d => (
                  <div key={d.date} className="flex flex-col items-center min-w-0 flex-1 border border-border/40 py-0.5">
                    <span className="text-[6px] font-mono text-muted-foreground">{fmtDay(d.date).slice(0,2)}</span>
                    <span className="text-[8px]">{wmoIcon(d.code)}</span>
                    <span className="text-[7px] font-mono text-foreground">{tStr(d.max_c, unit)}</span>
                    <span className="text-[7px] font-mono text-muted-foreground">{tStr(d.min_c, unit)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── main view ────────────────────────────────────────────────────────────────

type WxTab = 'overview' | 'hourly' | 'compare' | 'commodities';

export default function WeatherView() {
  const { data, loading, lastFetch } = useWeather();
  const [unit, setUnit] = useState<Unit>('F');
  const [tab, setTab] = useState<WxTab>('overview');
  const [section, setSection] = useState<'financial' | 'commodity'>('financial');
  const cities = section === 'financial' ? FINANCIAL_CENTERS : COMMODITY_CITIES;
  const [selectedKey, setSelectedKey] = useState(FINANCIAL_CENTERS[0].key);

  const selectedCw = data[selectedKey];

  // Alerts: any city with severe conditions
  const alerts = useMemo(() => ALL_CITIES
    .map(c => data[c.key])
    .filter(cw => cw?.now && wmoSeverity(cw.now.code) !== 'ok'),
    [data]);

  const TABS: { id: WxTab; label: string }[] = [
    { id: 'overview',    label: 'OVERVIEW' },
    { id: 'hourly',      label: 'HOURLY' },
    { id: 'compare',     label: 'COMPARE' },
    { id: 'commodities', label: 'COMMODITIES' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background font-mono">

      {/* ── Header ── */}
      <div className="flex items-center gap-0 border-b border-border bg-surface-deep shrink-0 h-[28px]">
        <div className="flex items-center gap-2 px-3 border-r border-border h-full">
          <span className="text-[9px] font-bold text-accent tracking-widest">WXTR</span>
          <span className="text-[9px] text-muted-foreground">Weather Intelligence Terminal</span>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 border-r border-border h-full bg-negative/10">
            <span className="w-1.5 h-1.5 rounded-full bg-negative animate-pulse shrink-0" />
            <span className="text-[8px] font-mono text-negative">{alerts.length} WEATHER ALERT{alerts.length > 1 ? 'S' : ''}</span>
          </div>
        )}
        <div className="flex items-center h-full border-r border-border ml-auto">
          {(['F', 'C'] as const).map(u => (
            <button key={u} onClick={() => setUnit(u)}
              className={`px-3 h-full text-[9px] font-bold border-r border-border transition-colors ${
                unit === u ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>°{u}</button>
          ))}
        </div>
        <div className="px-3 flex items-center gap-2 h-full">
          {loading && <span className="text-[7px] text-muted-foreground animate-pulse uppercase tracking-wider">FETCHING…</span>}
          {lastFetch && !loading && (
            <span className="text-[7px] text-muted-foreground uppercase tracking-wider">
              UPD {fmtUpdated(lastFetch)} · OPEN-METEO
            </span>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-stretch border-b border-border bg-surface-deep shrink-0 h-[24px]">
        {TABS.map(t2 => (
          <button key={t2.id} onClick={() => setTab(t2.id)}
            className={`px-4 h-full text-[9px] font-bold uppercase tracking-wide border-r border-border transition-colors ${
              tab === t2.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}>{t2.label}</button>
        ))}
        {(tab === 'overview' || tab === 'hourly') && (
          <div className="flex items-center ml-4 gap-0">
            {(['financial', 'commodity'] as const).map(s => (
              <button key={s} onClick={() => {
                setSection(s);
                setSelectedKey((s === 'financial' ? FINANCIAL_CENTERS : COMMODITY_CITIES)[0].key);
              }}
                className={`px-3 h-full text-[8px] uppercase tracking-wide border-r border-border transition-colors ${
                  section === s ? 'text-accent font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}>{s === 'financial' ? 'Fin. Centers' : 'Commodities'}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── City tabs (for overview + hourly) ── */}
      {(tab === 'overview' || tab === 'hourly') && (
        <CityTabs cities={cities} selected={selectedKey} onSelect={setSelectedKey} data={data} />
      )}

      {/* ── Tab content ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {tab === 'overview' && selectedCw && <OverviewTab cw={selectedCw} unit={unit} />}
        {tab === 'overview' && !selectedCw && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px]">
            {loading ? 'Loading…' : 'Select a city'}
          </div>
        )}
        {tab === 'hourly' && selectedCw && <HourlyTab cw={selectedCw} unit={unit} />}
        {tab === 'compare' && <CompareTab data={data} cities={FINANCIAL_CENTERS} unit={unit} />}
        {tab === 'commodities' && <CommoditiesTab data={data} unit={unit} />}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-border px-3 py-0.5 bg-surface-deep flex items-center justify-between shrink-0">
        <span className="text-[6px] text-muted-foreground uppercase tracking-widest">
          Source: Open-Meteo API (CC BY 4.0) · WMO Weather Codes · Refreshes every 30 min
        </span>
        <span className="text-[6px] text-muted-foreground">WXTR &lt;GO&gt;</span>
      </div>
    </div>
  );
}
