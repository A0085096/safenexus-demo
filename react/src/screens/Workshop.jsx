import React, { useMemo } from 'react';
import {
  Wrench, Truck, CheckCircle2, Package, Clock, Coins, CalendarClock, CheckSquare,
  AlertTriangle, PackageMinus, Timer,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown } from '../components/erpUi.jsx';
import { R, num, woCost, meterUnit, WO_TYPES } from '../erp/seed.js';

const tone = (s) => ({
  'Awaiting authorisation': 'gold', 'Awaiting parts': 'gold',
  'In progress': 'blue', 'Road test': 'purple', Completed: 'green',
}[s] || 'grey');

/* ══════════════════════════════════════════════════════════════
   Workshop.

   Where a defect becomes workshop time and workshop time becomes
   money. Every work order raised from a defect keeps the link, so
   a grounded vehicle traces from the sheet that failed it to the
   job that clears it — and every one carries the labour hours and
   the parts issued against it, because a job card without those
   is a note, not a cost.
   ══════════════════════════════════════════════════════════════ */
export default function Workshop({ run }) {
  const {
    workOrders, defects, vehicles, settings, selection, select, subView, setView,
  } = useStore();
  const view = subView.workshop || 'register';

  const open = workOrders.filter((w) => w.status !== 'Completed');
  const awaitingParts = workOrders.filter((w) => w.status === 'Awaiting parts');
  const awaitingAuth = workOrders.filter((w) => w.status === 'Awaiting authorisation');
  const grounding = workOrders.filter((w) => {
    const d = defects.find((x) => x.id === w.defect);
    return w.status !== 'Completed' && d && d.severity === 'No Go';
  });
  const cost = workOrders.reduce((a, w) => a + woCost(w), 0);
  const downtime = open.reduce((a, w) => a + (w.downtimeDays || 0), 0);

  const cols = [
    { key: 'ref', label: 'Job card', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'vehicle', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'type', label: 'Work type', value: (r) => r.type, render: (r) => r.type },
    { key: 'note', label: 'Reported fault', wrap: true, value: (r) => r.fault || r.note,
      render: (r) => <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>{r.fault || r.note}</span> },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'defect', label: 'From defect', value: (r) => r.defect || '',
      render: (r) => (r.defect
        ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={(e) => { e.stopPropagation(); run('openDefect:' + r.defect); }}>{r.defect}</button>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'opened', label: 'Opened', value: (r) => r.opened, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.opened}</span> },
    { key: 'dt', label: 'Days down', num: true, value: (r) => r.downtimeDays,
      render: (r) => {
        const late = r.downtimeDays > settings.downtimeEscalationDays && r.status !== 'Completed';
        return <span style={{ fontFamily: 'var(--num)', fontWeight: late ? 600 : 400,
          color: late ? 'var(--red)' : 'var(--text)' }}>{r.downtimeDays}</span>;
      } },
    { key: 'lab', label: 'Labour', num: true, value: (r) => r.labourHours,
      render: (r) => <span style={{ fontFamily: 'var(--num)' }}>{r.labourHours} h</span> },
    { key: 'prt', label: 'Parts', num: true, value: (r) => (r.parts || []).length,
      render: (r) => ((r.parts || []).length
        ? <span>{r.parts.length} <span style={{ color: 'var(--text3)', fontSize: 11 }}>lines</span></span>
        : <span style={{ color: 'var(--text3)' }}>none</span>) },
    { key: 'cost', label: 'Job cost', num: true, value: (r) => woCost(r), render: (r) => <Money v={woCost(r)} bold /> },
    { key: 'p', label: 'Priority', value: (r) => ['Critical', 'High', 'Normal'].indexOf(r.priority),
      render: (r) => <Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'High' ? 'gold' : 'grey'}>{r.priority}</Badge> },
    { key: 'status', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={tone(r.status)}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('workshop', v)} options={[
      { v: 'register', l: `Job cards (${workOrders.length})`, icon: Wrench },
      { v: 'open', l: `Open (${open.length})`, icon: Clock },
      { v: 'planner', l: 'Service planner', icon: CalendarClock },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Open job cards', v: open.length, icon: Wrench,
        note: `${workOrders.length} raised · ${workOrders.filter((w) => w.defect).length} traceable to a failed sheet` },
      { l: 'Blocked', v: awaitingParts.length + awaitingAuth.length, icon: Package,
        dir: (awaitingParts.length + awaitingAuth.length) ? 'dn' : 'up',
        delta: `${awaitingParts.length} on parts · ${awaitingAuth.length} on authorisation`,
        note: 'work the workshop cannot start' },
      { l: 'Holding a vehicle off the road', v: grounding.length, icon: Truck,
        dir: grounding.length ? 'dn' : 'up',
        delta: `${downtime} days down in total`,
        note: 'raised from a no-go defect' },
      { l: 'Workshop cost', v: R(cost).replace('R ', ''), unit: 'R', icon: Coins,
        note: `labour at ${R(settings.labourRate)} an hour, plus the parts issued` },
    ]} />
  );

  if (view === 'planner') return <><>{kpis}</><Planner vehicles={vehicles} workOrders={workOrders} settings={settings} switcher={switcher} run={run} select={select} /></>;

  const rows = view === 'open' ? open : workOrders;

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.ref} totalLabel={workOrders.length} pageSize={20}
        selected={selection.workOrder} onSelect={(k) => select('workOrder', k)}
        rowClass={(r) => (r.priority === 'Critical' && r.status !== 'Completed' ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={CheckSquare} onClick={() => run('authoriseWO')}>Authorise</Btn>
            <Btn small icon={Timer} onClick={() => run('bookLabour')}>Book labour</Btn>
            <Btn small icon={PackageMinus} onClick={() => run('issuePart')}>Issue parts</Btn>
            <Btn small icon={CheckCircle2} onClick={() => run('woStatus:Completed')}>Complete</Btn>
          </>
        }
        totals={(list) => (
          <>
            <td colSpan={7} style={{ fontWeight: 600 }}>{list.length} job cards</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + (r.downtimeDays || 0), 0)}</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + (r.labourHours || 0), 0).toFixed(1)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + (r.parts || []).length, 0)}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + woCost(r), 0))}</td>
            <td colSpan={2} />
          </>
        )} />
    </>
  );
}

