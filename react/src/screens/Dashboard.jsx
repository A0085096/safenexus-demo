import React, { useState } from 'react';
import {
  ClipboardCheck, CircleCheck, Truck, AlertTriangle, Box, BarChart3, Table2, RefreshCw,
  BadgeCheck, Wrench, Clock, UserX, Car, CarFront, UserPlus, FileText,
  Route, Coins, Fuel, Percent, ShieldAlert, Receipt, Package, CircleDot, Banknote,
} from 'lucide-react';
import {
  MONTHLY, SITE_SERIES, SITE_MONTHS, SITE_PERF, KPIS, siteName,
} from '../data.js';
import { useStore } from '../store.jsx';
import { SERIES, SEQ, OUTCOME, nf, targetTone, targetLabel } from '../theme.js';
import { Kpis, Money, Signed, Breakdown } from '../components/erpUi.jsx';
import {
  R, num, until, vehSpend, vehCpk, woCost, jobMargin, invDue, invState, stockValue,
} from '../erp/seed.js';
import {
  Panel, ChartCard, Seg, Legend, Btn, Badge, Avatar, ListRow, SecHead, RichText,
  resultBadge,
} from '../components/ui.jsx';
import Sparkline from '../charts/Sparkline.jsx';
import VolumeChart from '../charts/VolumeChart.jsx';
import FleetDonut from '../charts/FleetDonut.jsx';
import AgingChart from '../charts/AgingChart.jsx';
import Iso3D from '../charts/Iso3D.jsx';
import GroupedBars from '../charts/GroupedBars.jsx';

const KPI_ICON = { clipboard: ClipboardCheck, check: CircleCheck, truck: Truck, alert: AlertTriangle };
const ATT_ICON = {
  alert: AlertTriangle, cert: BadgeCheck, tool: Wrench, clock: Clock, user: UserX,
  fuel: Fuel, tyre: CircleDot, part: Package, invoice: Receipt, incident: ShieldAlert,
};
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
  { k: 'site', l: 'Site' },
  { k: 'users', l: 'Users', num: true }, { k: 'vehicles', l: 'Vehicles', num: true },
  { k: 'insp', l: 'Inspections', num: true }, { k: 'pass', l: 'Pass rate vs 90% target', num: true },
  { k: 'ng', l: 'No-go', num: true }, { k: 'trend', l: '6-month trend', num: true },
  { k: 'status', l: 'Status' },
];

