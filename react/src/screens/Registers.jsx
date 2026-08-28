import React, { useState } from 'react';
import {
  UserPlus, Plus, ClipboardCheck, AlertTriangle, FileCheck2, Car, Truck, Wrench,
  Gauge, Coins, ShieldCheck, Route, Radio,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { nf, targetTone, SERIES } from '../theme.js';
import { siteName } from '../data.js';
import {
  DataGrid, Btn, Badge, Avatar, RichText, Seg,
  statusBadge, roleBadge, planBadge, vehicleBadge, resultBadge,
} from '../components/ui.jsx';
import { Kpis, Money, Expiry, Bar } from '../components/erpUi.jsx';
import { R, num, until, vehSpend, vehCpk, meterUnit } from '../erp/seed.js';



const Person = ({ init, tone, name, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <Avatar init={init} tone={tone} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{name}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  </div>
);

/* ── operators ────────────────────────────────────────────────
   The people register, read the way a fleet reads it: who they
   are, what they may legally operate, how well they operate it,
   and what that costs. A name and a role is a directory; this is
   a workforce.  */
export function Users({ run, openDialog }) {
  const { users, jobs, incidents, selection, select } = useStore();
  const [filter, setFilter] = useState('all');

  const operators = users.filter((u) => u.role === 'Operator');
  const lapsed = users.filter((u) => [u.licenceExpiry, u.prdpExpiry, u.medicalExpiry]
    .filter(Boolean).some((d) => until(d) < 0));
  const overHours = operators.filter((u) => u.hoursWeek > 55);
  const coaching = operators.filter((u) => u.score < 65);

  const cols = [
    { key: 'u', label: 'Person', value: (r) => r.name,
      render: (r) => <Person init={r.init} tone={r.tone} name={r.name} sub={`${r.empNo} · ${r.code}`} /> },
    { key: 'role', label: 'Role', value: (r) => r.role, render: (r) => roleBadge(r.role) },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'rep', label: 'Reports to', value: (r) => r.reports, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.reports}</span> },
    { key: 'veh', label: 'Vehicle', mono: true, value: (r) => r.vehicle,
      render: (r) => (r.vehicle === '—' ? <span style={{ color: 'var(--text3)' }}>—</span> : r.vehicle) },
    { key: 'lic', label: 'Licence', value: (r) => r.licenceCode,
      render: (r) => <span style={{ fontSize: 11.5, color: 'var(--text2)' }}>{r.licenceCode}</span> },
    { key: 'prdp', label: 'Operating card', num: true, value: (r) => (r.prdpExpiry ? until(r.prdpExpiry) : 99999),
      render: (r) => (r.prdpExpiry ? <Expiry date={r.prdpExpiry} showDate={false} /> : <span style={{ color: 'var(--text3)' }}>n/a</span>) },
    { key: 'med', label: 'Medical', num: true, value: (r) => until(r.medicalExpiry),
      render: (r) => <Expiry date={r.medicalExpiry} showDate={false} /> },
    { key: 'hrs', label: 'Hours, week', num: true, value: (r) => r.hoursWeek,
      render: (r) => <span style={{ fontFamily: 'var(--num)', fontWeight: r.hoursWeek > 55 ? 600 : 400,
        color: r.hoursWeek > 60 ? 'var(--red)' : r.hoursWeek > 55 ? 'var(--gold)' : 'var(--text)' }}>{r.hoursWeek}</span> },
    { key: 'insp', label: 'Sheets', num: true, value: (r) => r.insps, render: (r) => r.insps },
    { key: 'jobs', label: 'Jobs, month', num: true, value: (r) => r.jobsMonth,
      render: (r) => (r.jobsMonth ? r.jobsMonth : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'score', label: 'Behaviour score', num: true, value: (r) => r.score, render: (r) => (
      <Bar value={r.score} max={100} target={70}
        colour={r.score >= 75 ? SERIES[1] : r.score >= 55 ? SERIES[2] : SERIES[4]}
        label={String(r.score)} width={54} />
    ) },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => statusBadge(r.status) },
    { key: 'act', label: '', render: (r) => <Btn small onClick={(e) => { e.stopPropagation(); select('user', r.name); run('editUser'); }}>Edit</Btn> },
  ];

  const rows = users.filter((u) => (
    filter === 'operators' ? u.role === 'Operator'
      : filter === 'lapsed' ? [u.licenceExpiry, u.prdpExpiry, u.medicalExpiry].filter(Boolean).some((d) => until(d) < 0)
        : filter === 'hours' ? u.hoursWeek > 55
          : filter === 'coaching' ? u.role === 'Operator' && u.score < 65
            : filter === 'unassigned' ? u.role === 'Operator' && u.vehicle === '—'
              : true));

  return (
    <>
      <Kpis items={[
        { l: 'People on the platform', v: users.length, icon: UserPlus,
          note: `${operators.length} operators · ${users.filter((u) => u.role === 'Supervisor').length} supervisors` },
        { l: 'Certificates lapsed', v: lapsed.length, icon: ShieldCheck,
          dir: lapsed.length ? 'dn' : 'up',
          note: 'licence, operating card or medical past its date' },
        { l: 'Over 55 hours this week', v: overHours.length, icon: Gauge,
          dir: overHours.length ? 'warn' : 'up',
          note: 'dispatch blocks a job that would pass the 60-hour ceiling' },
        { l: 'Below the coaching line', v: coaching.length, icon: Radio,
          dir: coaching.length ? 'warn' : 'up',
          delta: `${operators.filter((u) => u.score < 45).length} stood down`,
          note: 'behaviour score from the telematics feed' },
      ]} />
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.name} totalLabel={users.length} pageSize={20}
        selected={selection.user} onSelect={(k) => select('user', k)}
        rowClass={(r) => ([r.licenceExpiry, r.prdpExpiry, r.medicalExpiry].filter(Boolean).some((d) => until(d) < 0) ? 'overdue' : '')}
        toolbar={
          <>
            {[['all', 'All'], ['operators', 'Operators'], ['lapsed', 'Certificate lapsed'],
              ['hours', 'Over hours'], ['coaching', 'Coaching due'], ['unassigned', 'No vehicle']].map(([v, l]) => (
                <Btn key={v} small active={filter === v} onClick={() => setFilter(v)}>{l}</Btn>
              ))}
            <Btn small primary icon={UserPlus} onClick={() => openDialog('user')}>New user</Btn>
            <Btn small icon={Car} onClick={() => run('assignUserVehicle')}>Assign a vehicle</Btn>
          </>
        }
        emptyText="No person matches this filter." />
    </>
  );
}

