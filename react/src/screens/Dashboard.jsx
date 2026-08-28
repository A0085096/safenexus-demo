import React, { useState } from 'react';
import {
  ClipboardCheck, CircleCheck, Truck, AlertTriangle, Box, BarChart3, Table2, RefreshCw,
  BadgeCheck, Wrench, Clock, UserX, Car, CarFront, UserPlus, FileText,
} from 'lucide-react';
import {
  MONTHLY, ISO_DATA, ISO_MONTHS, AGING, PERF, KPIS, BASE, FLEET_BASE,
} from '../data.js';
import { useStore } from '../store.jsx';
import { SERIES, OUTCOME, nf, targetTone, targetLabel } from '../theme.js';
import {
  Panel, ChartCard, Seg, Legend, Btn, Badge, Avatar, ListRow, SecHead, RichText,
  resultBadge, planBadge,
} from '../components/ui.jsx';
import Sparkline from '../charts/Sparkline.jsx';
import VolumeChart from '../charts/VolumeChart.jsx';
import FleetDonut from '../charts/FleetDonut.jsx';
import AgingChart from '../charts/AgingChart.jsx';
import Iso3D from '../charts/Iso3D.jsx';
import GroupedBars from '../charts/GroupedBars.jsx';

const KPI_ICON = { clipboard: ClipboardCheck, check: CircleCheck, truck: Truck, alert: AlertTriangle };
const ATT_ICON = { alert: AlertTriangle, cert: BadgeCheck, tool: Wrench, clock: Clock, user: UserX };
const AUDIT_ICON = {
  assign: [Car, 'green'], unassign: [CarFront, 'gold'], user: [UserPlus, 'purple'],
  insp: [ClipboardCheck, 'blue'], warn: [AlertTriangle, 'red'],
};



/* ── KPI tile ─────────────────────────────────────────────────── */
function Kpi({ k }) {
  const Icon = KPI_ICON[k.icon];
  return (
    <div className="kpi">
      <div className="kpi-lbl"><Icon size={14} strokeWidth={1.8} />{k.lbl}</div>
      <div className="kpi-row">
        <span className="kpi-val">{k.val}</span>
        <span className="kpi-unit">{k.unit}</span>
        <span className="kpi-spark"><Sparkline values={k.series} color={k.tone} /></span>
      </div>
      <div className="kpi-foot">
        <span className={'delta ' + k.dir}>{k.delta}</span>
        <span className="kpi-note">{k.note}</span>
      </div>
    </div>
  );
}

/* ── company performance report ───────────────────────────────── */
const PERF_COLS = [
  { k: 'co', l: 'Company' }, { k: 'plan', l: 'Plan' },
  { k: 'users', l: 'Users', num: true }, { k: 'vehicles', l: 'Vehicles', num: true },
  { k: 'insp', l: 'Inspections', num: true }, { k: 'pass', l: 'Pass rate vs 90% target', num: true },
  { k: 'ng', l: 'No-go', num: true }, { k: 'trend', l: '6-month trend', num: true },
  { k: 'status', l: 'Status' },
];

