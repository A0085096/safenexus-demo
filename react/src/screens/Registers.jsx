import React from 'react';
import { UserPlus, Plus, Download } from 'lucide-react';
import { COMPANIES, USERS, FLEET, INSPECTIONS, AUDIT } from '../data.js';
import { SERIES, nf } from '../theme.js';
import {
  DataGrid, Btn, Badge, Avatar, RichText,
  statusBadge, roleBadge, planBadge, vehicleBadge, resultBadge,
} from '../components/ui.jsx';
import {
  ClipboardCheck, Car, CarFront, AlertTriangle,
} from 'lucide-react';

const passTone = (v) => (v >= 95 ? SERIES[1] : v >= 90 ? SERIES[2] : SERIES[4]);

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
  const cols = [
    { key: 'co', label: 'Company', value: (r) => r.name, render: (r) => <Person init={r.init} tone="blue" name={r.name} /> },
    { key: 'ind', label: 'Industry', value: (r) => r.industry, render: (r) => <Badge tone="grey">{r.industry}</Badge> },
    { key: 'users', label: 'Users', num: true, value: (r) => r.users, render: (r) => r.users },
    { key: 'veh', label: 'Vehicles', num: true, value: (r) => r.vehicles, render: (r) => r.vehicles },
    {
      key: 'comp', label: 'Compliance', value: (r) => r.compliance, render: (r) => (
        <div className="cellbar" style={{ justifyContent: 'flex-start' }}>
          <div className="track"><div className="fill" style={{ width: r.compliance + '%', background: passTone(r.compliance) }} />
            <div className="thresh" style={{ left: '90%' }} /></div>
          <span className="pct" style={{ color: passTone(r.compliance) }}>{r.compliance}%</span>
        </div>
      ),
    },
    { key: 'plan', label: 'Plan', value: (r) => r.plan, render: (r) => planBadge(r.plan) },
    { key: 'status', label: 'Status', value: (r) => r.status, render: (r) => statusBadge(r.status) },
    { key: 'date', label: 'Registered', value: (r) => r.date, render: (r) => <span style={{ color: 'var(--text3)' }}>{r.date}</span> },
    { key: 'act', label: '', render: () => <Btn small onClick={() => goTab('profile')}>Open</Btn> },
  ];
  return (
    <DataGrid cols={cols} rows={COMPANIES} keyOf={(r) => r.name} totalLabel={12}
      toolbar={<Btn small primary icon={Plus} onClick={() => openDialog('company')}>Register company</Btn>} />
  );
}

/* ── users ────────────────────────────────────────────────────── */
export function Users({ run, openDialog }) {
  const cols = [
    { key: 'u', label: 'User', value: (r) => r.name, render: (r) => <Person init={r.init} tone={r.tone} name={r.name} sub={r.co} /> },
    { key: 'role', label: 'Role', value: (r) => r.role, render: (r) => roleBadge(r.role) },
    { key: 'co', label: 'Company', value: (r) => r.co, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.co}</span> },
    { key: 'rep', label: 'Reports to', value: (r) => r.reports, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.reports}</span> },
    { key: 'veh', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'cof', label: 'COF expiry', value: (r) => r.cof, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.cof}</span> },
    { key: 'insp', label: 'Inspections', num: true, value: (r) => r.insps, render: (r) => r.insps },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => statusBadge(r.status) },
    { key: 'act', label: '', render: () => <Btn small onClick={() => run('editUser')}>Edit</Btn> },
  ];
  return (
    <DataGrid cols={cols} rows={USERS} keyOf={(r) => r.name} totalLabel={248}
      toolbar={<Btn small primary icon={UserPlus} onClick={() => openDialog('user')}>New user</Btn>} />
  );
}

/* ── fleet ────────────────────────────────────────────────────── */
export function Fleet({ run, openDialog }) {
  const cols = [
    { key: 'plate', label: 'Plate', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'make', label: 'Make and model', value: (r) => r.make, render: (r) => r.make },
    { key: 'year', label: 'Year', num: true, value: (r) => r.year, render: (r) => r.year },
    { key: 'co', label: 'Company', value: (r) => r.co, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.co}</span> },
    { key: 'driver', label: 'Assigned to', value: (r) => r.driver, render: (r) => r.driver },
    { key: 'sup', label: 'Supervisor', value: (r) => r.sup, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.sup}</span> },
    { key: 'insp', label: 'Last inspection', value: (r) => r.lastInsp, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.lastInsp}</span> },
    { key: 'km', label: 'Odometer', num: true, value: (r) => r.km, render: (r) => nf(r.km) },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => vehicleBadge(r.status) },
    { key: 'act', label: '', render: () => <Btn small onClick={() => run('editVehicle')}>Manage</Btn> },
  ];
  return (
    <DataGrid cols={cols} rows={FLEET} keyOf={(r) => r.plate} totalLabel={184}
      toolbar={<Btn small primary icon={Plus} onClick={() => openDialog('vehicle')}>New vehicle</Btn>} />
  );
}

/* ── inspections ──────────────────────────────────────────────── */
export function Inspections({ run }) {
  const cols = [
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
    { key: 'sign', label: 'Sign-off', value: (r) => (r.signed ? 'Signed' : 'Pending'), render: (r) => (r.signed ? <Badge tone="green">Signed</Badge> : <Badge tone="gold">Pending</Badge>) },
    { key: 'act', label: '', render: () => <Btn small onClick={() => run('openInspection')}>Open</Btn> },
  ];
  return (
    <DataGrid cols={cols} rows={INSPECTIONS} keyOf={(r) => r.ref} totalLabel="1 247"
      toolbar={<Btn small primary icon={ClipboardCheck} onClick={() => run('signOff')}>Sign off</Btn>} />
  );
}

/* ── audit log ────────────────────────────────────────────────── */
const AUDIT_ICON = {
  assign: [Car, 'green'], unassign: [CarFront, 'gold'], user: [UserPlus, 'purple'],
  insp: [ClipboardCheck, 'blue'], warn: [AlertTriangle, 'red'],
};

export function Audit({ run }) {
  const cols = [
    {
      key: 'ico', label: '', render: (r) => {
        const [Icon, tone] = AUDIT_ICON[r.type] || AUDIT_ICON.insp;
        return <Avatar tone={tone} icon={Icon} />;
      },
    },
    { key: 'act', label: 'Action', value: (r) => r.text, render: (r) => <span style={{ lineHeight: 1.5 }}><RichText text={r.text} /></span> },
    { key: 'ctx', label: 'Context', value: (r) => r.meta, render: (r) => <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{r.meta}</span> },
    { key: 'when', label: 'When', value: (r) => r.time, render: (r) => <span style={{ fontSize: 11.5, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{r.time}</span> },
  ];
  return (
    <DataGrid cols={cols} rows={AUDIT} keyOf={(r, i) => r.text} emptyText="No audit entries match this filter."
      toolbar={<Btn small icon={Download} onClick={() => run('export')}>Export</Btn>} />
  );
}
