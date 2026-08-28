import React, { useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { NAV_COMPANIES } from '../data.js';
import { JUMPS } from './ribbon.js';

export default function NavPane({ company, setCompany, width, setWidth, run, hidden }) {
  const drag = useCallback((e) => {
    e.preventDefault();
    const x0 = e.clientX, base = width;
    const move = (ev) => setWidth(Math.max(150, Math.min(420, base + ev.clientX - x0)));
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
  return (
    <>
      <nav className="navpane" style={{ width }}>
        <div className="nav-head">Companies</div>
        {NAV_COMPANIES.map((c) => (
          <button key={c.key} className={'nav-item' + (company === c.key ? ' on' : '')}
            onClick={() => setCompany(c.key, c.name)}>
            <Building2 size={15} strokeWidth={1.8} />
            <span className="lbl">{c.name}</span>
            <span className="cnt">{c.n}</span>
          </button>
        ))}
        <div className="nav-head spaced">Jump to</div>
        {JUMPS.map(([l, I, cmd]) => (
          <button key={l} className="nav-item" onClick={() => run(cmd)}>
            <I size={15} strokeWidth={1.8} /><span className="lbl">{l}</span>
          </button>
        ))}
      </nav>
      <div className="splitter" title="Drag to resize · double-click to reset"
        onMouseDown={drag} onDoubleClick={() => setWidth(208)} />
    </>
  );
}
