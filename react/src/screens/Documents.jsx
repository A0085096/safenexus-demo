import React, { useMemo } from 'react';
import {
  Files, Upload, BadgeCheck, CalendarClock, Truck, User, FileWarning, Download,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Breakdown, Expiry } from '../components/erpUi.jsx';
import { until, fmtDate, DOC_TYPES } from '../erp/seed.js';

/* ══════════════════════════════════════════════════════════════
   Documents.

   A fleet is only legal on paper. This is every certificate,
   licence and permit the operation holds, in one register, sorted
   by the only thing that matters about a document: how long it has
   left. An expired certificate of fitness is not an administrative
   problem — the vehicle carrying it may not be dispatched.
   ══════════════════════════════════════════════════════════════ */
export default function Documents({ run, openDialog }) {
  const { documents, settings, selection, select, subView, setView } = useStore();
  const view = subView.documents || 'register';

  const dated = documents.filter((d) => d.expires);
  const expired = dated.filter((d) => until(d.expires) < 0);
  const soon = dated.filter((d) => until(d.expires) >= 0 && until(d.expires) <= settings.cofWarnDays);
  const unverified = documents.filter((d) => d.status !== 'Verified');

  const cols = [
    { key: 'r', label: 'Reference', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'k', label: 'Document', value: (r) => r.kind, render: (r) => <span style={{ fontWeight: 600 }}>{r.kind}</span> },
    { key: 's', label: 'Held against', wrap: true, value: (r) => r.subject, render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {r.subjectType === 'Vehicle' ? <Truck size={14} strokeWidth={1.8} color="var(--text3)" /> : <User size={14} strokeWidth={1.8} color="var(--text3)" />}
        <span style={{ fontFamily: r.subjectType === 'Vehicle' ? 'var(--num)' : undefined }}>{r.subject}</span>
      </div>
    ) },
    { key: 'st', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'o', label: 'Owned by', value: (r) => r.owner, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.owner}</span> },
    { key: 'i', label: 'Issued', value: (r) => r.issued, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtDate(r.issued)}</span> },
    { key: 'e', label: 'Expires', num: true, value: (r) => (r.expires ? until(r.expires) : 99999),
      render: (r) => (r.expires ? <Expiry date={r.expires} /> : <span style={{ color: 'var(--text3)' }}>does not expire</span>) },
    { key: 'f', label: 'File', wrap: true, value: (r) => r.file, render: (r) => (
      <button className="link" onClick={(e) => { e.stopPropagation(); run('download'); }}>
        {r.file} <span style={{ color: 'var(--text3)' }}>· {r.size}</span>
      </button>
    ) },
    { key: 'v', label: 'Status', value: (r) => r.status,
      render: (r) => <Badge tone={r.status === 'Verified' ? 'green' : r.status === 'Expired' ? 'red' : 'gold'}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('documents', v)} options={[
      { v: 'register', l: `All (${documents.length})`, icon: Files },
      { v: 'expiring', l: `Expiring (${expired.length + soon.length})`, icon: CalendarClock },
      { v: 'kinds', l: 'By kind', icon: BadgeCheck },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Documents held', v: documents.length, icon: Files,
        note: `${new Set(documents.map((d) => d.kind)).size} kinds across vehicles and people` },
      { l: 'Expired', v: expired.length, icon: FileWarning,
        dir: expired.length ? 'dn' : 'up',
        delta: expired.length ? 'not legal to operate' : 'nothing lapsed',
        note: 'the vehicle or person it covers is not cleared' },
      { l: `Within ${settings.cofWarnDays} days`, v: soon.length, icon: CalendarClock,
        dir: soon.length ? 'warn' : 'up',
        note: 'the renewal window set on the Settings tab' },
      { l: 'Awaiting verification', v: unverified.length, icon: BadgeCheck,
        note: 'uploaded but not yet checked against the original' },
    ]} />
  );

  if (view === 'kinds') {
    const kinds = [...new Set(documents.map((d) => d.kind))].map((k, i) => {
      const list = documents.filter((d) => d.kind === k);
      const withDates = list.filter((d) => d.expires);
      return {
        kind: k,
        n: list.length,
        expired: withDates.filter((d) => until(d.expires) < 0).length,
        soon: withDates.filter((d) => until(d.expires) >= 0 && until(d.expires) <= settings.cofWarnDays).length,
        unverified: list.filter((d) => d.status !== 'Verified').length,
        c: SERIES[i % SERIES.length],
      };
    }).sort((a, b) => b.n - a.n);

    const kindCols = [
      { key: 'k', label: 'Document kind', value: (r) => r.kind, render: (r) => <span style={{ fontWeight: 600 }}>{r.kind}</span> },
      { key: 'n', label: 'Held', num: true, value: (r) => r.n, render: (r) => r.n },
      { key: 'e', label: 'Expired', num: true, value: (r) => r.expired,
        render: (r) => (r.expired ? <Badge tone="red">{r.expired}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
      { key: 's', label: 'Expiring soon', num: true, value: (r) => r.soon,
        render: (r) => (r.soon ? <Badge tone="gold">{r.soon}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
      { key: 'u', label: 'Unverified', num: true, value: (r) => r.unverified, render: (r) => r.unverified },
      { key: 'c', label: 'Coverage', num: true, value: (r) => (r.n - r.expired) / r.n, render: (r) => {
        const pct = ((r.n - r.expired) / r.n) * 100;
        return <Badge tone={pct === 100 ? 'green' : pct > 90 ? 'gold' : 'red'}>{pct.toFixed(0)}% in force</Badge>;
      } },
    ];
    return (
      <>
        {kpis}
        <DataGrid cols={kindCols} rows={kinds} keyOf={(r) => r.kind} toolbar={switcher} pageSize={20} />
        <div className="grid-2">
          <Panel title="Documents by kind" flush>
            <Breakdown rows={kinds.map((k) => ({ k: k.kind, v: k.n, c: k.c }))} />
          </Panel>
          <Panel title="Documents by site" flush>
            <Breakdown rows={['PIT', 'STL', 'HO'].map((k, i) => ({
              k: siteName(k), c: SERIES[i], v: documents.filter((d) => d.site === k).length,
            }))} />
          </Panel>
        </div>
      </>
    );
  }

  const rows = view === 'expiring'
    ? [...expired, ...soon].sort((a, b) => until(a.expires) - until(b.expires))
    : documents;

  return (
    <>
      {kpis}
      {expired.length > 0 && view === 'expiring' && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <FileWarning size={15} strokeWidth={1.8} />
          <span>
            <b>{expired.length} document{expired.length === 1 ? '' : 's'}</b> {expired.length === 1 ? 'has' : 'have'} lapsed.
            A vehicle without a valid certificate of fitness may not be dispatched, and an operator without a
            valid medical may not be rostered — both checks run nightly and both write to the audit trail.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.ref} totalLabel={documents.length}
        selected={selection.document} onSelect={(k) => select('document', k)}
        rowClass={(r) => (r.expires && until(r.expires) < 0 ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Upload} onClick={() => openDialog('document')}>Upload</Btn>
            <Btn small icon={BadgeCheck} onClick={() => run('verifyDoc')}>Verify</Btn>
            <Btn small icon={Download} onClick={() => run('export')}>Export</Btn>
          </>
        } />
    </>
  );
}
