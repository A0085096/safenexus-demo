import React, { useMemo } from 'react';
import {
  Fuel as FuelIcon, Plus, AlertTriangle, CheckCircle2, Gauge, Droplets, TrendingDown,
  Receipt,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Bar } from '../components/erpUi.jsx';
import { R, num, fmtShort } from '../erp/seed.js';

/* ══════════════════════════════════════════════════════════════
   Fuel.

   Diesel is the largest single cost on a mine's fleet, and the
   easiest to lose. The register is therefore not a list of fills:
   it is a list of fills measured against what the vehicle should
   have burned. A transaction the system cannot reconcile stays an
   exception until a person clears it, with a reason, in the trail.
   ══════════════════════════════════════════════════════════════ */
export default function Fuel({ run, openDialog }) {
  const { fuel, vehicles, settings, selection, select, subView, setView } = useStore();
  const view = subView.fuel || 'register';

  const exceptions = fuel.filter((f) => f.exception);
  const unverified = fuel.filter((f) => f.status === 'Unverified');
  const litres = fuel.reduce((a, f) => a + f.litres, 0);
  const spend = fuel.reduce((a, f) => a + f.amount, 0);
  const avgRate = litres ? spend / litres : 0;

  const cols = [
    { key: 'ref', label: 'Transaction', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'date', label: 'Date', value: (r) => r.date + r.time, render: (r) => (
      <span>{fmtShort(r.date)} <span style={{ color: 'var(--text3)' }}>{r.time}</span></span>
    ) },
    { key: 'veh', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'drv', label: 'Operator', value: (r) => r.driver, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.driver}</span> },
    { key: 'st', label: 'Station', wrap: true, value: (r) => r.station, render: (r) => (
      <div><div>{r.station}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.card}</div></div>
    ) },
    { key: 'l', label: 'Litres', num: true, value: (r) => r.litres, render: (r) => num(r.litres) },
    { key: 'rate', label: 'Rate', num: true, value: (r) => r.rate, render: (r) => 'R ' + r.rate.toFixed(2) },
    { key: 'amt', label: 'Amount', num: true, value: (r) => r.amount, render: (r) => <Money v={r.amount} /> },
    { key: 'meter', label: 'Meter', num: true, value: (r) => r.meter, render: (r) => num(r.meter) },
    { key: 'cons', label: 'Consumption', num: true, value: (r) => r.consumption,
      render: (r) => <span style={{ fontFamily: 'var(--num)' }}>{r.consumption} <span style={{ color: 'var(--text3)', fontSize: 11 }}>{r.unit}</span></span> },
    { key: 'var', label: 'vs target', num: true, value: (r) => r.variance,
      render: (r) => (r.variance
        ? <span style={{ fontFamily: 'var(--num)', fontWeight: 600, color: Math.abs(r.variance) > settings.fuelVariancePct ? 'var(--red)' : r.variance < 0 ? 'var(--gold)' : 'var(--green)' }}>
            {r.variance > 0 ? '+' : ''}{r.variance}%
          </span>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'exc', label: 'Exception', wrap: true, value: (r) => r.exception || '',
      render: (r) => (r.exception
        ? <span style={{ color: 'var(--red)', fontSize: 11.5 }}>{r.exception}</span>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'status', label: 'Status', value: (r) => r.status,
      render: (r) => <Badge tone={r.status === 'Verified' ? 'green' : r.status === 'Exception' ? 'red' : 'gold'}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('fuel', v)} options={[
      { v: 'register', l: `Transactions (${fuel.length})`, icon: Receipt },
      { v: 'exceptions', l: `Exceptions (${exceptions.length})`, icon: AlertTriangle },
      { v: 'consumption', l: 'Consumption', icon: Gauge },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Litres drawn', v: num(litres), unit: 'L', icon: Droplets, note: `${fuel.length} transactions in the period` },
      { l: 'Fuel spend', v: R(spend).replace('R ', ''), unit: 'R', icon: FuelIcon,
        note: `average R ${avgRate.toFixed(2)} per litre` },
      { l: 'Exceptions', v: exceptions.length, icon: AlertTriangle,
        dir: exceptions.length ? 'dn' : 'up', delta: exceptions.length ? 'needs a reason' : 'clear',
        note: 'a fill the system could not reconcile' },
      { l: 'Awaiting verification', v: unverified.length, icon: CheckCircle2,
        note: 'not yet checked against the meter reading' },
    ]} />
  );

  if (view === 'consumption') return <><>{kpis}</><Consumption fuel={fuel} vehicles={vehicles} settings={settings} switcher={switcher} run={run} /></>;

  const rows = view === 'exceptions' ? exceptions : fuel;

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.ref} totalLabel={fuel.length}
        selected={selection.fuel} onSelect={(k) => select('fuel', k)}
        rowClass={(r) => (r.exception ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Plus} onClick={() => openDialog('fuel')}>Capture a fill</Btn>
            <Btn small icon={CheckCircle2} onClick={() => run('verifyFuel')}>Verify</Btn>
            <Btn small icon={AlertTriangle} onClick={() => run('clearException')}>Clear exception</Btn>
          </>
        }
        emptyText={view === 'exceptions'
          ? 'No transaction is in exception. Every fill reconciles against its meter reading.'
          : 'No fuel transaction matches this filter.'}
        totals={(list) => (
          <>
            <td colSpan={5} style={{ fontWeight: 600 }}>{list.length} transactions</td>
            <td className="num" style={{ fontWeight: 600 }}>{num(list.reduce((a, r) => a + r.litres, 0))}</td>
            <td />
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + r.amount, 0))}</td>
            <td colSpan={5} />
          </>
        )} />
    </>
  );
}