/* ── fleet ────────────────────────────────────────────────────
   The register the whole platform hangs off. A vehicle is not one
   record here — it is the meter reading the inspection wrote, the
   defects that ground it, the fuel it burned, the money it costs
   and the certificates that decide whether it may move at all.  */
export function Fleet({ run, openDialog }) {
  const { vehicles, defects, settings, selection, select } = useStore();
  const [filter, setFilter] = useState('all');
  const openFor = (plate) => defects.filter((d) => d.plate === plate && d.status === 'Open');

  const grounded = vehicles.filter((v) => v.status === 'Maintenance');
  const dueService = vehicles.filter((v) => v.serviceDue - v.km <= settings.serviceWarnKm);
  const lapsedCof = vehicles.filter((v) => until(v.cofExpiry) < 0);
  const spend = vehicles.reduce((a, v) => a + vehSpend(v), 0);
  const meter = vehicles.reduce((a, v) => a + (v.month?.meter || 0), 0);

  const cols = [
    { key: 'plate', label: 'Plate', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'fleetNo', label: 'Fleet no.', value: (r) => r.fleetNo, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.fleetNo}</span> },
    { key: 'make', label: 'Make and model', wrap: true, value: (r) => r.make, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.make}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.year} · {r.type}</div></div>
    ) },
    { key: 'cls', label: 'Class', value: (r) => r.cls, render: (r) => <Badge tone="grey">{r.cls}</Badge> },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'driver', label: 'Assigned to', value: (r) => r.driver,
      render: (r) => (r.driver === '—' ? <span style={{ color: 'var(--text3)' }}>unassigned</span> : r.driver) },
    { key: 'km', label: 'Meter', num: true, value: (r) => r.km,
      render: (r) => <span>{nf(r.km)} <span style={{ color: 'var(--text3)', fontSize: 11 }}>{meterUnit(r)}</span></span> },
    { key: 'sv', label: 'Service in', num: true, value: (r) => r.serviceDue - r.km, render: (r) => {
      const left = r.serviceDue - r.km;
      return (
        <span style={{ fontFamily: 'var(--num)', fontWeight: left <= 0 ? 600 : 400,
          color: left <= 0 ? 'var(--red)' : left < settings.serviceWarnKm ? 'var(--gold)' : 'var(--text)' }}>
          {left <= 0 ? `${nf(-left)} over` : nf(left)}
        </span>
      );
    } },
    { key: 'cof', label: 'COF', num: true, value: (r) => until(r.cofExpiry),
      render: (r) => <Expiry date={r.cofExpiry} showDate={false} /> },
    { key: 'util', label: 'Utilisation', num: true, value: (r) => r.month?.utilPct, render: (r) => (
      <Bar value={r.month?.utilPct || 0} max={100} target={70}
        colour={(r.month?.utilPct || 0) >= 70 ? SERIES[1] : (r.month?.utilPct || 0) >= 45 ? SERIES[2] : SERIES[4]}
        label={(r.month?.utilPct || 0) + '%'} width={54} />
    ) },
    { key: 'cpk', label: 'Cost per unit run', num: true, value: (r) => vehCpk(r),
      render: (r) => (vehCpk(r)
        ? <span style={{ fontFamily: 'var(--num)' }}>R {vehCpk(r).toFixed(2)}</span>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'insp', label: 'Last inspection', value: (r) => r.lastInsp, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.lastInsp}</span> },
    {
      key: 'def', label: 'Defects', num: true, value: (r) => openFor(r.plate).length,
      render: (r) => {
        const o = openFor(r.plate);
        const bad = o.some((d) => d.severity === 'No Go');
        return o.length
          ? <span style={{ color: bad ? 'var(--red)' : 'var(--gold)', fontWeight: 600 }}>{o.length}</span>
          : <span style={{ color: 'var(--text3)' }}>0</span>;
      },
    },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => vehicleBadge(r.status) },
  ];

  const rows = vehicles.filter((v) => (
    filter === 'grounded' ? v.status === 'Maintenance'
      : filter === 'service' ? v.serviceDue - v.km <= settings.serviceWarnKm
        : filter === 'cof' ? until(v.cofExpiry) < settings.cofWarnDays
          : filter === 'unassigned' ? v.driver === '—'
            : filter === 'plant' ? v.cls === 'Plant'
              : true));

  return (
    <>
      <Kpis items={[
        { l: 'Vehicles and plant', v: vehicles.length, icon: Truck,
          note: `${vehicles.filter((v) => v.driver !== '—').length} assigned · ${vehicles.filter((v) => v.driver === '—').length} in the pool` },
        { l: 'Off the road', v: grounded.length, icon: Wrench,
          dir: grounded.length ? 'dn' : 'up',
          delta: `${((1 - grounded.length / vehicles.length) * 100).toFixed(1)}% available`,
          note: 'grounded by a no-go defect or a service' },
        { l: 'Service or COF due', v: dueService.length + lapsedCof.length, icon: ShieldCheck,
          dir: lapsedCof.length ? 'dn' : 'warn',
          delta: lapsedCof.length ? `${lapsedCof.length} COF lapsed` : 'certificates in force',
          note: `within ${nf(settings.serviceWarnKm)} of the interval` },
        { l: 'Fleet cost this month', v: R(spend).replace('R ', ''), unit: 'R', icon: Coins,
          note: `R ${(meter ? spend / meter : 0).toFixed(2)} per kilometre or hour run` },
      ]} />
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.plate} totalLabel={vehicles.length} pageSize={20}
        selected={selection.vehicle} onSelect={(k) => select('vehicle', k)}
        rowClass={(r) => (r.status === 'Maintenance' || until(r.cofExpiry) < 0 ? 'overdue' : '')}
        toolbar={
          <>
            {[['all', 'All'], ['grounded', 'Off road'], ['service', 'Service due'],
              ['cof', 'COF expiring'], ['unassigned', 'Unassigned'], ['plant', 'Plant']].map(([v, l]) => (
                <Btn key={v} small active={filter === v} onClick={() => setFilter(v)}>{l}</Btn>
              ))}
            <Btn small primary icon={Plus} onClick={() => openDialog('vehicle')}>New vehicle</Btn>
            <Btn small icon={ClipboardCheck} onClick={() => run('startInspection')}>Inspect</Btn>
            <Btn small icon={Car} onClick={() => run('assignVehicle')}>Assign</Btn>
          </>
        }
        emptyText="No vehicle matches this filter."
        totals={(list) => (
          <>
            <td colSpan={6} style={{ fontWeight: 600 }}>{list.length} vehicles</td>
            <td className="num" style={{ fontWeight: 600 }}>{nf(list.reduce((a, r) => a + r.km, 0))}</td>
            <td colSpan={3} />
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + vehSpend(r), 0))}</td>
            <td colSpan={3} />
          </>
        )} />
    </>
  );
}

