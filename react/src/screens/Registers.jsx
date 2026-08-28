import React, { useState } from 'react';
import {
  UserPlus, Plus, Download, ClipboardCheck, Car, CarFront, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { nf, targetTone } from '../theme.js';
import { BASE } from '../data.js';
import {
  DataGrid, Btn, Badge, Avatar, RichText, Seg,
  statusBadge, roleBadge, planBadge, vehicleBadge, resultBadge,
} from '../components/ui.jsx';



const Person = ({ init, tone, name, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <Avatar init={init} tone={tone} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{name}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  </div>
);

/* ── companies ────────────────────────────────────────────────── */
export function Companies({ run, openDialog, goTab }) {
  const { companies, selection, select, settings } = useStore();
  const passTone = (v) => targetTone(v, settings.complianceTarget);
  const cols = [
    { key: 'co', label: 'Company', value: (r) => r.name, render: (r) => <Person init={r.init} tone="blue" name={r.name} /> },
    { key: 'ind', label: 'Industry', value: (r) => r.industry, render: (r) => <Badge tone="grey">{r.industry}</Badge> },
    { key: 'users', label: 'Users', num: true, value: (r) => r.users, render: (r) => r.users },
    { key: 'veh', label: 'Vehicles', num: true, value: (r) => r.vehicles, render: (r) => r.vehicles },
    {
      key: 'comp', label: 'Compliance', value: (r) => r.compliance, render: (r) => (r.compliance ? (
        <div className="cellbar" style={{ justifyContent: 'flex-start' }}>
          <div className="track"><div className="fill" style={{ width: r.compliance + '%', background: passTone(r.compliance) }} />
            <div className="thresh" style={{ left: '90%' }} /></div>
          <span className="pct" style={{ color: passTone(r.compliance) }}>{r.compliance}%</span>
        </div>
      ) : <span style={{ color: 'var(--text3)' }}>no data yet</span>),
    },
    { key: 'plan', label: 'Plan', value: (r) => r.plan, render: (r) => planBadge(r.plan) },
    { key: 'status', label: 'Status', value: (r) => r.status, render: (r) => statusBadge(r.status) },
    { key: 'date', label: 'Registered', value: (r) => r.date, render: (r) => <span style={{ color: 'var(--text3)' }}>{r.date}</span> },
    { key: 'act', label: '', render: () => <Btn small onClick={() => goTab('profile')}>Open</Btn> },
  ];
  return (
    <DataGrid cols={cols} rows={companies} keyOf={(r) => r.name} totalLabel={BASE.companies + companies.length}
      selected={selection.company} onSelect={(k) => select('company', k)}
      toolbar={<Btn small primary icon={Plus} onClick={() => openDialog('company')}>Register company</Btn>} />
  );
}

/* ── users ────────────────────────────────────────────────────── */
export function Users({ run, openDialog }) {
  const { users, selection, select } = useStore();
  const cols = [
    { key: 'u', label: 'User', value: (r) => r.name, render: (r) => <Person init={r.init} tone={r.tone} name={r.name} sub={r.co} /> },
    { key: 'role', label: 'Role', value: (r) => r.role, render: (r) => roleBadge(r.role) },
    { key: 'co', label: 'Company', value: (r) => r.co, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.co}</span> },
    { key: 'rep', label: 'Reports to', value: (r) => r.reports, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.reports}</span> },
    { key: 'veh', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'cof', label: 'COF expiry', value: (r) => r.cof, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.cof}</span> },
    { key: 'insp', label: 'Inspections', num: true, value: (r) => r.insps, render: (r) => r.insps },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => statusBadge(r.status) },
    { key: 'act', label: '', render: (r) => <Btn small onClick={() => { select('user', r.name); run('editUser'); }}>Edit</Btn> },
  ];
  return (
    <DataGrid cols={cols} rows={users} keyOf={(r) => r.name} totalLabel={BASE.users + users.length}
      selected={selection.user} onSelect={(k) => select('user', k)}
      toolbar={<Btn small primary icon={UserPlus} onClick={() => openDialog('user')}>New user</Btn>} />
  );
}

