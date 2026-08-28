import React, { useState } from 'react';
import {
  Server, Plug, UserCog, CheckSquare, CheckCircle2, XCircle, Play, AlertTriangle, Clock,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { SERIES } from '../theme.js';
import {
  DataGrid, Btn, Badge, Seg, Panel,
} from '../components/ui.jsx';
import { Kpis, Money, Breakdown } from '../components/erpUi.jsx';
import { R, num, MODULES } from '../erp/seed.js';

const LEVELS = ['None', 'Read', 'Capture', 'Edit', 'Approve', 'Full'];

/* ══════════════════════════════════════════════════════════════
   Administration.

   The plumbing an ERP is actually judged on once it is live: the
   jobs that run overnight, the feeds it depends on, who may do
   what, and the decisions waiting on somebody senior. A platform
   whose nightly jobs fail quietly is a platform whose numbers are
   wrong by morning, so failures are the first thing shown.
   ══════════════════════════════════════════════════════════════ */
export default function Admin({ run }) {
  const {
    scheduledJobs, integrations, roles, approvals, subView, setView, me, dispatch, flash,
  } = useStore();
  const view = subView.admin || 'jobs';

  const failing = scheduledJobs.filter((j) => j.status !== 'Success');
  const broken = integrations.filter((i) => i.status === 'Down' || i.status === 'Degraded');
  const pending = approvals.filter((a) => a.status === 'Pending');
  const pendingValue = pending.reduce((a, x) => a + x.amount, 0);

  const switcher = (
    <Seg value={view} onChange={(v) => setView('admin', v)} options={[
      { v: 'jobs', l: `Jobs (${failing.length ? failing.length + ' failing' : 'all green'})`, icon: Server },
      { v: 'integrations', l: `Integrations (${integrations.length})`, icon: Plug },
      { v: 'roles', l: 'Roles', icon: UserCog },
      { v: 'approvals', l: `Approvals (${pending.length})`, icon: CheckSquare },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Scheduled jobs', v: scheduledJobs.length, icon: Server,
        dir: failing.length ? 'dn' : 'up',
        delta: failing.length ? `${failing.length} not clean` : 'all succeeded',
        note: 'a job that fails quietly makes the numbers wrong by morning' },
      { l: 'Feeds connected', v: integrations.filter((i) => i.status === 'Connected').length,
        unit: `of ${integrations.length}`, icon: Plug,
        dir: broken.length ? 'dn' : 'up',
        note: broken.length ? `${broken.length} down or degraded` : 'every feed reporting' },
      { l: 'Roles defined', v: roles.length, icon: UserCog,
        note: `${roles.reduce((a, r) => a + r.seats, 0)} seats assigned across ${MODULES.length} modules` },
      { l: 'Awaiting a decision', v: pending.length, icon: CheckSquare,
        dir: pending.length ? 'warn' : 'up',
        delta: R(pendingValue),
        note: 'above the limit the requester may authorise' },
    ]} />
  );

  if (view === 'integrations') {
    const cols = [
      { key: 'n', label: 'Integration', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
      { key: 'k', label: 'Kind', value: (r) => r.kind, render: (r) => <Badge tone="purple">{r.kind}</Badge> },
      { key: 'p', label: 'What it carries', wrap: true, value: (r) => r.purpose,
        render: (r) => <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>{r.purpose}</span> },
      { key: 'l', label: 'Last sync', value: (r) => r.lastSync, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.lastSync}</span> },
      { key: 'e', label: 'Errors', num: true, value: (r) => r.errors,
        render: (r) => (r.errors ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>{r.errors}</span> : <span style={{ color: 'var(--text3)' }}>0</span>) },
      { key: 's', label: 'Status', value: (r) => r.status, render: (r) => (
        <Badge tone={r.status === 'Connected' ? 'green' : r.status === 'Degraded' ? 'gold'
          : r.status === 'Down' ? 'red' : 'grey'}>{r.status}</Badge>
      ) },
    ];
    return (
      <>
        {kpis}
        {broken.length > 0 && (
          <div className="infobar" style={{ marginBottom: 12 }}>
            <Plug size={15} strokeWidth={1.8} />
            <span>
              <b>{broken.map((b) => b.name).join(' and ')}</b> {broken.length === 1 ? 'is' : 'are'} not
              healthy. Anything downstream of {broken.length === 1 ? 'it' : 'them'} — toll costs on a job,
              positions on a plant unit — is running on the last good file rather than live data.
            </span>
          </div>
        )}
        <DataGrid cols={cols} rows={integrations} keyOf={(r) => r.name} toolbar={switcher} pageSize={20}
          rowClass={(r) => (r.status === 'Down' ? 'overdue' : '')} />
      </>
    );
  }

  if (view === 'roles') return <><>{kpis}</><Roles roles={roles} switcher={switcher} dispatch={dispatch} me={me} flash={flash} /></>;
  if (view === 'approvals') return <><>{kpis}</><Approvals approvals={approvals} switcher={switcher} run={run} /></>;

  /* ── scheduled jobs ───────────────────────────────────────── */
  const cols = [
    { key: 'n', label: 'Job', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 's', label: 'Runs', value: (r) => r.schedule, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.schedule}</span> },
    { key: 'l', label: 'Last run', value: (r) => r.last, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.last}</span> },
    { key: 'x', label: 'Next run', value: (r) => r.next, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.next}</span> },
    { key: 'r', label: 'Records', num: true, value: (r) => r.records, render: (r) => num(r.records) },
    { key: 'd', label: 'Duration', num: true, value: (r) => r.seconds, render: (r) => r.seconds + ' s' },
    { key: 'st', label: 'Result', value: (r) => r.status, render: (r) => (
      <Badge tone={r.status === 'Success' ? 'green' : r.status === 'Warning' ? 'gold' : 'red'}>{r.status}</Badge>
    ) },
    { key: 'a', label: '', render: (r) => (
      <Btn small icon={Play} onClick={(e) => { e.stopPropagation(); run('runJob:' + r.name); }}>Run now</Btn>
    ) },
  ];

  return (
    <>
      {kpis}
      {failing.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} strokeWidth={1.8} />
          <span>
            <b>{failing.filter((j) => j.status === 'Failed').map((j) => j.name).join(', ') || 'One job'}</b> did
            not complete. Until it does, the figures it feeds are as old as its last good run — which is why
            the result column matters more than the schedule column.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={scheduledJobs} keyOf={(r) => r.name} toolbar={switcher} pageSize={20}
        rowClass={(r) => (r.status === 'Failed' ? 'overdue' : '')} />
    </>
  );
}

