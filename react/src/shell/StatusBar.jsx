import React from 'react';
import { Rows3 } from 'lucide-react';
import { useStore } from '../store.jsx';
import { BASE } from '../data.js';

/* Counts come from the store, so the bar moves with the work. */
export default function StatusBar({ msg, density, toggleDensity }) {
  const { companies, users, vehicles, inspections, defects, settings } = useStore();
  const pending = inspections.filter((i) => !i.signed).length;
  const noGo = defects.filter((d) => d.severity === 'No Go' && d.status === 'Open').length;
  const overdue = defects.filter((d) => d.status === 'Open' && d.age > settings.goButMaxDays).length;
  const grounded = vehicles.filter((v) => v.status === 'Maintenance').length;

  return (
    <div className="statusbar">
      <span>{BASE.companies + companies.length} companies</span>
      <span>{BASE.users + users.length} users</span>
      <span>{BASE.vehicles + vehicles.length} vehicles</span>
      <span>{pending} awaiting sign-off</span>
      <span>{noGo} no-go defect{noGo === 1 ? '' : 's'}</span>
      <span>{grounded} grounded</span>
      <span>{overdue} past the {settings.goButMaxDays}-day rule</span>
      <span className={'msg' + (msg !== 'Ready' ? ' live' : '')}>{msg}</span>
      <button onClick={toggleDensity}><Rows3 size={12} /> {density}</button>
      <span className="conn">SAFENEXUS-SQL01 · connected</span>
    </div>
  );
}
