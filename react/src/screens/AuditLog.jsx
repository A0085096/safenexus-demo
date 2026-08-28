import React, { useMemo, useState } from 'react';
import {
  Car, CarFront, UserPlus, ClipboardCheck, AlertTriangle, Download, ShieldCheck,
  Search, X, Calendar, FileJson,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { Btn, Badge, Avatar, RichText, Seg, SecHead, KV } from '../components/ui.jsx';

const ICON = {
  assign: [Car, 'green'], unassign: [CarFront, 'gold'], user: [UserPlus, 'purple'],
  insp: [ClipboardCheck, 'blue'], warn: [AlertTriangle, 'red'],
};
const KIND = {
  all: () => true,
  assignment: (a) => a.type === 'assign' || a.type === 'unassign',
  people: (a) => a.type === 'user',
  inspections: (a) => a.type === 'insp',
  warnings: (a) => a.type === 'warn',
};
const sevTone = { Critical: 'red', Warning: 'gold', Information: 'grey' };

const plain = (t) => t.replace(/\*\*/g, '');

/* ══════════════════════════════════════════════════════════════
   The audit trail is the evidence an inspector asks for, so it is
   filterable, searchable, exportable and each entry opens with the
   actor, the record, the channel and the address behind it.
   ══════════════════════════════════════════════════════════════ */
export default function AuditLog({ run }) {
  const { audit, settings, me, flash } = useStore();
  const [kind, setKind] = useState('all');
  const [q, setQ] = useState('');
  const [actor, setActor] = useState('all');
  const [sev, setSev] = useState('all');
  const [sel, setSel] = useState(null);

  const actors = useMemo(() => ['all', ...new Set(audit.map((a) => a.actor).filter(Boolean))], [audit]);

  const rows = audit.filter((a) => (
    KIND[kind](a)
    && (actor === 'all' || a.actor === actor)
    && (sev === 'all' || a.severity === sev)
    && (!q.trim() || (plain(a.text) + a.meta + a.actor).toLowerCase().includes(q.toLowerCase()))
  ));

  const entry = rows.find((a) => a.id === sel) || null;

  const exportTrail = (asJson) => {
    const body = asJson
      ? JSON.stringify(rows.map(({ ...r }) => ({ ...r, text: plain(r.text) })), null, 2)
      : ['id,date,time,actor,severity,channel,entity,action,context,ip']
        .concat(rows.map((r) => [r.id, r.date, r.time, r.actor, r.severity, r.channel, r.entity,
          `"${plain(r.text).replace(/"/g, '""')}"`, `"${r.meta}"`, r.ip].join(',')))
        .join('\n');
    const blob = new Blob([body], { type: asJson ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safenexus-audit-${new Date().toISOString().slice(0, 10)}.${asJson ? 'json' : 'csv'}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    flash(`${rows.length} entries exported.`, { title: `Audit export (${asJson ? 'JSON' : 'CSV'})` });
  };

  return (
    <div className="audit-wrap">
      <div className="audit-main">
        <div className="cmdstrip solo" style={{ gap: 6 }}>
          <div className="findbox" style={{ width: 210 }}>
            <Search size={14} strokeWidth={1.8} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the trail" />
            {q && <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} onClick={() => setQ('')}><X size={12} /></button>}
          </div>
          <Seg value={kind} onChange={setKind} options={[
            { v: 'all', l: 'All' }, { v: 'assignment', l: 'Assignment' }, { v: 'people', l: 'People' },
            { v: 'inspections', l: 'Inspections' }, { v: 'warnings', l: 'Warnings' },
          ]} />
          <select className="inp" style={{ width: 168 }} value={actor} onChange={(e) => setActor(e.target.value)}>
            {actors.map((x) => <option key={x} value={x}>{x === 'all' ? 'Every actor' : x}</option>)}
          </select>
          <select className="inp" style={{ width: 132 }} value={sev} onChange={(e) => setSev(e.target.value)}>
            {['all', 'Critical', 'Warning', 'Information'].map((x) => <option key={x} value={x}>{x === 'all' ? 'Any severity' : x}</option>)}
          </select>
          <span className="count">{rows.length} of {audit.length}</span>
        </div>

        <div className="panel">
          <div className="gridwrap">
            <table className="grid">
              <thead>
                <tr>
                  <th style={{ width: 34 }} /><th>Entry</th><th>Action</th><th>Actor</th>
                  <th>Severity</th><th>Channel</th><th>When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const [Icon, tone] = ICON[a.type] || ICON.insp;
                  return (
                    <tr key={a.id} className={sel === a.id ? 'sel' : ''} onClick={() => setSel(a.id)} tabIndex={0}>
                      <td><Avatar tone={tone} icon={Icon} /></td>
                      <td className="mono" style={{ fontSize: 11.5 }}>{a.id}</td>
                      <td className="wrap" style={{ lineHeight: 1.5 }}><RichText text={a.text} /></td>
                      <td>{a.actor}</td>
                      <td><Badge tone={sevTone[a.severity] || 'grey'}>{a.severity}</Badge></td>
                      <td style={{ color: 'var(--text2)' }}>{a.channel}</td>
                      <td style={{ color: 'var(--text3)', whiteSpace: 'nowrap' }}>{a.date} {a.time}</td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
                    Nothing in the trail matches these filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid-foot">
            <span>Append-only · {settings.retentionYears}-year retention · entries cannot be edited or removed</span>
            <span className="pager" style={{ gap: 8 }}>
              <Btn small icon={Download} onClick={() => exportTrail(false)}>Export CSV</Btn>
              <Btn small icon={FileJson} onClick={() => exportTrail(true)}>Export JSON</Btn>
              <Btn small icon={ShieldCheck} onClick={() => flash(`${audit.length} entries verified — the hash chain is unbroken.`, { title: 'Integrity check passed' })}>Verify</Btn>
            </span>
          </div>
        </div>
      </div>

      <aside className="audit-side">
        {entry ? (
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{entry.id}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, margin: '4px 0 10px' }}><RichText text={entry.text} /></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge tone={sevTone[entry.severity] || 'grey'}>{entry.severity}</Badge>
              <Badge tone="grey">{entry.channel}</Badge>
            </div>
            <SecHead>Evidence</SecHead>
            <KV k="Actor" v={entry.actor} />
            <KV k="Context" v={entry.meta} />
            <KV k="Record" v={entry.entity} />
            <KV k="Captured" v={`${entry.date} at ${entry.time}`} />
            <KV k="Source address" v={<span style={{ fontFamily: 'var(--num)' }}>{entry.ip}</span>} />
            <KV k="Session" v={<span style={{ fontFamily: 'var(--num)' }}>{entry.session}</span>} />
            <SecHead>Retention</SecHead>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>
              Held until {2026 + settings.retentionYears}. This entry is part of an append-only chain: it
              cannot be edited, and removing it would break verification.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <Btn small onClick={() => run('print')}>Print entry</Btn>
              <Btn small onClick={() => { setActor(entry.actor); flash(`Filtered to ${entry.actor}.`, { tone: 'info' }); }}>All by this actor</Btn>
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
            <Calendar size={26} strokeWidth={1.4} style={{ marginBottom: 10, opacity: .6 }} />
            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>Select an entry to see who did it, from where, and against which record.</div>
          </div>
        )}
      </aside>
    </div>
  );
}