/* ── inspections and defects ──────────────────────────────────── */
export function Inspections({ run }) {
  const { inspections, defects, selection, select, inspView: view, setInspView: setView, settings } = useStore();
  const [filter, setFilter] = useState('all');
  const [defFilter, setDefFilter] = useState('open');

  const inspCols = [
    { key: 'ref', label: 'Ref', mono: true, value: (r) => r.ref, render: (r) => '#' + r.ref },
    { key: 'date', label: 'Date and time', value: (r) => r.date, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.date}</span> },
    { key: 'veh', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'op', label: 'Operator', value: (r) => r.op, render: (r) => r.op },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'shift', label: 'Shift', value: (r) => r.shift, render: (r) => r.shift },
    { key: 'ok', label: 'In order', num: true, value: (r) => r.ok, render: (r) => <span style={{ color: 'var(--green)', fontWeight: 600 }}>{r.ok}</span> },
    { key: 'go', label: 'Go-but', num: true, value: (r) => r.go, render: (r) => <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.go}</span> },
    { key: 'ng', label: 'No-go', num: true, value: (r) => r.ng, render: (r) => <span style={{ color: 'var(--red)', fontWeight: 600 }}>{r.ng}</span> },
    { key: 'res', label: 'Result', value: (r) => r.result, render: (r) => resultBadge(r.result) },
    {
      key: 'sign', label: 'Sign-off', value: (r) => (r.signed ? 'Signed' : 'Pending'),
      render: (r) => (r.signed ? <Badge tone="green">Signed</Badge> : <Badge tone="gold">Pending</Badge>),
    },
  ];

  const defCols = [
    { key: 'id', label: 'Defect', mono: true, value: (r) => r.id, render: (r) => r.id },
    { key: 'item', label: 'Item', wrap: true, value: (r) => r.item, render: (r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.item}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.section}</div>
      </div>
    ) },
    { key: 'plate', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'sev', label: 'Severity', value: (r) => r.severity, render: (r) => <Badge tone={r.severity === 'No Go' ? 'red' : 'gold'}>{r.severity}</Badge> },
    { key: 'raisedBy', label: 'Raised by', value: (r) => r.raisedBy, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.raisedBy}</span> },
    { key: 'raised', label: 'Raised', value: (r) => r.raised, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.raised}</span> },
    { key: 'due', label: 'Rectify by', value: (r) => r.due,
      render: (r) => <span style={{ color: r.status === 'Overdue' ? 'var(--red)' : 'var(--text2)', fontWeight: r.status === 'Overdue' ? 600 : 400 }}>{r.due}</span> },
    { key: 'signed', label: 'Concession', value: (r) => (r.supervisorSigned ? 'Signed' : 'Unsigned'),
      render: (r) => (r.severity === 'No Go'
        ? <span style={{ color: 'var(--text3)' }}>n/a</span>
        : r.supervisorSigned ? <Badge tone="green">Signed</Badge> : <Badge tone="red">Unsigned</Badge>) },
    { key: 'wo', label: 'Work order', value: (r) => r.workOrder || '',
      render: (r) => (r.workOrder
        ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={(e) => { e.stopPropagation(); run('openWO:' + r.workOrder); }}>{r.workOrder}</button>
        : <span style={{ color: 'var(--text3)' }}>not raised</span>) },
    { key: 'st', label: 'Status', value: (r) => r.status,
      render: (r) => <Badge tone={r.status === 'Closed' ? 'green' : r.status === 'Overdue' ? 'red' : 'blue'}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={setView} options={[
      { v: 'sheets', l: `Sheets (${inspections.length})`, icon: ClipboardCheck },
      { v: 'defects', l: `Defects (${defects.filter((d) => d.status !== 'Closed').length} open)`, icon: AlertTriangle },
      { v: 'forms', l: 'Forms', icon: FileCheck2 },
    ]} />
  );

  if (view === 'defects') {
    const defRows = defects.filter((d) => (
      defFilter === 'open' ? d.status !== 'Closed'
        : defFilter === 'nogo' ? d.severity === 'No Go'
          : defFilter === 'overdue' ? d.status === 'Overdue'
        : defFilter === 'unsigned' ? d.severity === 'Go But' && !d.supervisorSigned && d.status !== 'Closed' : true));
    return (
      <DataGrid cols={defCols} rows={defRows} keyOf={(r) => r.id} totalLabel={defects.length}
        selected={selection.defect} onSelect={(k) => select('defect', k)}
        rowClass={(r) => (r.status === 'Overdue' ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            {[['open', 'Open'], ['nogo', 'No-go'], ['overdue', 'Lapsed'], ['unsigned', 'Unsigned concession'], ['all', 'All']].map(([v, l]) => (
              <Btn key={v} small active={defFilter === v} onClick={() => setDefFilter(v)}>{l}</Btn>
            ))}
          </>
        }
        emptyText="No defects match this filter." />
    );
  }
  const sheetRows = inspections.filter((i) => (
    filter === 'pending' ? !i.signed
      : filter === 'nogo' ? i.result === 'no-go'
        : filter === 'gobut' ? i.result === 'go-but'
          : filter === 'order' ? i.result === 'in-order' : true));

  return (
    <DataGrid cols={inspCols} rows={sheetRows} keyOf={(r) => r.ref} 
      selected={selection.inspection} onSelect={(k) => select('inspection', k)}
      toolbar={
        <>
          {switcher}
          {[['all', 'All'], ['pending', 'Awaiting sign-off'], ['nogo', 'No-go'], ['gobut', 'Go-but'], ['order', 'In order']].map(([v, l]) => (
            <Btn key={v} small active={filter === v} onClick={() => setFilter(v)}>{l}</Btn>
          ))}
          <Btn small primary icon={ClipboardCheck} onClick={() => run('startInspection')}>New inspection</Btn>
        </>
      } />
  );
}

