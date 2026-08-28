import React from 'react';
import {
  ChevronLeft, Building2, UserPlus, Wrench, Truck, Printer, Download, Settings, Info,
} from 'lucide-react';
import { KV } from '../components/ui.jsx';

const ITEMS = [
  [Building2, 'Company profile', 'goto:profile'],
  [UserPlus, 'New user', 'dlg:user'],
  [Wrench, 'Raise work order', 'raiseWO'],
  [Truck, 'New vehicle', 'dlg:vehicle'],
  [Printer, 'Print', 'print'],
  [Download, 'Export', 'export'],
  [Settings, 'Options', 'goto:settings'],
  [Info, 'About SafeNexus', 'about'],
];

export default function Backstage({ onClose, run }) {
  return (
    <div className="backstage open">
      <div className="bs-rail">
        <button onClick={onClose}><ChevronLeft size={16} /> Back</button>
        <div style={{ height: 12 }} />
        {ITEMS.map(([I, l, cmd]) => (
          <button key={l} onClick={() => { onClose(); run(cmd); }}><I size={16} strokeWidth={1.6} /> {l}</button>
        ))}
      </div>
      <div className="bs-body">
        <h1>Acme Mining Corp</h1>
        <div className="bs-cols">
          <div>
            <h3>Current period</h3>
            <KV k="Period" v="June 2026" />
            <KV k="Sites" v="3 active" />
            <KV k="Users" v="11 across all roles" />
            <KV k="Vehicles" v="10 on the register" />
            <KV k="Inspections" v="449 this month" />
            <KV k="Awaiting sign-off" v="3" />
          </div>
          <div>
            <h3>Compliance</h3>
            <KV k="Audit trail" v="Append-only, 7-year retention" />
            <KV k="Privacy" v="POPIA — consent on file" />
            <KV k="Pass rate" v="98.2% across the fleet" />
            <KV k="COF register" v="certificates tracked per operator and vehicle" />
            <KV k="Go-but rule" v="a concession runs for a fixed window, then lapses" />
            <KV k="Last backup" v="18 Jun 2026, 02:00" />
          </div>
          <div>
            <h3>Subscription</h3>
            <KV k="Plan" v="Pro — R 2 499 per month" />
            <KV k="Modules active" v="3 of 8" />
            <KV k="Renews" v="18 Jul 2026" />
            <KV k="Billing contact" v="admin@acmecorp.co.za" />
          </div>
        </div>
      </div>
    </div>
  );
}