/* ── fleet ────────────────────────────────────────────────────── */
export function Fleet({ run, openDialog }) {
  const { vehicles, defects, selection, select } = useStore();
  const openFor = (plate) => defects.filter((d) => d.plate === plate && d.status === 'Open');
  const cols = [
    { key: 'plate', label: 'Plate', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'fleetNo', label: 'Fleet no.', value: (r) => r.fleetNo, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.fleetNo}</span> },
    { key: 'make', label: 'Make and model', value: (r) => r.make, render: (r) => r.make },
    { key: 'type', label: 'Type', value: (r) => r.type, render: (r) => <Badge tone="grey">{r.type}</Badge> },
    { key: 'co', label: 'Company', value: (r) => r.co, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.co}</span> },
    { key: 'driver', label: 'Assigned to', value: (r) => r.driver, render: (r) => r.driver },
    { key: 'insp', label: 'Last inspection', value: (r) => r.lastInsp, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.lastInsp}</span> },
    { key: 'km', label: 'Odometer', num: true, value: (r) => r.km, render: (r) => nf(r.km) },
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
  return (
    <DataGrid cols={cols} rows={vehicles} keyOf={(r) => r.plate} totalLabel={BASE.vehicles + vehicles.length}
      selected={selection.vehicle} onSelect={(k) => select('vehicle', k)}
      toolbar={
        <>
          <Btn small primary icon={Plus} onClick={() => openDialog('vehicle')}>New vehicle</Btn>
          <Btn small icon={ClipboardCheck} onClick={() => run('startInspection')}>Inspect</Btn>
          <Btn small icon={Car} onClick={() => run('assignVehicle')}>Assign</Btn>
        </>
      } />
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
    { key: 'co', label: 'Company', value: (r) => r.co, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.co}</span> },
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
    { key: 'item', label: 'Item', value: (r) => r.item, render: (r) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
    { key: 'plate', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'co', label: 'Company', value: (r) => r.co, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.co}</span> },
    { key: 'sev', label: 'Severity', value: (r) => r.severity, render: (r) => <Badge tone={r.severity === 'No Go' ? 'red' : 'gold'}>{r.severity}</Badge> },
    { key: 'raised', label: 'Raised', value: (r) => r.raised, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.raised}</span> },
    {
      key: 'age', label: 'Age', num: true, value: (r) => r.age,
      render: (r) => <span style={{ color: r.age > settings.goButMaxDays ? 'var(--red)' : r.age > settings.goButMaxDays * 0.7 ? 'var(--gold)' : 'var(--text2)', fontWeight: 600 }}>{r.age} d</span>,
    },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={r.status === 'Closed' ? 'green' : 'grey'}>{r.status}</Badge> },
    {
      key: 'act', label: '', render: (r) => (r.status === 'Open'
        ? <Btn small icon={CheckCircle2} onClick={() => run('closeDefect:' + r.id)}>Close</Btn>
        : <span style={{ color: 'var(--text3)', fontSize: 11.5 }}>closed</span>),
    },
  ];

  const switcher = (
    <Seg value={view} onChange={setView} options={[
      { v: 'sheets', l: `Sheets (${inspections.length})`, icon: ClipboardCheck },
      { v: 'defects', l: `Defects (${defects.filter((d) => d.status === 'Open').length} open)`, icon: AlertTriangle },
    ]} />
  );

  if (view === 'defects') {
    const defRows = defects.filter((d) => (
      defFilter === 'open' ? d.status === 'Open'
        : defFilter === 'nogo' ? d.severity === 'No Go'
          : defFilter === 'overdue' ? d.status === 'Open' && d.age > settings.goButMaxDays : true));
    return (
      <DataGrid cols={defCols} rows={defRows} keyOf={(r) => r.id} totalLabel={defects.length}
        selected={selection.defect} onSelect={(k) => select('defect', k)}
        rowClass={(r) => (r.age > settings.goButMaxDays && r.status === 'Open' ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            {[['open', 'Open'], ['nogo', 'No-go'], ['overdue', `Past ${settings.goButMaxDays} days`], ['all', 'All']].map(([v, l]) => (
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
    <DataGrid cols={inspCols} rows={sheetRows} keyOf={(r) => r.ref} totalLabel={BASE.inspections + inspections.length}
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

