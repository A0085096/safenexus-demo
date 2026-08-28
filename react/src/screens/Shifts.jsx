import React, { useMemo } from 'react';
import {
  Timer, Plus, CheckCircle2, Gauge, TrendingUp, Activity, AlertTriangle, Boxes, Clock,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RLegend,
} from 'recharts';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Breakdown, Bar } from '../components/erpUi.jsx';
import { num, fmtShort, iso, TODAY, DAY } from '../erp/seed.js';
import { DELAY_CODES, isoAdd, TODAY_ISO } from '../erp/workforce.js';
import { rechartsTip } from '../charts/tooltip.jsx';

/* ══════════════════════════════════════════════════════════════
   Shifts.

   The pre-use sheet says whether a machine may work. The shift log
   says what it did once it was allowed to. Those two numbers —
   availability, the share of scheduled time the machine was fit to
   work, and utilisation, the share of that time it actually worked
   — are what decide whether a mine needs another machine or just
   needs to fix the one it has.

   The delay code is the part that earns the paperwork. Hours lost
   without a reason cannot be argued about at the morning meeting.
   ══════════════════════════════════════════════════════════════ */
export default function Shifts({ run, openDialog }) {
  const { shifts, selection, select, subView, setView } = useStore();
  const view = subView.shifts || 'log';

  const avail = shifts.length ? Math.round(shifts.reduce((a, s) => a + s.availability, 0) / shifts.length) : 0;
  const util = shifts.length ? Math.round(shifts.reduce((a, s) => a + s.utilisation, 0) / shifts.length) : 0;
  const lost = shifts.reduce((a, s) => a + s.lost, 0);
  const worked = shifts.reduce((a, s) => a + s.worked, 0);
  const unsigned = shifts.filter((s) => !s.signedOff);

  const cols = [
    { key: 'ref', label: 'Shift', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'd', label: 'Date', value: (r) => r.date, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtShort(r.date)}</span> },
    { key: 's', label: 'Shift', value: (r) => r.shift, render: (r) => <Badge tone={r.shift === 'Night' ? 'purple' : 'blue'}>{r.shift}</Badge> },
    { key: 'v', label: 'Machine', wrap: true, value: (r) => r.vehicle, render: (r) => (
      <div><div style={{ fontWeight: 600, fontFamily: 'var(--num)' }}>{r.vehicle}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.fleetNo} · {r.type}</div></div>
    ) },
    { key: 'op', label: 'Operator', value: (r) => r.operator, render: (r) => r.operator },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'm', label: 'Meter', num: true, value: (r) => r.meterEnd, render: (r) => (
      <span style={{ fontFamily: 'var(--num)', fontSize: 11.5, color: 'var(--text2)' }}>
        {num(r.meterStart)} → <b style={{ color: 'var(--text)' }}>{num(r.meterEnd)}</b>
      </span>
    ) },
    { key: 'w', label: 'Worked', num: true, value: (r) => r.worked, render: (r) => <span style={{ fontFamily: 'var(--num)' }}>{r.worked} h</span> },
    { key: 'l', label: 'Lost', num: true, value: (r) => r.lost,
      render: (r) => <span style={{ fontFamily: 'var(--num)', color: r.lost > 2 ? 'var(--red)' : 'var(--text2)' }}>{r.lost} h</span> },
    { key: 'dl', label: 'Delays', num: true, value: (r) => r.delays.length,
      render: (r) => (r.delays.length
        ? <span title={r.delays.map((d) => `${d.code} · ${d.reason} · ${d.minutes} min`).join('\n')}>{r.delays.length}</span>
        : <span style={{ color: 'var(--text3)' }}>none</span>) },
    { key: 'p', label: 'Production', num: true, value: (r) => r.production, render: (r) => num(r.production) },
    { key: 'a', label: 'Availability', num: true, value: (r) => r.availability, render: (r) => (
      <Bar value={r.availability} max={100} target={85}
        colour={r.availability >= 85 ? SERIES[1] : r.availability >= 70 ? SERIES[2] : SERIES[4]}
        label={r.availability + '%'} width={54} />
    ) },
    { key: 'u', label: 'Utilisation', num: true, value: (r) => r.utilisation,
      render: (r) => <span style={{ fontFamily: 'var(--num)', color: r.utilisation >= 75 ? 'var(--green)' : 'var(--gold)' }}>{r.utilisation}%</span> },
    { key: 'sg', label: 'Sign-off', value: (r) => (r.signedOff ? 'Signed' : 'Pending'),
      render: (r) => (r.signedOff
        ? <Badge tone="green">Signed</Badge>
        : <Btn small icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); select('shift', r.ref); run('signShift'); }}>Sign</Btn>) },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('shifts', v)} options={[
      { v: 'log', l: `Shift log (${shifts.length})`, icon: Timer },
      { v: 'delays', l: 'Delay analysis', icon: AlertTriangle },
      { v: 'trend', l: 'Availability trend', icon: TrendingUp },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Availability', v: avail, unit: '%', icon: Gauge,
        dir: avail >= 85 ? 'up' : 'dn',
        delta: `target 85%`,
        note: 'of scheduled time the machine was fit to work' },
      { l: 'Utilisation', v: util, unit: '%', icon: Activity,
        dir: util >= 75 ? 'up' : 'warn',
        note: 'of available time it actually worked' },
      { l: 'Hours lost', v: lost.toFixed(0), unit: 'h', icon: Clock,
        delta: `${(lost / Math.max(1, lost + worked) * 100).toFixed(0)}% of scheduled time`,
        dir: 'dn',
        note: `across ${shifts.length} logged shifts` },
      { l: 'Awaiting sign-off', v: unsigned.length, icon: CheckCircle2,
        dir: unsigned.length ? 'warn' : 'up',
        note: 'a shift is not costed until the supervisor signs it' },
    ]} />
  );

  if (view === 'delays') return <><>{kpis}</><Delays shifts={shifts} switcher={switcher} /></>;
  if (view === 'trend') return <><>{kpis}</><Trend shifts={shifts} switcher={switcher} /></>;

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={shifts} keyOf={(r) => r.ref} pageSize={20}
        selected={selection.shift} onSelect={(k) => select('shift', k)}
        rowClass={(r) => (r.availability < 70 ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Plus} onClick={() => openDialog('shift')}>Log a shift</Btn>
            <Btn small icon={AlertTriangle} onClick={() => run('recordDelay')}>Record a delay</Btn>
            <Btn small icon={CheckCircle2} onClick={() => run('signShift')}>Sign off</Btn>
          </>
        }
        totals={(list) => (
          <>
            <td colSpan={7} style={{ fontWeight: 600 }}>{list.length} shifts</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.worked, 0).toFixed(1)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.lost, 0).toFixed(1)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.delays.length, 0)}</td>
            <td className="num" style={{ fontWeight: 600 }}>{num(list.reduce((a, r) => a + r.production, 0))}</td>
            <td colSpan={3} />
          </>
        )} />
    </>
  );
}

