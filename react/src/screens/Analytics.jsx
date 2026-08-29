import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, BarChart, Bar,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { useStore } from '../store.jsx';
import {
  MONTHLY, SITE_SERIES, SITE_MONTHS, SITE_PERF, CATEGORIES, passRate,
} from '../data.js';
import { SERIES, SEQ, nf, targetTone } from '../theme.js';
import {
  ChartCard, Panel, Seg, Btn, Badge, Legend,
} from '../components/ui.jsx';
import { rechartsTip } from '../charts/tooltip.jsx';
import Sparkline from '../charts/Sparkline.jsx';

const SHIFTS = [
  { k: 'Day A', v: 412, ng: 9, go: 61 }, { k: 'Day B', v: 388, ng: 6, go: 52 },
  { k: 'Aft A', v: 214, ng: 4, go: 29 }, { k: 'Aft B', v: 121, ng: 2, go: 16 },
  { k: 'Night A', v: 68, ng: 1, go: 7 }, { k: 'Night B', v: 44, ng: 0, go: 3 },
];
const WEEKDAYS = [
  { k: 'Mon', v: 268 }, { k: 'Tue', v: 226 }, { k: 'Wed', v: 214 },
  { k: 'Thu', v: 208 }, { k: 'Fri', v: 197 }, { k: 'Sat', v: 92 }, { k: 'Sun', v: 42 },
];

