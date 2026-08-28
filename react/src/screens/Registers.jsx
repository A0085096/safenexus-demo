import React, { useState } from 'react';
import {
  UserPlus, Plus, ClipboardCheck, AlertTriangle, FileCheck2, Car,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { nf, targetTone } from '../theme.js';
import { siteName } from '../data.js';
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

/* ── users ────────────────────────────────────────────────────── */
export function Users({ run, openDialog }) {
  const { users, selection, select } = useStore();
  const cols = [
    { key: 'u', label: 'User', value: (r) => r.name, render: (r) => <Person init={r.init} tone={r.tone} name={r.name} sub={r.co} /> },
    { key: 'role', label: 'Role', value: (r) => r.role, render: (r) => roleBadge(r.role) },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'rep', label: 'Reports to', value: (r) => r.reports, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.reports}</span> },
    { key: 'veh', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'cof', label: 'COF expiry', value: (r) => r.cof, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.cof}</span> },
    { key: 'insp', label: 'Inspections', num: true, value: (r) => r.insps, render: (r) => r.insps },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => statusBadge(r.status) },
    { key: 'act', label: '', render: (r) => <Btn small onClick={() => { select('user', r.name); run('editUser'); }}>Edit</Btn> },
  ];
  return (
    <DataGrid cols={cols} rows={users} keyOf={(r) => r.name} 
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
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
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
    <DataGrid cols={cols} rows={vehicles} keyOf={(r) => r.plate} 
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

