import React from 'react';
import { Rows3 } from 'lucide-react';
import { useStore } from '../store.jsx';

/* Counts come from the store, so the bar moves with the work. */
export default function StatusBar({ msg, density, toggleDensity }) {
  const { users, vehicles, inspections, defects, workOrders, settings } = useStore();
  const pending = inspections.filter((i) => !i.signed).length;
  const noGo = defects.filter((d) => d.severity === 'No Go' && d.status === 'Open').length;
  const overdue = defects.filter((d) => d.status === 'Overdue').length;
  const grounded = vehicles.filter((v) => v.status === 'Maintenance').length;

  return (
    <div className="statusbar">
      <span>{users.length} users</span>
      <span>{vehicles.length} vehicles</span>
      <span>{workOrders.filter((w) => w.status !== 'Completed').length} work orders open</span>
      <span>{pending} awaiting sign-off</span>
      <span>{noGo} no-go defect{noGo === 1 ? '' : 's'}</span>
      <span>{grounded} grounded</span>
      <span>{overdue} lapsed concession{overdue === 1 ? '' : 's'}</span>
      <span className={'msg' + (msg !== 'Ready' ? ' live' : '')}>{msg}</span>
      <button onClick={toggleDensity}><Rows3 size={12} /> {density}</button>
      <span className="conn">SAFENEXUS-SQL01 · connected</span>
    </div>
  );
}
