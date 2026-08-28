import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TABS, RIBBON, CTX } from './ribbon.js';

const RibbonBtn = ({ icon: Icon, label, large, onClick }) => (
  <button className={'rbtn ' + (large ? 'lg' : 'sm')} onClick={onClick}>
    <Icon size={large ? 21 : 15} strokeWidth={1.6} />
    {large
      ? <span>{String(label).split('\n').map((l, i) => <div key={i}>{l}</div>)}</span>
      : <span>{label}</span>}
  </button>
);

export default function Ribbon({ tab, setTab, collapsed, setCollapsed, openBackstage, run }) {
  const groups = RIBBON[tab] || RIBBON.dashboard;
  const ctx = CTX[tab];

  return (
    <>
      <div className="tabstrip">
        <button className="file-btn" onClick={openBackstage}>File</button>
        {TABS.map((t) => (
          <button key={t.key} className={'rtab' + (tab === t.key ? ' on' : '')}
            onClick={() => { setTab(t.key); setCollapsed(false); }}>{t.label}</button>
        ))}
        {ctx && (
          <div className="ctx-tab">
            <div className="ctx-top">{ctx[0]}</div>
            <div className="ctx-main">{ctx[1]}</div>
          </div>
        )}
        <button className="collapse-btn" title="Collapse the ribbon" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      <div className="ribbon">
        {groups.map((g) => (
          <div className="rgroup" key={g.label}>
            <div className="rgroup-row">
              {g.lg.map(([I, l, cmd]) => <RibbonBtn key={l} icon={I} label={l} large onClick={() => run(cmd)} />)}
              {g.sm.length > 0 && (
                <div className="rgroup-small">
                  {g.sm.map(([I, l, cmd]) => <RibbonBtn key={l} icon={I} label={l} onClick={() => run(cmd)} />)}
                </div>
              )}
            </div>
            <div className="rgroup-label">{g.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