function PerformanceReport({ run, target }) {
  const [sort, setSort] = useState({ k: 'pass', d: -1 });
  const rows = [...SITE_PERF].sort((a, b) => {
    const k = sort.k === 'trend' ? 'pass' : sort.k === 'status' ? 'pass' : sort.k;
    const x = a[k], y = b[k];
    return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.d;
  });
  const sum = (k) => SITE_PERF.reduce((a, d) => a + d[k], 0);
  const weighted = SITE_PERF.reduce((a, d) => a + d.pass * d.insp, 0) / sum('insp');

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <h2>Site performance</h2>
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
                <tr key={d.key}>
                  <td style={{ fontWeight: 600 }}>{d.site}</td>
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
              <td>3 sites</td>
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
  const {
    vehicles, inspections, defects, audit, users, select, settings,
    jobs, fuel, tyres, parts, incidents, invoices, workOrders, approvals, budgets,
  } = useStore();
  const [period, setPeriod] = useState(6);
  const [isoView, setIsoView] = useState('iso');
  const months = MONTHLY.slice(MONTHLY.length - period);
  const pending = inspections.filter((i) => !i.signed || i.result === 'no-go').slice(0, 5);

  /* live counts — the dashboard moves when the modules change data */
  const openDefects = defects.filter((d) => d.status === 'Open');
  const noGoOpen = openDefects.filter((d) => d.severity === 'No Go');
  const grounded = vehicles.filter((v) => v.status === 'Maintenance');
  const fleetMix = [
    { k: 'Assigned', v: vehicles.filter((v) => v.status === 'Assigned').length, c: OUTCOME.ok },
    { k: 'Available', v: vehicles.filter((v) => v.status === 'Available').length, c: OUTCOME.go },
    { k: 'Maintenance', v: grounded.length, c: OUTCOME.ng },
  ];
  const fleetTotal = fleetMix.reduce((a, d) => a + d.v, 0);
  const kpis = KPIS.map((k) => (k.key === 'nogo'
    ? { ...k, val: String(noGoOpen.length), delta: `${grounded.length} grounded`, dir: noGoOpen.length ? 'warn' : 'up', note: 'open across the fleet' }
    : k.key === 'avail'
      ? { ...k, val: (100 - grounded.length / vehicles.length * 100).toFixed(1), note: `${grounded.length} of ${vehicles.length} in maintenance` }
      : k));

  /* ── the money, live from the modules ───────────────────────
     Every figure below is summed from the same records the
     registers page through, so a total here and a total in a grid
     footer cannot disagree. */
  const spend = vehicles.reduce((a, v) => a + vehSpend(v), 0);
  const meterRun = vehicles.reduce((a, v) => a + (v.month?.meter || 0), 0);
  const budgetTotal = Object.values(budgets).reduce((a, b) => a + b, 0);
  const delivered = jobs.filter((j) => j.status === 'Delivered');
  const revenue = delivered.reduce((a, j) => a + j.revenue, 0);
  const jobMarginTotal = delivered.reduce((a, j) => a + jobMargin(j), 0);
  const outstanding = invoices.reduce((a, i) => a + invDue(i), 0);
  const overdueInv = invoices.filter((i) => invState(i) === 'Overdue');

  /* ── the exception queue ────────────────────────────────────
     Not a status board: a to-do list. Every row is something that
     has stopped, lapsed or does not reconcile, and every one opens
     the register that fixes it. */
  const fuelExceptions = fuel.filter((f) => f.exception);
  const illegalTyres = tyres.filter((t) => t.status !== 'Scrapped' && t.tread < 3);
  const outOfStock = parts.filter((p) => p.qty === 0);
  const openIncidents = incidents.filter((i) => i.status !== 'Closed');
  const criticalIncidents = openIncidents.filter((i) => i.severity === 'Critical');
  const lapsedCof = vehicles.filter((v) => until(v.cofExpiry) < 0);
  const lapsedPeople = users.filter((u) => [u.licenceExpiry, u.prdpExpiry, u.medicalExpiry]
    .filter(Boolean).some((d) => until(d) < 0));
  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');

  const attention = [
    ...criticalIncidents.map((i) => ({
      icon: 'incident', tone: 'red', n: `${i.ref} — ${i.type.toLowerCase()}`,
      s: `${i.vehicle} · ${siteName(i.site)}`, r: i.severity.toLowerCase(),
      go: () => run('goto:incidents'),
    })),
    ...grounded.slice(0, 3).map((v) => ({
      icon: 'alert', tone: 'red', n: `${v.plate} — grounded`,
      s: `${v.make} · ${siteName(v.site)}`, r: 'off road',
      go: () => { select('vehicle', v.plate); goTab('fleet'); },
    })),
    ...openDefects.filter((d) => d.status === 'Overdue').slice(0, 2).map((d) => ({
      icon: 'clock', tone: 'red', n: `${d.item} — concession lapsed`,
      s: `${d.plate} · ${siteName(d.site)}`, r: 'lapsed',
      go: () => run('openDefect:' + d.id),
    })),
    ...(lapsedCof.length ? [{
      icon: 'cert', tone: 'red', n: `${lapsedCof.length} vehicle${lapsedCof.length === 1 ? '' : 's'} with a lapsed COF`,
      s: 'may not be dispatched until renewed', r: 'not legal',
      go: () => run('goto:compliance'),
    }] : []),
    ...(lapsedPeople.length ? [{
      icon: 'user', tone: 'red', n: `${lapsedPeople.length} operator certificate${lapsedPeople.length === 1 ? '' : 's'} lapsed`,
      s: 'licence, operating card or medical', r: 'not cleared',
      go: () => run('complianceView:operators'),
    }] : []),
    ...(fuelExceptions.length ? [{
      icon: 'fuel', tone: 'gold', n: `${fuelExceptions.length} fuel exception${fuelExceptions.length === 1 ? '' : 's'}`,
      s: 'fills that will not reconcile against the meter', r: 'unposted',
      go: () => run('fuelView:exceptions'),
    }] : []),
    ...(illegalTyres.length ? [{
      icon: 'tyre', tone: 'red', n: `${illegalTyres.length} tyre${illegalTyres.length === 1 ? '' : 's'} below 3 mm`,
      s: 'below the legal tread depth', r: 'not roadworthy',
      go: () => run('tyresView:legal'),
    }] : []),
    ...(outOfStock.length ? [{
      icon: 'part', tone: 'gold', n: `${outOfStock.length} part line${outOfStock.length === 1 ? '' : 's'} out of stock`,
      s: 'the workshop cannot start this work', r: 'empty bin',
      go: () => run('partsView:reorder'),
    }] : []),
    ...(overdueInv.length ? [{
      icon: 'invoice', tone: 'gold', n: `${R(overdueInv.reduce((a, i) => a + invDue(i), 0))} overdue from customers`,
      s: `${overdueInv.length} invoice${overdueInv.length === 1 ? '' : 's'} past the 30-day term`, r: 'to collect',
      go: () => run('billingView:aging'),
    }] : []),
  ].slice(0, 8);

  /* aging bins, built from the defects that are actually open
     rather than from a fixed table */
  const agingTotal = openDefects.length;
  const aging = (() => {
    const bins = [
      { b: '0–7 days', v: 0, c: SEQ[1] }, { b: '8–14 days', v: 0, c: SEQ[2] },
      { b: '15–21 days', v: 0, c: SEQ[3] }, { b: `22–${settings.goButMaxDays} days`, v: 0, c: SEQ[4] },
      { b: 'past the window', v: 0, c: '#C33B3B', breach: true },
    ];
    defects.filter((d) => d.status !== 'Closed').forEach((d) => {
      const n = d.age > settings.goButMaxDays || d.status === 'Overdue' ? 4
        : d.age <= 7 ? 0 : d.age <= 14 ? 1 : d.age <= 21 ? 2 : 3;
      bins[n].v += 1;
    });
    return bins;
  })();

  const isoData = SITE_SERIES.map((s) => ({ co: s.site, c: s.c, v: s.v }));
  const isoNote = { iso: 'isometric · height is volume', bars: 'grouped columns · same data', table: 'exact values' }[isoView];

  return (
    <>
      <div className="cmdstrip solo">
        <div className="glance">
          <span><b>{users.length}</b> people</span>
          <span><b>{fleetTotal}</b> vehicles and plant</span>
          <span><b>{jobs.filter((j) => j.status === 'In transit' || j.status === 'Loading').length}</b> jobs on the road</span>
          <span><b>{workOrders.filter((w) => w.status !== 'Completed').length}</b> job cards open</span>
          <span><b>{openDefects.length}</b> open defects</span>
          <span><b>{pendingApprovals.length}</b> awaiting approval</span>
        </div>
        <div className="count" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Seg value={period} onChange={setPeriod}
            options={[{ v: 6, l: '6 months' }, { v: 12, l: '12 months' }]} />
          <Btn small icon={RefreshCw} onClick={() => run('refresh')}>Refresh</Btn>
        </div>
      </div>

      {/* The operation in four numbers: what it earned, what it cost,
          how much of the fleet could work, and what is on fire. */}
      <Kpis items={[
        { l: 'Revenue delivered', v: R(revenue).replace('R ', ''), unit: 'R', icon: Route,
          dir: jobMarginTotal > 0 ? 'up' : 'dn',
          delta: `${revenue ? ((jobMarginTotal / revenue) * 100).toFixed(1) : '0'}% margin`,
          note: `${delivered.length} haulage jobs this period` },
        { l: 'Fleet cost', v: R(spend).replace('R ', ''), unit: 'R', icon: Coins,
          dir: spend <= budgetTotal ? 'up' : 'dn',
          delta: `${((spend / budgetTotal) * 100).toFixed(0)}% of budget`,
          note: `R ${(meterRun ? spend / meterRun : 0).toFixed(2)} per kilometre or hour run` },
        { l: 'Outstanding from customers', v: R(outstanding).replace('R ', ''), unit: 'R', icon: Banknote,
          dir: overdueInv.length ? 'dn' : 'flat',
          delta: overdueInv.length ? `${overdueInv.length} overdue` : 'nothing past term',
          note: `${invoices.length} invoices on the book` },
        { l: 'Needing a decision', v: attention.length, icon: AlertTriangle,
          dir: criticalIncidents.length ? 'dn' : 'warn',
          delta: criticalIncidents.length ? `${criticalIncidents.length} critical` : `${pendingApprovals.length} approvals`,
          note: 'exceptions across every module' },
      ]} />

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
        <ChartCard title="Inspections by site" note={isoNote}
          right={
            <>
              <Legend items={isoData.map((d) => ({ c: d.c, l: d.co }))} />
              <Seg value={isoView} onChange={setIsoView} options={[
                { v: 'iso', l: '3D', icon: Box },
                { v: 'bars', l: '2D', icon: BarChart3 },
                { v: 'table', l: 'Table', icon: Table2 },
              ]} />
            </>
          }>
          {isoView === 'iso' && <Iso3D data={isoData} months={SITE_MONTHS} />}
          {isoView === 'bars' && <GroupedBars data={isoData} months={SITE_MONTHS} />}
          {isoView === 'table' && (
            <div className="gridwrap" style={{ margin: -12 }}>
              <table className="grid">
                <thead>
                  <tr><th>Site</th>{SITE_MONTHS.map((m) => <th key={m} className="num">{m}</th>)}<th className="num">Total</th></tr>
                </thead>
                <tbody>
                  {isoData.map((d) => (
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
                    <td>All sites</td>
                    {SITE_MONTHS.map((m, i) => <td className="num" key={m}>{nf(isoData.reduce((a, d) => a + d.v[i], 0))}</td>)}
                    <td className="num">{nf(isoData.reduce((a, d) => a + d.v.reduce((x, y) => x + y, 0), 0))}</td>
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
          <div className="chart-body chart"><AgingChart data={aging} total={agingTotal} /></div>
          <div style={{ padding: '0 12px 4px' }}><SecHead>Oldest open items</SecHead></div>
          <div className="panel-body flush">
            {[...openDefects].sort((a, b) => b.age - a.age).slice(0, 4).map((a) => (
              <ListRow key={a.id}
                avatar={<Avatar tone={a.age > 30 ? 'red' : 'gold'} icon={AlertTriangle} />}
                title={a.item} sub={`${a.plate} · ${siteName(a.site)}`}
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
        right={<><Badge tone="gold">{inspections.filter((i) => !i.signed).length} pending</Badge>{' '}
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
                  <td style={{ color: 'var(--text2)' }}>{siteName(i.site)}</td>
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
        <Panel title="Where the month's money went" note="fleet cost by head, this month" flush
          right={<button className="link" onClick={() => goTab('costs')}>Cost control</button>}>
          <Breakdown format={R} rows={[
            ['Fuel and lubricants', vehicles.reduce((a, v) => a + (v.month?.fuel || 0), 0), SERIES[0]],
            ['Maintenance and repair', vehicles.reduce((a, v) => a + (v.month?.maint || 0), 0), SERIES[1]],
            ['Finance and leases', vehicles.reduce((a, v) => a + (v.finance?.instalment || 0), 0), SERIES[3]],
            ['Tyres', vehicles.reduce((a, v) => a + (v.month?.tyres || 0), 0), SERIES[2]],
            ['Consumables', vehicles.reduce((a, v) => a + (v.month?.consumables || 0), 0), SERIES[4]],
          ].map(([k, v, c]) => ({ k, v, c })).sort((a, b) => b.v - a.v)} />
        </Panel>

        <Panel title="Most expensive vehicles to run" note="cost per kilometre or hour, this month" flush
          right={<button className="link" onClick={() => goTab('costs')}>All vehicles</button>}>
          <Breakdown format={(v) => 'R ' + v.toFixed(2)} colour={SERIES[4]}
            rows={[...vehicles].filter((v) => v.month?.meter).sort((a, b) => vehCpk(b) - vehCpk(a)).slice(0, 6)
              .map((v) => ({
                k: `${v.plate} · ${v.type}`, v: +vehCpk(v).toFixed(2),
                onClick: () => { select('vehicle', v.plate); goTab('fleet'); },
              }))} />
        </Panel>
      </div>

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
                title={a.n} sub={a.s} onClick={a.go}
                right={<span style={{ font: '600 11.5px var(--num)', color: `var(--${a.tone})` }}>{a.r}</span>} />
            );
          })}
        </Panel>
      </div>
    </>
  );
}
