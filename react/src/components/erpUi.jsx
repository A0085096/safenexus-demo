import React from 'react';
import { until, fmtDate, R, num } from '../erp/seed.js';
import { SERIES } from '../theme.js';
import { Badge } from './ui.jsx';
import Sparkline from '../charts/Sparkline.jsx';

/* ══════════════════════════════════════════════════════════════
   The pieces every ERP register needs and none of them should
   spell out for itself: a KPI strip, an expiry that reads as
   days rather than a date, a money cell, a bar that carries a
   share, and a breakdown list.
   ══════════════════════════════════════════════════════════════ */

/* ── KPI strip ──────────────────────────────────────────────── */
export function Kpis({ items, cols }) {
  return (
    <div className="kpis" style={cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
      {items.map((k) => (
        <div className="kpi" key={k.l}>
          <div className="kpi-lbl">{k.icon && <k.icon size={14} strokeWidth={1.8} />}{k.l}</div>
          <div className="kpi-row">
            <span className="kpi-val">{k.v}</span>
            {k.unit && <span className="kpi-unit">{k.unit}</span>}
            {k.series && <span className="kpi-spark"><Sparkline values={k.series} color={k.tone || SERIES[0]} /></span>}
          </div>
          <div className="kpi-foot">
            {k.delta && <span className={'delta ' + (k.dir || 'flat')}>{k.delta}</span>}
            {k.note && <span className="kpi-note">{k.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── an expiry, read as time left ───────────────────────────────
   A date tells you nothing without today in your head. Days do. */
export const dayTone = (d) => (d < 0 ? 'red' : d < 30 ? 'gold' : d < 90 ? 'blue' : 'green');

export function Expiry({ date, showDate = true }) {
  if (!date) return <span style={{ color: 'var(--text3)' }}>—</span>;
  const d = until(date);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
      {showDate && <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>{fmtDate(date)}</span>}
      <Badge tone={dayTone(d)}>{d < 0 ? `${-d}d over` : `${d}d`}</Badge>
    </span>
  );
}

/* ── money ──────────────────────────────────────────────────── */
export const Money = ({ v, tone, bold }) => (
  <span style={{
    fontFamily: 'var(--num)',
    color: tone === 'good' ? 'var(--green)' : tone === 'bad' ? 'var(--red)' : undefined,
    fontWeight: bold ? 600 : undefined,
  }}>{R(v)}</span>
);

/* a signed figure, where the sign is the point */
export const Signed = ({ v, money = true }) => (
  <span style={{ fontFamily: 'var(--num)', fontWeight: 600, color: v >= 0 ? 'var(--green)' : 'var(--red)' }}>
    {v >= 0 ? '' : '−'}{money ? R(Math.abs(v)) : num(Math.abs(v))}
  </span>
);

/* ── a share of something, in the cell ──────────────────────── */
export function Bar({ value, max, target, colour, label, width = 78 }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="cellbar">
      <div className="track" style={{ width }}>
        <div className="fill" style={{ width: pct + '%', background: colour || SERIES[0] }} />
        {target != null && max ? <div className="thresh" style={{ left: Math.min(100, (target / max) * 100) + '%' }} /> : null}
      </div>
      <span className="pct" style={{ color: colour || 'var(--text2)' }}>{label}</span>
    </div>
  );
}

/* ── a breakdown, as rows of bars ───────────────────────────────
   Ranked, because the order is the finding. */
export function Breakdown({ rows, format = num, colour }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="brk">
      {rows.map((r, i) => (
        <div className="brk-row" key={r.k} onClick={r.onClick} style={r.onClick ? { cursor: 'pointer' } : undefined}>
          <span className="brk-k" title={r.k}>{r.k}</span>
          <span className="brk-track">
            <span className="brk-fill" style={{ width: (r.v / max) * 100 + '%', background: r.c || colour || SERIES[i % SERIES.length] }} />
          </span>
          <span className="brk-v">{format(r.v)}</span>
        </div>
      ))}
      {!rows.length && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>Nothing to show.</div>}
    </div>
  );
}

/* ── a totals row for a grid footer ─────────────────────────── */
export const Total = ({ label, cols, values }) => (
  <>
    <td colSpan={cols} style={{ fontWeight: 600 }}>{label}</td>
    {values.map((v, i) => <td key={i} className="num" style={{ fontWeight: 600 }}>{v}</td>)}
  </>
);

/* ── an empty state that says what to do next ───────────────── */
export const Blank = ({ icon: Icon, text, hint }) => (
  <div style={{ padding: '38px 20px', textAlign: 'center', color: 'var(--text3)' }}>
    {Icon && <Icon size={26} strokeWidth={1.5} style={{ opacity: 0.5 }} />}
    <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text2)' }}>{text}</div>
    {hint && <div style={{ fontSize: 11.5, marginTop: 3 }}>{hint}</div>}
  </div>
);
