import React from 'react';
import { Wrench, Truck, Eye, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { DataGrid, Btn, Badge } from '../components/ui.jsx';

const tone = (s) => ({
  'Awaiting authorisation': 'gold', 'Awaiting parts': 'gold',
  'In progress': 'blue', 'Road test': 'purple', Completed: 'green',
}[s] || 'grey');

/* Work orders are where a defect becomes workshop time. Every one
   raised from a defect keeps the link, so a grounded vehicle can be
   traced from the sheet that failed it to the job that clears it. */
export default function Workshop({ run }) {
  const { workOrders, defects, selection, select } = useStore();

  const cols = [
    { key: 'ref', label: 'Work order', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'vehicle', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'site', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'type', label: 'Type', value: (r) => r.type, render: (r) => r.type },
    { key: 'note', label: 'Work', wrap: true, value: (r) => r.note, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.note}</span> },
    { key: 'defect', label: 'From defect', value: (r) => r.defect || '',
      render: (r) => (r.defect
        ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={(e) => { e.stopPropagation(); run('openDefect:' + r.defect); }}>{r.defect}</button>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'opened', label: 'Opened', value: (r) => r.opened, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.opened}</span> },
    { key: 'assigned', label: 'Assigned to', value: (r) => r.assigned, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.assigned}</span> },
    { key: 'status', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={tone(r.status)}>{r.status}</Badge> },
    { key: 'act', label: '', render: (r) => (r.status === 'Completed'
      ? <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>closed</span>
      : <Btn small icon={CheckCircle2} onClick={(e) => { select('workOrder', r.ref); run('woStatus:Completed'); }}>Complete</Btn>) },
  ];

  const open = workOrders.filter((w) => w.status !== 'Completed');
  const grounding = workOrders.filter((w) => {
    const d = defects.find((x) => x.id === w.defect);
    return w.status !== 'Completed' && d && d.severity === 'No Go';
  });

  return (
    <>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { l: 'Open work orders', v: open.length, note: `${workOrders.length} raised in total`, icon: Wrench },
          { l: 'Awaiting parts', v: workOrders.filter((w) => w.status === 'Awaiting parts').length, note: 'blocked in the workshop', icon: Wrench },
          { l: 'Holding a vehicle off the road', v: grounding.length, note: 'raised from a no-go defect', icon: Truck },
          { l: 'From a defect', v: workOrders.filter((w) => w.defect).length, note: 'traceable to the sheet that failed', icon: Eye },
        ].map((k) => (
          <div className="kpi" key={k.l}>
            <div className="kpi-lbl"><k.icon size={14} strokeWidth={1.8} />{k.l}</div>
            <div className="kpi-row"><span className="kpi-val">{k.v}</span></div>
            <div className="kpi-foot"><span className="kpi-note">{k.note}</span></div>
          </div>
        ))}
      </div>
      <DataGrid cols={cols} rows={workOrders} keyOf={(r) => r.ref}
        selected={selection.workOrder} onSelect={(k) => select('workOrder', k)}
        toolbar={<Btn small primary icon={Wrench} onClick={() => run('raiseWO')}>Raise work order</Btn>} />
    </>
  );
}