const Delta = ({ now, was, unit = '', invert }) => {
  const d = +(now - was).toFixed(1);   /* the difference is rounded, never the inputs */
  const good = invert ? d <= 0 : d >= 0;
  const I = d === 0 ? Minus : d > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={'delta ' + (d === 0 ? 'flat' : good ? 'up' : 'dn')}>
      <I size={13} />{d > 0 ? '+' : ''}{d}{unit} vs last month
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   Analytics answers "is this getting better, and where is it worst".
   Every figure is compared with the previous period, and the cuts
   that carry an action are clickable through to the register.
   ══════════════════════════════════════════════════════════════ */
export default function Analytics({ run, goTab }) {
  const { inspections, defects, vehicles, settings, select, setInspView } = useStore();
  const [months, setMonths] = useState(6);
  const [cut, setCut] = useState('site');

  const series = MONTHLY.slice(MONTHLY.length - months);
  const now = MONTHLY[MONTHLY.length - 1];
  const was = MONTHLY[MONTHLY.length - 2];
  const trend = series.map((m) => ({ ...m, pass: +passRate(m).toFixed(2) }));
  const target = settings.passRateTarget;

  const openDefects = defects.filter((d) => d.status === 'Open');
  const overdue = openDefects.filter((d) => d.age > settings.goButMaxDays);

  const kpis = [
    { l: 'Inspections', v: nf(now.total), d: <Delta now={now.total} was={was.total} />, s: series.map((m) => m.total), c: SERIES[0] },
    { l: 'Pass rate', v: passRate(now).toFixed(1) + '%', d: <Delta now={passRate(now)} was={passRate(was)} unit=" pp" />, s: trend.map((m) => m.pass), c: SERIES[1] },
    { l: 'No-go rate', v: (now.ng / now.total * 100).toFixed(1) + '%', d: <Delta now={now.ng / now.total * 100} was={was.ng / was.total * 100} unit=" pp" invert />, s: series.map((m) => +(m.ng / m.total * 100).toFixed(2)), c: SERIES[4] },
    { l: 'Go-but raised', v: nf(now.go), d: <Delta now={now.go} was={was.go} invert />, s: series.map((m) => m.go), c: SERIES[2] },
  ];

  const passTip = rechartsTip((p, label) => ({
    head: label,
    rows: [{ c: SERIES[1], k: 'Pass rate', v: p[0].value + '%' }],
    foot: p[0].value >= target ? `${(p[0].value - target).toFixed(1)} pp above target` : `${(target - p[0].value).toFixed(1)} pp below target`,
  }));

  const cuts = {
    site: {
      label: 'By site',
      rows: SITE_PERF.map((p) => ({ k: p.site, v: p.pass, n: p.insp, tone: targetTone(p.pass, settings.complianceTarget), suffix: '%' })),
      note: `pass rate against a ${settings.complianceTarget}% target`,
    },
    shift: {
      label: 'By shift',
      rows: SHIFTS.map((s) => ({ k: s.k, v: +(100 - s.ng / s.v * 100).toFixed(1), n: s.v, tone: s.ng > 5 ? SERIES[4] : s.ng > 2 ? SERIES[2] : SERIES[1], suffix: '%' })),
      note: 'pass rate and volume per shift',
    },
    weekday: {
      label: 'By weekday',
      rows: WEEKDAYS.map((d) => ({ k: d.k, v: d.v, n: d.v, tone: SEQ[4], suffix: '' })),
      note: 'where the capture load falls',
    },
    item: {
      label: 'By item',
      rows: CATEGORIES.map((c, i) => ({ k: c.k, v: c.v, n: c.v, tone: SEQ[Math.max(1, 5 - i)], suffix: '%' })),
      note: 'which items fail most often',
    },
  };
  const active = cuts[cut];
  const maxCut = Math.max(...active.rows.map((r) => r.v));

  const worst = [...SITE_PERF].sort((a, b) => a.pass - b.pass)[0];
  const bestMover = [...SITE_PERF].sort((a, b) => (b.trend[5] - b.trend[0]) - (a.trend[5] - a.trend[0]))[0];

  return (
    <>
      <div className="cmdstrip solo">
        <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Period</span>
        <Seg value={months} onChange={setMonths} options={[{ v: 6, l: '6 months' }, { v: 12, l: '12 months' }]} />
        <span className="count">June 2026 compared with May 2026</span>
      </div>

      <div className="kpis">
        {kpis.map((k) => (
          <div className="kpi" key={k.l}>
            <div className="kpi-lbl">{k.l}</div>
            <div className="kpi-row">
              <span className="kpi-val">{k.v}</span>
              <span className="kpi-spark"><Sparkline values={k.s} color={k.c} /></span>
            </div>
            <div className="kpi-foot">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <ChartCard title="Pass rate against target" note={`${months} months · target ${target}%`}
          right={<Legend items={[{ c: SERIES[1], l: 'Pass rate', line: true }, { c: 'var(--text3)', l: `${target}% target`, line: true }]} />}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 14, right: 10, bottom: 0, left: -14 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="m" tickLine={false} axisLine={{ stroke: 'var(--stroke-strong)' }} tick={{ fontSize: 10.5, fill: 'var(--text3)' }} />
              <YAxis domain={[Math.floor(Math.min(...trend.map((t) => t.pass)) - 1), 100]} tickLine={false} axisLine={false}
                width={52} tick={{ fontSize: 10.5, fill: 'var(--text3)' }} tickFormatter={(v) => v + '%'} />
              <Tooltip content={passTip} />
              <ReferenceLine y={target} stroke="var(--text3)" strokeDasharray="0" />
              <Line type="monotone" dataKey="pass" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 3, fill: SERIES[1] }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Where it fails" note={active.note}
          right={
            <Seg value={cut} onChange={setCut} options={Object.entries(cuts).map(([v, c]) => ({ v, l: c.label.replace('By ', '') }))} />
          }>
          <div style={{ paddingTop: 2 }}>
            {active.rows.map((r) => (
              <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <div style={{ width: 132, fontSize: 12.5, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.k}</div>
                <div className="track" style={{ flex: 1 }}>
                  <div className="fill" style={{ width: (r.v / maxCut * 100) + '%', background: r.tone }} />
                  {cut === 'company' && <div className="thresh" style={{ left: (settings.complianceTarget / maxCut * 100) + '%' }} />}
                </div>
                <div style={{ font: '600 12px var(--num)', width: 52, textAlign: 'right', color: r.tone }}>{r.v}{r.suffix}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid-2">
        <ChartCard title="Capture volume by site" note="the last six months, stacked by month">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={SITE_MONTHS.map((m, i) => {
              const row = { m };
              SITE_SERIES.forEach((d) => { row[d.site] = d.v[i]; });
              return row;
            })} margin={{ top: 12, right: 6, bottom: 0, left: -14 }} barCategoryGap="26%">
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="m" tickLine={false} axisLine={{ stroke: 'var(--stroke-strong)' }} tick={{ fontSize: 10.5, fill: 'var(--text3)' }} />
              <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 10.5, fill: 'var(--text3)' }} tickFormatter={nf} />
              <Tooltip content={rechartsTip((p, label) => ({
                head: `${label} 2026`,
                rows: p.map((x) => ({ c: x.color, k: x.dataKey, v: x.value })),
                foot: `${nf(p.reduce((a, x) => a + x.value, 0))} in total`,
              }))} cursor={{ fill: 'rgba(23,98,181,.05)' }} />
              {SITE_SERIES.map((d) => (
                <Bar key={d.key} dataKey={d.site} stackId="a" fill={d.c} stroke="#fff" strokeWidth={1} maxBarSize={44} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <Legend items={SITE_SERIES.map((d) => ({ c: d.c, l: d.site }))} />
        </ChartCard>

        <Panel title="What to do about it" note="read from the live records">
          <div className="insight-row">
            <Badge tone="red">Worst performer</Badge>
            <div>
              <b>{worst.site}</b> sits at {worst.pass}%, {(settings.complianceTarget - worst.pass).toFixed(1)} pp under
              the {settings.complianceTarget}% target, with {worst.ng} no-go defect{worst.ng === 1 ? '' : 's'} open.
            </div>
            <Btn small icon={ArrowRight} onClick={() => goTab('compliance')}>Compliance</Btn>
          </div>
          <div className="insight-row">
            <Badge tone="green">Best trend</Badge>
            <div>
              <b>{bestMover.site}</b> has gained {(bestMover.trend[5] - bestMover.trend[0]).toFixed(1)} pp over six
              months — the clearest improvement on the platform.
            </div>
            <Sparkline values={bestMover.trend} color={SERIES[1]} w={62} h={22} />
          </div>
          <div className="insight-row">
            <Badge tone="gold">Ageing</Badge>
            <div>
              {overdue.length} open defect{overdue.length === 1 ? '' : 's'} past the {settings.goButMaxDays}-day
              window, out of {openDefects.length} open.
            </div>
            <Btn small icon={ArrowRight} onClick={() => { setInspView('defects'); goTab('inspections'); }}>Defects</Btn>
          </div>
          <div className="insight-row">
            <Badge tone="blue">Load</Badge>
            <div>
              Monday carries {WEEKDAYS[0].v} captures against a {Math.round(WEEKDAYS.slice(1, 5).reduce((a, d) => a + d.v, 0) / 4)} weekday
              average — the first shift of the week is the peak.
            </div>
          </div>
          <div className="insight-row">
            <Badge tone="purple">Fleet</Badge>
            <div>
              {vehicles.filter((v) => v.status === 'Maintenance').length} of {vehicles.length} vehicles grounded,
              and {inspections.filter((i) => !i.signed).length} sheet(s) still await a signature.
            </div>
            <Btn small icon={ArrowRight} onClick={() => goTab('fleet')}>Fleet</Btn>
          </div>
        </Panel>
      </div>
    </>
  );
}