/* ── roles and permissions ──────────────────────────────────────
   A matrix, because the question people ask is never "what can a
   supervisor do" — it is "who can approve a purchase order", and
   that is a column, not a row. Every cell is editable and every
   change is audited. */
function Roles({ roles, switcher, dispatch, me, flash }) {
  const cycle = (role, module, level) => {
    const next = LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length];
    dispatch({ type: 'SET_PERM', role, module, level: next, by: me.name });
    flash(`${role} access to ${module} set to “${next}”.`, { title: 'Permission changed' });
  };

  return (
    <>
      <div className="cmdstrip solo">
        {switcher}
        <span className="count">Click a cell to change the level · every change is written to the audit trail</span>
      </div>
      <Panel title="Roles and permissions" note="none · read · capture · edit · approve · full">
        <div style={{ overflowX: 'auto' }}>
          <table className="matrix">
            <thead>
              <tr>
                <th style={{ minWidth: 150 }}>Role</th>
                <th style={{ minWidth: 90 }}>Scope</th>
                <th className="num" style={{ width: 54 }}>Seats</th>
                {MODULES.map((m) => <th key={m} style={{ minWidth: 74 }}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td style={{ color: 'var(--text2)' }}>{r.scope}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--num)' }}>{r.seats}</td>
                  {MODULES.map((m) => {
                    const lvl = r.perms[m] || 'None';
                    return (
                      <td key={m} className={'lvl ' + lvl} title={`${r.name} · ${m} · click to change`}
                        onClick={() => cycle(r.name, m, lvl)}>
                        {lvl}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="grid-2">
        <Panel title="Seats by role" flush>
          <Breakdown rows={roles.map((r, i) => ({ k: r.name, v: r.seats, c: SERIES[i % SERIES.length] }))
            .sort((a, b) => b.v - a.v)} />
        </Panel>
        <Panel title="Who holds full access, by module" note="the count that matters at an audit" flush>
          <Breakdown colour={SERIES[4]} rows={MODULES.map((m) => ({
            k: m, v: roles.filter((r) => r.perms[m] === 'Full').reduce((a, r) => a + r.seats, 0),
          })).sort((a, b) => b.v - a.v)} />
        </Panel>
      </div>
    </>
  );
}

/* ── approvals ──────────────────────────────────────────────── */
function Approvals({ approvals, switcher, run }) {
  const cols = [
    { key: 'r', label: 'Request', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 't', label: 'What is being asked', wrap: true, value: (r) => r.type, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.type}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.reason}</div></div>
    ) },
    { key: 'e', label: 'Against', mono: true, value: (r) => r.entity, render: (r) => r.entity },
    { key: 'b', label: 'Requested by', value: (r) => r.requestedBy, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.requestedBy}</span> },
    { key: 'w', label: 'When', value: (r) => r.requested, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.requested}</span> },
    { key: 'a', label: 'Amount', num: true, value: (r) => r.amount, render: (r) => <Money v={r.amount} bold /> },
    { key: 's', label: 'Decision', value: (r) => r.status, render: (r) => (
      <Badge tone={r.status === 'Approved' ? 'green' : r.status === 'Declined' ? 'red' : 'gold'}>{r.status}</Badge>
    ) },
    { key: 'act', label: '', render: (r) => (r.status !== 'Pending'
      ? <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{r.decidedBy ? `by ${r.decidedBy}` : 'decided'}</span>
      : (
        <span style={{ display: 'flex', gap: 5 }}>
          <Btn small icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); run('approve:Approved:' + r.ref); }}>Approve</Btn>
          <Btn small icon={XCircle} onClick={(e) => { e.stopPropagation(); run('approve:Declined:' + r.ref); }}>Decline</Btn>
        </span>
      )) },
  ];

  const pending = approvals.filter((a) => a.status === 'Pending');

  return (
    <>
      {pending.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <Clock size={15} strokeWidth={1.8} />
          <span>
            <b>{pending.length} request{pending.length === 1 ? '' : 's'}</b> worth {R(pending.reduce((a, x) => a + x.amount, 0))} {' '}
            {pending.length === 1 ? 'is' : 'are'} waiting. Each one is above the limit the person who raised it
            may authorise — a work order cannot be started, an order cannot be sent, until it is decided here.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={approvals} keyOf={(r) => r.ref} toolbar={switcher} pageSize={20}
        rowClass={(r) => (r.status === 'Pending' ? 'overdue' : '')} />
    </>
  );
}
