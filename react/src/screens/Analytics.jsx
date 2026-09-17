import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, BarChart, Bar,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { useStore } from '../store.jsx';
import { SERIES, SEQ, nf, targetTone } from '../theme.js';
import {
  monthlySeries, monthToDate, bySite, byShift, byWeekday, byItem, byOperator, passRateOf,
} from '../erp/analytics.js';
import {
  ChartCard, Panel, Seg, Btn, Badge, Legend,
} from '../components/ui.jsx';
import { rechartsTip } from '../charts/tooltip.jsx';
import Sparkline from '../charts/Sparkline.jsx';

const Delta = ({ now, was, unit = '', invert, label = 'vs the same point last month' }) => {
  const d = +(now - was).toFixed(1);   /* the difference is rounded, never the inputs */
  const good = invert ? d <= 0 : d >= 0;
  const I = d === 0 ? Minus : d > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={'delta ' + (d === 0 ? 'flat' : good ? 'up' : 'dn')}>
      <I size={13} />{d > 0 ? '+' : ''}{d}{unit} {label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   Analytics answers "is this getting better, and where is it worst".
   Every figure is compared with the previous period, and the cuts
   that carry an action are clickable through to the register.
   ══════════════════════════════════════════════════════════════ */
export default function Analytics({ run, goTab }) {
  const {
    inspections, defects, vehicles, settings, select, setInspView, sitePerf, siteVolume,
  } = useStore();
  const [months, setMonths] = useState(6);
  const [cut, setCut] = useState('site');

  /* Every figure below is a sum over the sheets the register holds,
     so the period selector genuinely re-cuts the data rather than
     slicing a fixed table. */
  const series = useMemo(() => monthlySeries(inspections, months), [inspections, months]);
  const trend = series;
  const now = series[series.length - 1] || { total: 0, ok: 0, go: 0, ng: 0, pass: 0 };
  /* the month in progress is compared against the same span of the
     previous one, so a partial month is not read as a collapse */
  const mtd = useMemo(() => monthToDate(inspections), [inspections]);
  const target = settings.passRateTarget;

  const openDefects = defects.filter((d) => d.status === 'Open');
  const overdue = openDefects.filter((d) => d.age > settings.goButMaxDays);

  /* the four cuts, all from the same records */
  const cutRows = useMemo(() => ({
    site: bySite(inspections),
    shift: byShift(inspections),
    weekday: byWeekday(inspections),
    item: byItem(inspections),
    operator: byOperator(inspections),
  }), [inspections]);

  const rate = (n, d) => (d ? (n / d) * 100 : 0);
  const kpis = [
    { l: 'Inspections', v: nf(mtd.now), d: <Delta now={mtd.now} was={mtd.was} />, s: series.map((m) => m.total), c: SERIES[0] },
    { l: 'Pass rate', v: mtd.nowPass.toFixed(1) + '%', d: <Delta now={mtd.nowPass} was={mtd.wasPass} unit=" pp" />, s: trend.map((m) => m.pass), c: SERIES[1] },
    { l: 'No-go rate', v: rate(mtd.nowNg, mtd.now).toFixed(1) + '%',
      d: <Delta now={rate(mtd.nowNg, mtd.now)} was={rate(mtd.wasNg, mtd.was)} unit=" pp" invert />,
      s: series.map((m) => +rate(m.ng, m.total).toFixed(2)), c: SERIES[4] },
    { l: 'Go-but raised', v: nf(mtd.nowGo), d: <Delta now={mtd.nowGo} was={mtd.wasGo} invert />, s: series.map((m) => m.go), c: SERIES[2] },
  ];

  const passTip = rechartsTip((p, label) => ({
    head: label,
    rows: [{ c: SERIES[1], k: 'Pass rate', v: p[0].value + '%' }],
    foot: p[0].value >= target ? `${(p[0].value - target).toFixed(1)} pp above target` : `${(target - p[0].value).toFixed(1)} pp below target`,
  }));

  const cuts = {
    site: {
      label: 'By site',
      rows: cutRows.site.map((p) => ({ k: p.k, v: p.pass, n: p.n, tone: targetTone(p.pass, settings.complianceTarget), suffix: '%' })),
      note: `pass rate against a ${settings.complianceTarget}% target`,
    },
    shift: {
      label: 'By shift',
      rows: cutRows.shift.map((p) => ({ k: p.k, v: p.pass, n: p.n, tone: targetTone(p.pass, settings.complianceTarget), suffix: '%' })),
      note: 'pass rate per shift, worst first',
    },
    weekday: {
      label: 'By weekday',
      rows: cutRows.weekday.map((p) => ({ k: p.k, v: p.n, n: p.n, tone: SEQ[4], suffix: '' })),
      note: 'where the capture load falls across the week',
    },
    operator: {
      label: 'By operator',
      rows: cutRows.operator.slice(0, 8).map((p) => ({ k: p.k, v: p.pass, n: p.n, tone: targetTone(p.pass, settings.complianceTarget), suffix: '%' })),
      note: 'pass rate per operator, five sheets or more',
    },
    item: {
      label: 'By item',
      rows: cutRows.item.map((c, i) => ({ k: c.k, v: c.n, n: c.n, tone: SEQ[Math.max(1, 5 - Math.floor(i / 2))], suffix: '' })),
      note: 'which checks fail most often, by count',
    },
  };
  const active = cuts[cut];
  const maxCut = Math.max(1, ...active.rows.map((r) => r.v));

  const ranked = [...sitePerf].sort((a, b) => a.pass - b.pass);
  const worst = ranked[0] || { site: '—', pass: 0, ng: 0, trend: [0] };
  const bestMover = [...sitePerf].sort((a, b) => b.drift - a.drift)[0] || worst;
  const topItem = cutRows.item[0];
  const weekdays = cutRows.weekday;
  const peak = [...weekdays].sort((a, b) => b.n - a.n)[0];
  const avgWeekday = weekdays.length
    ? Math.round(weekdays.reduce((a, d) => a + d.n, 0) / weekdays.length) : 0;

  return (
    <>
      <div className="cmdstrip solo">
        <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Period</span>
        <Seg value={months} onChange={setMonths} options={[{ v: 6, l: '6 months' }, { v: 12, l: '12 months' }]} />
        <span className="count">
          {mtd.label} to day {mtd.day}, against the same span of {mtd.prevLabel} · {nf(inspections.length)} sheets on record
        </span>
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
        <ChartCard title="Capture volume by site" note={`the last ${siteVolume.months.length} months, stacked by month`}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={siteVolume.months.map((m, i) => {
              const row = { m };
              siteVolume.series.forEach((d) => { row[d.site] = d.v[i]; });
              return row;
            })} margin={{ top: 12, right: 6, bottom: 0, left: -14 }} barCategoryGap="26%">
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="m" tickLine={false} axisLine={{ stroke: 'var(--stroke-strong)' }} tick={{ fontSize: 10.5, fill: 'var(--text3)' }} />
              <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 10.5, fill: 'var(--text3)' }} tickFormatter={nf} />
              <Tooltip content={rechartsTip((p, label) => ({
                head: label,
                rows: p.map((x) => ({ c: x.color, k: x.dataKey, v: x.value })),
                foot: `${nf(p.reduce((a, x) => a + x.value, 0))} in total`,
              }))} cursor={{ fill: 'rgba(23,98,181,.05)' }} />
              {siteVolume.series.map((d) => (
                <Bar key={d.key} dataKey={d.site} stackId="a" fill={d.c} stroke="#fff" strokeWidth={1} maxBarSize={44} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <Legend items={siteVolume.series.map((d) => ({ c: d.c, l: d.site }))} />
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
              <b>{bestMover.site}</b> has {bestMover.drift >= 0 ? 'gained' : 'lost'} {Math.abs(bestMover.drift).toFixed(1)} pp
              over six months — the clearest {bestMover.drift >= 0 ? 'improvement' : 'decline'} on the platform.
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
              <b>{peak ? peak.k : '—'}</b> carries {peak ? nf(peak.n) : 0} captures against
              a {nf(avgWeekday)} daily average — that is where the capture load peaks.
            </div>
          </div>
          {topItem && (
            <div className="insight-row">
              <Badge tone="gold">Commonest failure</Badge>
              <div>
                <b>{topItem.k}</b> failed {nf(topItem.n)} time{topItem.n === 1 ? '' : 's'} — {topItem.share}% of every
                failed check, {topItem.ng ? `${nf(topItem.ng)} of them grounding the vehicle` : 'all on a concession'}.
                It sits under <i>{topItem.section}</i>.
              </div>
              <Btn small icon={ArrowRight} onClick={() => setCut('item')}>Break it down</Btn>
            </div>
          )}
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
