import React, { useEffect, useState } from 'react';
import { CircleCheck, AlertTriangle, CircleAlert, Info, X, Undo2 } from 'lucide-react';

const ICON = { ok: CircleCheck, warn: AlertTriangle, err: CircleAlert, info: Info };

function Toast({ t, onClose }) {
  const Icon = ICON[t.tone] || ICON.ok;
  const [leaving, setLeaving] = useState(false);
  const life = t.action ? 7000 : 4200;

  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), life - 220);
    const b = setTimeout(() => onClose(t.id), life);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [t.id, life, onClose]);

  return (
    <div className={`toast ${t.tone}${leaving ? ' leaving' : ''}`} role="status">
      <Icon className="t-ico" size={17} strokeWidth={1.9} />
      <div className="t-body">
        {t.title && <div className="t-title">{t.title}</div>}
        <div className="t-text">{t.text}</div>
        {t.action && (
          <button className="t-action" onClick={() => { t.action.onClick(); onClose(t.id); }}>
            <Undo2 size={13} /> {t.action.label}
          </button>
        )}
      </div>
      <button className="t-close" onClick={() => onClose(t.id)} aria-label="Dismiss"><X size={13} /></button>
      <span className="t-life" style={{ animationDuration: life + 'ms' }} />
    </div>
  );
}

export default function Toasts({ items, onClose }) {
  return (
    <div className="toastwrap">
      {items.map((t) => <Toast key={t.id} t={t} onClose={onClose} />)}
    </div>
  );
}
