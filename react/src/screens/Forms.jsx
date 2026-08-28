import React from 'react';
import { FileCheck2, Play, Repeat, CheckCircle2, Files, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useStore } from '../store.jsx';
import { Btn, Badge, DataGrid, Seg } from '../components/ui.jsx';
import { allItems } from '../inspection/templates.js';

/* The forms register: which sheet is in force, at which revision, and
   what it asks. A draft cannot be used to capture until it is published. */
export default function Forms({ run }) {
  const {
    templates, inspections, defects, selection, select, me, dispatch, flash,
    inspView, setInspView,
  } = useStore();

  const cols = [
    { key: 'name', label: 'Form', value: (r) => r.name, wrap: true, render: (r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.code} · owned by {r.owner}</div>
      </div>
    ) },
    { key: 'rev', label: 'Revision', num: true, value: (r) => r.revision, render: (r) => 'Rev ' + r.revision },
    { key: 'status', label: 'Status', value: (r) => r.status,
      render: (r) => (r.status === 'Published' ? <Badge tone="green">Published</Badge> : <Badge tone="gold">Draft</Badge>) },
    { key: 'applies', label: 'Applies to', wrap: true, value: (r) => r.appliesTo.join(', '),
      render: (r) => <span style={{ color: 'var(--text2)' }}>{r.appliesTo.join(', ')}</span> },
    { key: 'sections', label: 'Sections', num: true, value: (r) => r.sections.length, render: (r) => r.sections.length },
    { key: 'items', label: 'Items', num: true, value: (r) => allItems(r).length, render: (r) => allItems(r).length },
    { key: 'window', label: 'Go-but window', num: true, value: (r) => r.goButMaxDays, render: (r) => `${r.goButMaxDays} days` },
    { key: 'signoffs', label: 'Sign-off chain', value: (r) => r.signoffs.join(' → '),
      render: (r) => <span style={{ color: 'var(--text2)' }}>{r.signoffs.join(' → ')}</span> },
    { key: 'used', label: 'Used this month', num: true, value: (r) => r.usedThisMonth, render: (r) => r.usedThisMonth },
    { key: 'act', label: '', render: (r) => (r.status === 'Published'
      ? <Btn small icon={Play} onClick={() => run('startInspection:' + r.id)}>Use</Btn>
      : <Btn small icon={CheckCircle2} onClick={() => { dispatch({ type: 'PUBLISH_TEMPLATE', id: r.id, by: me.name }); flash(`${r.name} published at revision ${r.revision}.`, { title: 'Form published' }); }}>Publish</Btn>) },
  ];

  return (
    <DataGrid cols={cols} rows={templates} keyOf={(r) => r.id}
      selected={selection.template} onSelect={(k) => select('template', k)}
      toolbar={
        <>
          <Seg value={inspView} onChange={setInspView} options={[
            { v: 'sheets', l: `Sheets (${inspections.length})`, icon: ClipboardCheck },
            { v: 'defects', l: `Defects (${defects.filter((d) => d.status !== 'Closed').length} open)`, icon: AlertTriangle },
            { v: 'forms', l: 'Forms', icon: FileCheck2 },
          ]} />
          <Btn small icon={FileCheck2} onClick={() => run('newForm')}>New form</Btn>
          <Btn small icon={Files} onClick={() => run('duplicateForm')}>Duplicate</Btn>
          <Btn small icon={Repeat} onClick={() => run('reviseForm')}>New revision</Btn>
        </>
      } />
  );
}