/* ── consumption against the model ──────────────────────────────
   Every vehicle type carries a target — kilometres per litre for
   wheels, litres per hour for plant. A vehicle 12% off its target
   is either broken, badly driven, or being drained. */
function Consumption({ fuel, vehicles, settings, switcher, run }) {
  const limit = settings.fuelVariancePct;
  const rows = useMemo(() => {
    const by = {};
    fuel.forEach((f) => {
      const v = vehicles.find((x) => x.plate === f.vehicle);
      if (!v) return;
      const r = (by[f.vehicle] = by[f.vehicle] || {
        vehicle: f.vehicle, fleetNo: f.fleetNo, type: v.type, site: v.site,
        plant: v.meterType === 'hours', target: v.meterType === 'hours' ? 18 : v.targetRate,
        n: 0, litres: 0, spend: 0, since: 0, exceptions: 0,
      });
      r.n += 1; r.litres += f.litres; r.spend += f.amount; r.since += f.since;
      r.exceptions += f.exception ? 1 : 0;
    });
    return Object.values(by).map((r) => {
      const actual = r.plant ? r.litres / Math.max(1, r.since) : r.since / Math.max(1, r.litres);
      const variance = r.target ? ((actual - r.target) / r.target) * 100 * (r.plant ? -1 : 1) : 0;
      return { ...r, actual, variance };
    }).sort((a, b) => a.variance - b.variance);
  }, [fuel, vehicles]);

  const worst = rows.filter((r) => r.variance < -limit);

  const cols = [
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'f', label: 'Fleet no.', value: (r) => r.fleetNo, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.fleetNo}</span> },
    { key: 't', label: 'Type', value: (r) => r.type, render: (r) => <Badge tone="grey">{r.type}</Badge> },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'n', label: 'Fills', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'l', label: 'Litres', num: true, value: (r) => r.litres, render: (r) => num(r.litres) },
    { key: 'sp', label: 'Spend', num: true, value: (r) => r.spend, render: (r) => <Money v={r.spend} /> },
    { key: 'tg', label: 'Target', num: true, value: (r) => r.target,
      render: (r) => <span style={{ color: 'var(--text2)', fontFamily: 'var(--num)' }}>{r.target || '—'} {r.plant ? 'L/h' : 'km/L'}</span> },
    { key: 'ac', label: 'Actual', num: true, value: (r) => r.actual,
      render: (r) => <span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>{r.actual.toFixed(2)}</span> },
    { key: 'var', label: 'Variance', num: true, value: (r) => r.variance, render: (r) => {
      const bad = r.variance < -limit;
      return (
        <Bar value={Math.min(30, Math.abs(r.variance))} max={30}
          colour={bad ? SERIES[4] : r.variance < 0 ? SERIES[2] : SERIES[1]}
          label={`${r.variance > 0 ? '+' : ''}${r.variance.toFixed(1)}%`} />
      );
    } },
    { key: 'e', label: 'Exceptions', num: true, value: (r) => r.exceptions,
      render: (r) => <span style={{ color: r.exceptions ? 'var(--red)' : 'var(--text3)', fontWeight: r.exceptions ? 600 : 400 }}>{r.exceptions}</span> },
  ];

  return (
    <>
      {worst.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <TrendingDown size={15} strokeWidth={1.8} />
          <span>
            <b>{worst.length} vehicle{worst.length === 1 ? '' : 's'}</b> {worst.length === 1 ? 'is' : 'are'} burning
            more than {limit}% above the model target — the alert threshold set on the Settings tab. That is either a
            fault, a driving pattern or a loss, and each one is worth a work order before it is worth an argument.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.vehicle} toolbar={switcher}
        rowClass={(r) => (r.variance < -limit ? 'overdue' : '')}
        emptyText="No vehicle has drawn fuel in the period." />
      <div className="grid-2">
        <Panel title="Spend by site" flush>
          <Breakdown format={R} rows={['PIT', 'STL', 'HO'].map((k, i) => ({
            k: siteName(k), c: SERIES[i],
            v: rows.filter((r) => r.site === k).reduce((a, r) => a + r.spend, 0),
          }))} />
        </Panel>
        <Panel title="Spend by vehicle class" flush>
          <Breakdown format={R} rows={[...new Set(rows.map((r) => r.type))].map((t, i) => ({
            k: t, c: SERIES[i % SERIES.length],
            v: rows.filter((r) => r.type === t).reduce((a, r) => a + r.spend, 0),
          })).sort((a, b) => b.v - a.v)} />
        </Panel>
      </div>
    </>
  );
}