function PerformanceReport({ run, target }) {
  const [sort, setSort] = useState({ k: 'pass', d: -1 });
  const rows = [...PERF].sort((a, b) => {
    const k = sort.k === 'trend' ? 'pass' : sort.k === 'status' ? 'pass' : sort.k;
    const x = a[k], y = b[k];
    return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.d;
  });
  const sum = (k) => PERF.reduce((a, d) => a + d[k], 0);
  const weighted = PERF.reduce((a, d) => a + d.pass * d.insp, 0) / sum('insp');

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <h2>Company performance</h2>
        <span className="note">June 2026 · target {target}%</span>
        <div className="right">
          <Legend items={[
            { c: SERIES[1], l: `meets the ${target}% target` },
            { c: SERIES[2], l: `within 5 pp of it` },
            { c: SERIES[4], l: `more than 5 pp below` },
          ]} />
          <Btn small icon={FileText} onClick={() => run('report:Compliance report')}>Report</Btn>
        </div>
      </div>
      <div className="gridwrap">
        <table className="grid">
          <thead>
            <tr>
              {PERF_COLS.map((c) => (
                <th key={c.k}
                  className={['sortable', c.num && 'num', sort.k === c.k && (sort.d === 1 ? 'sort-asc' : 'sort-desc')].filter(Boolean).join(' ')}
                  onClick={() => setSort((s) => ({ k: c.k, d: s.k === c.k ? -s.d : (c.k === 'co' || c.k === 'plan' ? 1 : -1) }))}>
                  {c.l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const tone = targetTone(d.pass, target);
              const drift = +(d.trend[5] - d.trend[0]).toFixed(1);
              return (
                <tr key={d.co}>
                  <td style={{ fontWeight: 600 }}>{d.co}</td>
                  <td>{planBadge(d.plan)}</td>
                  <td className="num">{d.users}</td>
                  <td className="num">{d.vehicles}</td>
                  <td className="num">{nf(d.insp)}</td>
                  <td>
                    <div className="cellbar">
                      <div className="track">
                        <div className="fill" style={{ width: d.pass + '%', background: tone }} />
                        <div className="thresh" style={{ left: target + '%' }} />
                      </div>
                      <span className="pct" style={{ color: tone }}>{d.pass}%</span>
                    </div>
                  </td>
                  <td className="num" style={{ color: d.ng ? 'var(--red)' : 'var(--text3)', fontWeight: 600 }}>{d.ng}</td>
                  <td>
                    <div className="trendcell">
                      <Sparkline values={d.trend} color={tone} w={62} h={22} />
                      <span className={'delta ' + (drift >= 0 ? 'up' : 'dn')} style={{ fontSize: 11 }}>
                        {drift >= 0 ? '+' : ''}{drift} pp
                      </span>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const l = targetLabel(d.pass, target);
                      return <Badge tone={l === 'On track' ? 'green' : l === 'Watch' ? 'gold' : 'red'}>{l}</Badge>;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>6 companies</td><td />
              <td className="num">{sum('users')}</td>
              <td className="num">{sum('vehicles')}</td>
              <td className="num">{nf(sum('insp'))}</td>
              <td><div className="cellbar"><span className="pct">{weighted.toFixed(1)}%</span></div></td>
              <td className="num">{sum('ng')}</td>
              <td className="num" style={{ color: 'var(--text3)', fontWeight: 400 }}>weighted by volume</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── screen ───────────────────────────────────────────────────── */
export default function Dashboard({ run, goTab }) {
  const { vehicles, inspections, defects, audit, users, companies, select, settings } = useStore();
  const [period, setPeriod] = useState(6);
  const [isoView, setIsoView] = useState('iso');
  const months = MONTHLY.slice(MONTHLY.length - period);
  const pending = inspections.filter((i) => !i.signed || i.result === 'no-go').slice(0, 5);

  /* live counts — the dashboard moves when the modules change data */
  const openDefects = defects.filter((d) => d.status === 'Open');
  const noGoOpen = openDefects.filter((d) => d.severity === 'No Go');
  const grounded = vehicles.filter((v) => v.status === 'Maintenance');
  const fleetMix = [
    { k: 'Assigned', v: FLEET_BASE.Assigned + vehicles.filter((v) => v.status === 'Assigned').length, c: OUTCOME.ok },
    { k: 'Available', v: FLEET_BASE.Available + vehicles.filter((v) => v.status === 'Available').length, c: OUTCOME.go },
    { k: 'Maintenance', v: FLEET_BASE.Maintenance + grounded.length, c: OUTCOME.ng },
  ];
  const fleetTotal = fleetMix.reduce((a, d) => a + d.v, 0);
  const kpis = KPIS.map((k) => (k.key === 'nogo'
    ? { ...k, val: String(noGoOpen.length), delta: `${grounded.length} grounded`, dir: noGoOpen.length ? 'warn' : 'up', note: 'open across the platform' }
    : k.key === 'insp'
      ? { ...k, val: nf(BASE.inspections + inspections.length), note: `${inspections.length} on the register here` }
      : k));
  const attention = [
    ...grounded.map((v) => ({
      icon: 'alert', tone: 'red', n: `${v.plate} — grounded`,
      s: `${v.make} · ${v.co}`, r: 'off road',
    })),
    ...openDefects.filter((d) => d.age > 25).map((d) => ({
      icon: 'clock', tone: d.age > 30 ? 'red' : 'gold', n: `${d.item} — go-but aging`,
      s: `${d.plate} · ${d.co}`, r: `${d.age} of 30 days`,
    })),
    { icon: 'cert', tone: 'red', n: 'P. Dlamini — COF expires', s: 'Supervisor · Acme Mining Corp', r: '6 days' },
    { icon: 'user', tone: 'gold', n: '3 operators without a supervisor', s: 'Acme Mining Corp', r: 'unassigned' },
  ].slice(0, 6);
  const agingTotal = openDefects.length;

  const isoNote = { iso: 'isometric · height is volume', bars: 'grouped columns · same data', table: 'exact values' }[isoView];

  return (
    <>
      <div className="cmdstrip solo">
        <div className="glance">
          <span><b>{BASE.companies + companies.length}</b> companies</span>
          <span><b>{BASE.users + users.length}</b> users</span>
          <span><b>{fleetTotal}</b> vehicles</span>
          <span><b>92.4%</b> average compliance</span>
        </div>
        <div className="count" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Seg value={period} onChange={setPeriod}
            options={[{ v: 6, l: '6 months' }, { v: 12, l: '12 months' }]} />
          <Btn small icon={RefreshCw} onClick={() => run('refresh')}>Refresh</Btn>
        </div>
      </div>

      <div className="kpis">{kpis.map((k) => <Kpi key={k.key} k={k} />)}</div>

      <div className="grid-2">
        <ChartCard title="Volume and outcome" note={`last ${period} months`}
          right={<Legend items={[
            { c: OUTCOME.ok, l: 'In order' }, { c: OUTCOME.go, l: 'Go-but' }, { c: OUTCOME.ng, l: 'No-go' },
          ]} />}>
          <VolumeChart data={months} />
        </ChartCard>

        <ChartCard title="Fleet status" note={`${fleetTotal} vehicles`}
          right={<button className="link" onClick={() => goTab('fleet')}>Manage fleet</button>}>
          <div className="donut-wrap">
            <FleetDonut data={fleetMix} />
            <div className="donut-legend">
              {fleetMix.map((d) => (
                <div className="dl" key={d.k}>
                  <span className="sw" style={{ background: d.c }} />
                  <span>{d.k}</span>
                  <span className="dv">{d.v}</span>
                  <span className="dp">{(d.v / fleetTotal * 100).toFixed(1)}%</span>
                </div>
              ))}
              <div className="dl" style={{ borderTop: '1px solid var(--stroke)', borderBottom: 'none', paddingTop: 7 }}>
                <span style={{ color: 'var(--text3)' }}>In service</span>
                <span className="dv">{fleetTotal - fleetMix[2].v}</span>
                <span className="dp">{((fleetTotal - fleetMix[2].v) / fleetTotal * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid-2">
        <ChartCard title="Inspections by company" note={isoNote}
          right={
            <>
              <Legend items={ISO_DATA.map((d) => ({ c: d.c, l: d.co }))} />
              <Seg value={isoView} onChange={setIsoView} options={[
                { v: 'iso', l: '3D', icon: Box },
                { v: 'bars', l: '2D', icon: BarChart3 },
                { v: 'table', l: 'Table', icon: Table2 },
              ]} />
            </>
          }>
          {isoView === 'iso' && <Iso3D data={ISO_DATA} months={ISO_MONTHS} />}
          {isoView === 'bars' && <GroupedBars data={ISO_DATA} months={ISO_MONTHS} />}
          {isoView === 'table' && (
            <div className="gridwrap" style={{ margin: -12 }}>
              <table className="grid">
                <thead>
                  <tr><th>Company</th>{ISO_MONTHS.map((m) => <th key={m} className="num">{m}</th>)}<th className="num">Total</th></tr>
                </thead>
                <tbody>
                  {ISO_DATA.map((d) => (
                    <tr key={d.co}>
                      <td>
                        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: d.c, marginRight: 7 }} />
                        {d.co}
                      </td>
                      {d.v.map((v, i) => <td className="num" key={i}>{nf(v)}</td>)}
                      <td className="num" style={{ fontWeight: 600 }}>{nf(d.v.reduce((a, b) => a + b, 0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>All companies</td>
                    {ISO_MONTHS.map((m, i) => <td className="num" key={m}>{nf(ISO_DATA.reduce((a, d) => a + d.v[i], 0))}</td>)}
                    <td className="num">{nf(ISO_DATA.reduce((a, d) => a + d.v.reduce((x, y) => x + y, 0), 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </ChartCard>

        <div className="chart-card">
          <div className="chart-hd">
            <h2>Go-but defect aging</h2>
            <span className="note">{agingTotal} open items · {settings.goButMaxDays}-day repair rule</span>
            <div className="right"><button className="link" onClick={() => goTab('compliance')}>Work the list</button></div>
          </div>
          <div className="chart-body chart"><AgingChart data={AGING} total={87} /></div>
          <div style={{ padding: '0 12px 4px' }}><SecHead>Oldest open items</SecHead></div>
          <div className="panel-body flush">
            {[...openDefects].sort((a, b) => b.age - a.age).slice(0, 4).map((a) => (
              <ListRow key={a.id}
                avatar={<Avatar tone={a.age > 30 ? 'red' : 'gold'} icon={AlertTriangle} />}
                title={a.item} sub={`${a.plate} · ${a.co}`}
                onClick={() => run('openDefect:' + a.id)}
                right={
                  <>
                    <div style={{ font: '600 12px var(--num)', color: a.age > settings.goButMaxDays ? 'var(--red)' : 'var(--gold)' }}>{a.age} days</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.age > settings.goButMaxDays ? 'past the rule' : a.severity === 'No Go' ? 'grounds the vehicle' : 'due soon'}</div>
                  </>
                } />
            ))}
          </div>
        </div>
      </div>

      <PerformanceReport run={run} target={settings.complianceTarget} />

      <Panel title="Pending inspections requiring sign-off" note="oldest first" flush
        right={<><Badge tone="gold">5 pending</Badge>{' '}
          <Btn small onClick={() => run('signOffAll')}>Sign off all</Btn></>}>
        <div className="gridwrap">
          <table className="grid">
            <thead>
              <tr><th>Ref</th><th>Vehicle</th><th>Operator</th><th>Company</th><th>Submitted</th>
                <th className="num">Defects</th><th>Result</th><th>Action</th></tr>
            </thead>
            <tbody>
              {pending.map((i) => (
                <tr key={i.ref} onClick={() => { select('inspection', i.ref); goTab('inspections'); }} style={{ cursor: 'pointer' }}>
                  <td className="mono">#{i.ref}</td>
                  <td className="mono">{i.vehicle}</td>
                  <td>{i.op}</td>
                  <td style={{ color: 'var(--text2)' }}>{i.co}</td>
                  <td style={{ color: 'var(--text2)' }}>{i.date}</td>
                  <td className="num" style={{ color: i.ng ? 'var(--red)' : i.go ? 'var(--gold)' : 'var(--text3)', fontWeight: 600 }}>
                    {i.go + i.ng}
                  </td>
                  <td>{resultBadge(i.result)}</td>
                  <td><Btn small onClick={() => { select('inspection', i.ref); run('signOff'); }}>Sign off</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="Recent activity" flush
          right={<button className="link" onClick={() => goTab('audit')}>Full audit log</button>}>
          {audit.slice(0, 5).map((a, i) => {
            const [Icon, tone] = AUDIT_ICON[a.type] || AUDIT_ICON.insp;
            return (
              <ListRow key={i} avatar={<Avatar tone={tone} icon={Icon} />}
                title={<RichText text={a.text} />} sub={a.meta}
                right={<span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{a.time}</span>} />
            );
          })}
        </Panel>

        <Panel title="Needs attention" note="vehicles and certificates" flush
          right={<button className="link" onClick={() => goTab('compliance')}>Compliance</button>}>
          {attention.map((a) => {
            const Icon = ATT_ICON[a.icon];
            return (
              <ListRow key={a.n} avatar={<Avatar tone={a.tone} icon={Icon} />}
                title={a.n} sub={a.s}
                right={<span style={{ font: '600 11.5px var(--num)', color: `var(--${a.tone})` }}>{a.r}</span>} />
            );
          })}
        </Panel>
      </div>
    </>
  );
}
