import React from 'react';
import { Save, Undo2, Redo2, Search, Minus, Square, X } from 'lucide-react';

const Logo = () => (
  <svg viewBox="0 0 90 90" width="20" height="20" fill="none" aria-hidden="true">
    <polygon points="8,80 36,10 52,10 36,46" fill="#fff" opacity=".9" />
    <polygon points="82,80 52,46 52,10 95,80" fill="#93C5FD" opacity=".95" />
    <polygon points="36,46 52,10 44,28" fill="#CFE4FA" />
  </svg>
);

export default function TitleBar({ search, setSearch, run }) {
  return (
    <div className="titlebar">
      <div className="qat">
        <div className="qat-logo"><Logo /></div>
        {[[Save, 'save', 'Save'], [Undo2, 'undo', 'Undo'], [Redo2, 'redo', 'Redo']].map(([I, cmd, t]) => (
          <button key={cmd} title={t} onClick={() => run(cmd)}><I size={15} strokeWidth={1.8} /></button>
        ))}
      </div>
      <div className="tb-searchwrap">
        <div className="tb-search">
          <Search size={14} strokeWidth={1.8} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users, vehicles, inspections" />
          {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#fff' }}
            onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
      </div>
      <div className="tb-org">SafeNexus ERP — Acme Mining Corp</div>
      <button className="tb-acct" title="Kobus van der Merwe" onClick={() => run('account')}>KM</button>
      <div className="winbtns">
        <Minus size={12} strokeWidth={2} /><Square size={12} strokeWidth={2} /><X size={12} strokeWidth={2} />
      </div>
    </div>
  );
}
