import React, { useCallback, useState } from 'react';
import { Search, X, ChevronRight, LogOut } from 'lucide-react';
import { NAV_COMPANIES } from '../data.js';
import { JUMPS } from './ribbon.js';
import { useStore } from '../store.jsx';

/* The workspace scope lives here: which company you are looking at,
   and the queues worth jumping to, each carrying its live count. */
export default function NavPane({ company, setCompany, width, setWidth, run, hidden }) {
  const { me, inspections, defects, vehicles, users } = useStore();
  const [q, setQ] = useState('');

  const counts = {
    'goto:inspections': inspections.filter((i) => !i.signed).length,
    'goto:fleet': vehicles.filter((v) => v.status === 'Maintenance').length,
    'goto:compliance': defects.filter((d) => d.status === 'Open' && d.age > 25).length,
    'goto:hierarchy': users.filter((u) => u.role === 'Operator' && u.reports === '—').length + 3,
    'goto:audit': 0,
  };
  const tones = {
    'goto:inspections': 'gold', 'goto:fleet': 'red', 'goto:compliance': 'gold', 'goto:hierarchy': 'gold',
  };

  const drag = useCallback((e) => {
    e.preventDefault();
    const x0 = e.clientX, base = width;
    const move = (ev) => setWidth(Math.max(176, Math.min(400, base + ev.clientX - x0)));
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.userSelect = ''; document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    document.body.style.userSelect = 'none'; document.body.style.cursor = 'col-resize';
  }, [width, setWidth]);

  if (hidden) return null;
  const list = NAV_COMPANIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <nav className="navpane" style={{ width }}>
        <div className="nav-scroll">
          <div className="nav-search">
            <Search size={13} strokeWidth={1.9} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a company" />
            {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={11} /></button>}
          </div>

          <div className="nav-head">Scope</div>
          {list.map((c) => {
            const on = company === c.key;
            return (
              <button key={c.key} className={'nav-item' + (on ? ' on' : '')} onClick={() => setCompany(c.key, c.name)}>
                <span className={'nav-chip' + (c.key === 'ALL' ? ' all' : '')}>
                  {c.key === 'ALL' ? '★' : c.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}
                </span>
                <span className="lbl">{c.name}</span>
                <span className="cnt">{c.n}</span>
              </button>
            );
          })}
          {!list.length && <div className="nav-empty">No company matches “{q}”.</div>}

          <div className="nav-head spaced">Queues</div>
          {JUMPS.map(([l, I, cmd]) => {
            const n = counts[cmd] ?? 0;
            return (
              <button key={l} className="nav-item" onClick={() => run(cmd)}>
                <I size={15} strokeWidth={1.8} />
                <span className="lbl">{l}</span>
                {n > 0
                  ? <span className={'nav-pill ' + (tones[cmd] || 'grey')}>{n}</span>
                  : <ChevronRight className="nav-go" size={13} />}
              </button>
            );
          })}
        </div>

        <div className="nav-foot">
          <div className="nav-me">
            <span className="nav-me-av">{me.initials}</span>
            <span className="nav-me-txt">
              <b>{me.name}</b>
              <i>{me.role} · {me.co}</i>
            </span>
            <button title="Sign out" onClick={() => run('signOut')}><LogOut size={14} strokeWidth={1.8} /></button>
          </div>
        </div>
      </nav>
      <div className="splitter" title="Drag to resize · double-click to reset"
        onMouseDown={drag} onDoubleClick={() => setWidth(216)} />
    </>
  );
}
