import React, { useState } from 'react';
import {
  Save, Undo2, Redo2, Search, Minus, Square, X, User, KeyRound, ShieldCheck, Bell, Lock,
} from 'lucide-react';

const Logo = () => (
  <svg viewBox="0 0 90 90" width="20" height="20" fill="none" aria-hidden="true">
    <polygon points="8,80 36,10 52,10 36,46" fill="#fff" opacity=".9" />
    <polygon points="82,80 52,46 52,10 95,80" fill="#93C5FD" opacity=".95" />
    <polygon points="36,46 52,10 44,28" fill="#CFE4FA" />
  </svg>
);

const MENU = [
  [User, 'My profile', 'account'],
  [KeyRound, 'Account and security', 'account'],
  [ShieldCheck, 'My permissions', 'account'],
  [Bell, 'Notifications', 'alerts'],
];

export default function TitleBar({ search, setSearch, run, me }) {
  const [menu, setMenu] = useState(false);
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
      <div className="tb-org">SafeNexus ERP — {me?.co || 'Acme Mining Corp'}</div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button className="tb-acct" title={me?.name} onClick={() => setMenu(!menu)}>{me?.initials || 'KM'}</button>
        {menu && (
          <>
            <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
            <div className="acct-menu">
              <div className="acct-hd">
                <div className="acct-av">{me?.initials || 'KM'}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{me?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{me?.role}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me?.email}</div>
                </div>
              </div>
              {MENU.map(([I, l, cmd]) => (
                <button key={l} onClick={() => { setMenu(false); run(cmd); }}>
                  <I size={14} strokeWidth={1.8} /> {l}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--stroke-soft)' }}>
                <button className="danger" onClick={() => { setMenu(false); run('signOut'); }}>
                  <Lock size={14} strokeWidth={1.8} /> Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="winbtns">
        <Minus size={12} strokeWidth={2} /><Square size={12} strokeWidth={2} /><X size={12} strokeWidth={2} />
      </div>
    </div>
  );
}