/* ── where the hours went ───────────────────────────────────────
   Ranked by hours lost, because that is the order the morning
   meeting should work through them in. */
function Delays({ shifts, switcher }) {
  const all = useMemo(() => shifts.flatMap((s) => s.delays.map((d) => ({ ...d, shift: s }))), [shifts]);

  const byCode = useMemo(() => DELAY_CODES.map(([code, label], i) => {
    const mine = all.filter((d) => d.code === code);
    return {
      code,
      label,
      n: mine.length,
      hours: +(mine.reduce((a, d) => a + d.minutes, 0) / 60).toFixed(1),
      unrepaired: mine.filter((d) => !d.repaired).length,
      c: SERIES[i % SERIES.length],
    };
  }).filter((x) => x.n).sort((a, b) => b.hours - a.hours), [all]);

  const totalHours = byCode.reduce((a, x) => a + x.hours, 0);
  const worst = byCode[0];
  /* a breakdown is a work order waiting to be raised; standing time
     is a planning problem. Worth separating. */
  const breakdown = byCode.filter((x) => x.label.startsWith('Breakdown')).reduce((a, x) => a + x.hours, 0);

  const cols = [
    { key: 'c', label: 'Code', mono: true, value: (r) => r.code, render: (r) => <Badge tone="grey">{r.code}</Badge> },
    { key: 'l', label: 'Reason', value: (r) => r.label, render: (r) => <span style={{ fontWeight: 600 }}>{r.label}</span> },
    { key: 'n', label: 'Occurrences', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'h', label: 'Hours lost', num: true, value: (r) => r.hours, render: (r) => (
      <Bar value={r.hours} max={Math.max(...byCode.map((x) => x.hours))} colour={r.c} label={r.hours + ' h'} />
    ) },
    { key: 'avg', label: 'Average', num: true, value: (r) => r.hours / r.n,
      render: (r) => <span style={{ fontFamily: 'var(--num)' }}>{(r.hours * 60 / r.n).toFixed(0)} min</span> },
    { key: 'sh', label: 'Share', num: true, value: (r) => r.hours,
      render: (r) => ((r.hours / totalHours) * 100).toFixed(1) + '%' },
    { key: 'u', label: 'Still open', num: true, value: (r) => r.unrepaired,
      render: (r) => (r.unrepaired ? <Badge tone="gold">{r.unrepaired}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
  ];

  return (
    <>
      {worst && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} strokeWidth={1.8} />
          <span>
            <b>{worst.label}</b> cost {worst.hours} hours across {worst.n} occurrence
            {worst.n === 1 ? '' : 's'} — {((worst.hours / totalHours) * 100).toFixed(0)}% of all time lost.
            Breakdowns alone account for <b>{breakdown.toFixed(0)} hours</b>, and every one of those is a
            work order that could have been raised before the shift rather than during it.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={byCode} keyOf={(r) => r.code} toolbar={switcher} pageSize={20}
        emptyText="No delay has been recorded against a shift." />
      <div className="grid-2">
        <Panel title="Hours lost by machine" note="the machines that stand still most" flush>
          <Breakdown format={(v) => v.toFixed(1) + ' h'} colour={SERIES[4]}
            rows={[...new Set(shifts.map((s) => s.vehicle))].map((v) => ({
              k: v, v: +shifts.filter((s) => s.vehicle === v).reduce((a, s) => a + s.lost, 0).toFixed(1),
            })).sort((a, b) => b.v - a.v).slice(0, 8)} />
        </Panel>
        <Panel title="Hours lost by site" flush>
          <Breakdown format={(v) => v.toFixed(1) + ' h'}
            rows={['PIT', 'STL', 'HO'].map((k, i) => ({
              k: siteName(k), c: SERIES[i],
              v: +shifts.filter((s) => s.site === k).reduce((a, s) => a + s.lost, 0).toFixed(1),
            }))} />
        </Panel>
      </div>
    </>
  );
}

/* ── the two lines that matter ──────────────────────────────────
   Availability and utilisation, over the fortnight. They answer
   different questions and are routinely confused: a machine can be
   100% available and barely used, or worked flat out in the few
   hours it is fit to run. */
function Trend({ shifts, switcher }) {
  const data = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const day = iso(new Date(TODAY.getTime() - (13 - i) * DAY));
    const set = shifts.filter((s) => s.date === day);
    return {
      day: fmtShort(day),
      availability: set.length ? Math.round(set.reduce((a, s) => a + s.availability, 0) / set.length) : null,
      utilisation: set.length ? Math.round(set.reduce((a, s) => a + s.utilisation, 0) / set.length) : null,
      shifts: set.length,
    };
  }), [shifts]);

  const tip = rechartsTip((payload, label) => ({
    head: label,
    rows: payload.map((p) => ({ k: p.name, v: p.value == null ? '—' : p.value + '%', c: p.color })),
    foot: `${payload[0]?.payload.shifts || 0} shifts logged`,
  }));

  return (
    <>
      <div className="cmdstrip solo">
        {switcher}
        <span className="count">the last fourteen days</span>
      </div>
      <Panel title="Availability against utilisation"
        note="the two numbers that decide whether you need another machine or a better workshop">
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: 'var(--text3)' }} axisLine={{ stroke: 'var(--stroke)' }} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v + '%'} />
              <Tooltip content={tip} />
              <RLegend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="availability" name="Availability" stroke={SERIES[1]} strokeWidth={2.2} dot={false} connectNulls />
              <Line dataKey="utilisation" name="Utilisation" stroke={SERIES[0]} strokeWidth={2.2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <div className="grid-2">
        <Panel title="Availability by machine" note="scheduled time the machine was fit to work" flush>
          <Breakdown format={(v) => v + '%'} colour={SERIES[1]}
            rows={[...new Set(shifts.map((s) => s.vehicle))].map((v) => {
              const set = shifts.filter((s) => s.vehicle === v);
              return { k: v, v: Math.round(set.reduce((a, s) => a + s.availability, 0) / set.length) };
            }).sort((a, b) => a.v - b.v).slice(0, 8)} />
        </Panel>
        <Panel title="Production by machine" note="what came out of the ground for it" flush>
          <Breakdown format={num} colour={SERIES[3]}
            rows={[...new Set(shifts.map((s) => s.vehicle))].map((v) => ({
              k: v, v: shifts.filter((s) => s.vehicle === v).reduce((a, s) => a + s.production, 0),
            })).sort((a, b) => b.v - a.v).slice(0, 8)} />
        </Panel>
      </div>
    </>
  );
}
