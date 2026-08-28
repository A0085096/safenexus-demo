import React from 'react';
import { Rows3 } from 'lucide-react';
import { useStore } from '../store.jsx';
import { invState, until } from '../erp/seed.js';

/* Counts come from the store, so the bar moves with the work.
   It carries what is outstanding rather than what exists — a bar
   that says "48 vehicles" tells you nothing you did not know. */
export default function StatusBar({ msg, density, toggleDensity }) {
  const {
    vehicles, inspections, defects, workOrders, jobs, fuel, tyres, parts,
    incidents, invoices, approvals, settings,
  } = useStore();

  const pending = inspections.filter((i) => !i.signed).length;
  const noGo = defects.filter((d) => d.severity === 'No Go' && d.status === 'Open').length;
  const overdue = defects.filter((d) => d.status === 'Overdue').length;
  const grounded = vehicles.filter((v) => v.status === 'Maintenance').length;
  const openWo = workOrders.filter((w) => w.status !== 'Completed').length;
  const onRoad = jobs.filter((j) => j.status === 'In transit' || j.status === 'Loading').length;
  const exceptions = fuel.filter((f) => f.exception).length;
  const illegal = tyres.filter((t) => t.status !== 'Scrapped' && t.tread < settings.minTreadMm).length;
  const short = parts.filter((p) => p.qty <= p.reorder).length;
  const openInc = incidents.filter((i) => i.status !== 'Closed').length;
  const overdueInv = invoices.filter((i) => invState(i) === 'Overdue').length;
  const waiting = approvals.filter((a) => a.status === 'Pending').length;

  const bits = [
    [`${onRoad} on the road`, onRoad],
    [`${pending} awaiting sign-off`, pending],
    [`${noGo} no-go defect${noGo === 1 ? '' : 's'}`, noGo],
    [`${grounded} grounded`, grounded],
    [`${overdue} lapsed concession${overdue === 1 ? '' : 's'}`, overdue],
    [`${openWo} job card${openWo === 1 ? '' : 's'} open`, openWo],
    [`${exceptions} fuel exception${exceptions === 1 ? '' : 's'}`, exceptions],
    [`${illegal} tyre${illegal === 1 ? '' : 's'} below the limit`, illegal],
    [`${short} part line${short === 1 ? '' : 's'} short`, short],
    [`${openInc} incident${openInc === 1 ? '' : 's'} open`, openInc],
    [`${overdueInv} invoice${overdueInv === 1 ? '' : 's'} overdue`, overdueInv],
    [`${waiting} awaiting approval`, waiting],
  ];

  return (
    <div className="statusbar">
      {bits.filter(([, n]) => n > 0).map(([label]) => <span key={label}>{label}</span>)}
      {!bits.some(([, n]) => n > 0) && <span>Nothing outstanding</span>}
      <span className={'msg' + (msg !== 'Ready' ? ' live' : '')}>{msg}</span>
      <button onClick={toggleDensity}><Rows3 size={12} /> {density}</button>
      <span className="conn">SAFENEXUS-SQL01 · connected</span>
    </div>
  );
}