/* ── the service planner ────────────────────────────────────────
   Preventive maintenance is a forecast, not a list: a vehicle is
   due not when the meter hits the interval but when the rate it is
   running at says it will. Sorted by how many days that leaves.  */
function Planner({ vehicles, workOrders, settings, switcher, run, select }) {
  const rows = useMemo(() => vehicles.map((v) => {
    const left = v.serviceDue - v.km;
    /* what it actually runs in a month, so the forecast is its own
       rate rather than a fleet average */
    const perDay = (v.month?.meter || 0) / 30;
    const days = perDay > 0 ? Math.round(left / perDay) : null;
    const booked = workOrders.some((w) => w.vehicle === v.plate && w.status !== 'Completed' && w.type.startsWith('Scheduled'));
    return { ...v, left, perDay, days, booked };
  }).sort((a, b) => {
    const x = a.days == null ? 99999 : a.days;
    const y = b.days == null ? 99999 : b.days;
    return x - y;
  }), [vehicles, workOrders]);

  const overdue = rows.filter((r) => r.left <= 0);
  const soon = rows.filter((r) => r.left > 0 && r.days != null && r.days <= 30);
  const unbooked = [...overdue, ...soon].filter((r) => !r.booked);

  const cols = [
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'a', label: 'Asset', wrap: true, value: (r) => r.make, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.fleetNo}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.year} {r.make}</div></div>
    ) },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'm', label: 'Meter now', num: true, value: (r) => r.km,
      render: (r) => <span>{num(r.km)} <span style={{ color: 'var(--text3)', fontSize: 11 }}>{meterUnit(r)}</span></span> },
    { key: 'i', label: 'Interval', num: true, value: (r) => r.interval, render: (r) => num(r.interval) },
    { key: 'd', label: 'Due at', num: true, value: (r) => r.serviceDue, render: (r) => num(r.serviceDue) },
    { key: 'l', label: 'Left to run', num: true, value: (r) => r.left, render: (r) => (
      <span style={{ fontFamily: 'var(--num)', fontWeight: r.left <= 0 ? 600 : 400,
        color: r.left <= 0 ? 'var(--red)' : r.left < settings.serviceWarnKm ? 'var(--gold)' : 'var(--text)' }}>
        {r.left <= 0 ? `${num(-r.left)} over` : num(r.left)}
      </span>
    ) },
    { key: 'r', label: 'Running at', num: true, value: (r) => r.perDay,
      render: (r) => (r.perDay > 0
        ? <span style={{ fontFamily: 'var(--num)', color: 'var(--text2)' }}>{r.perDay.toFixed(0)} a day</span>
        : <span style={{ color: 'var(--text3)' }}>idle</span>) },
    { key: 'f', label: 'Forecast', num: true, value: (r) => (r.days == null ? 99999 : r.days), render: (r) => {
      if (r.left <= 0) return <Badge tone="red">Overdue</Badge>;
      if (r.days == null) return <span style={{ color: 'var(--text3)' }}>not running</span>;
      return <Badge tone={r.days <= 7 ? 'red' : r.days <= 30 ? 'gold' : r.days <= 60 ? 'blue' : 'green'}>
        {r.days} days
      </Badge>;
    } },
    { key: 'b', label: 'Booked', value: (r) => (r.booked ? 'Yes' : 'No'),
      render: (r) => (r.booked
        ? <Badge tone="green">On the board</Badge>
        : (r.left <= 0 || (r.days != null && r.days <= 30))
          ? <Btn small icon={CalendarClock} onClick={(e) => { e.stopPropagation(); select('vehicle', r.plate); run('bookService'); }}>Book it</Btn>
          : <span style={{ color: 'var(--text3)' }}>—</span>) },
  ];

  return (
    <>
      {unbooked.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} strokeWidth={1.8} />
          <span>
            <b>{unbooked.length} vehicle{unbooked.length === 1 ? '' : 's'}</b> {unbooked.length === 1 ? 'is' : 'are'} due
            or overdue for a service with nothing booked. The forecast is each machine’s own running rate, not a
            fleet average, so a vehicle doing 400 km a day reaches its interval three times faster than one doing 130.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.plate} toolbar={switcher} pageSize={20}
        onSelect={(k) => select('vehicle', k)}
        rowClass={(r) => (r.left <= 0 && !r.booked ? 'overdue' : '')} />
      <div className="grid-2">
        <Panel title="Job cards by work type" note="where the workshop's time goes" flush>
          <Breakdown rows={WO_TYPES.map((t, i) => ({
            k: t, c: SERIES[i % SERIES.length],
            v: workOrders.filter((w) => w.type === t).length,
          })).filter((r) => r.v).sort((a, b) => b.v - a.v)} />
        </Panel>
        <Panel title="Cost by work type" note="the same book of work, weighted by money" flush>
          <Breakdown format={R} rows={WO_TYPES.map((t, i) => ({
            k: t, c: SERIES[i % SERIES.length],
            v: workOrders.filter((w) => w.type === t).reduce((a, w) => a + woCost(w), 0),
          })).filter((r) => r.v).sort((a, b) => b.v - a.v)} />
        </Panel>
      </div>
    </>
  );
}
