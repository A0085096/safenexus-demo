import React from 'react';
import { Rows3 } from 'lucide-react';

export default function StatusBar({ msg, density, toggleDensity }) {
  return (
    <div className="statusbar">
      <span>12 companies</span>
      <span>248 users</span>
      <span>184 vehicles</span>
      <span>5 inspections awaiting sign-off</span>
      <span>7 no-go defects</span>
      <span>14 COF certificates expiring</span>
      <span className={'msg' + (msg !== 'Ready' ? ' live' : '')}>{msg}</span>
      <button onClick={toggleDensity}><Rows3 size={12} /> {density}</button>
      <span className="conn">SAFENEXUS-SQL01 · connected</span>
    </div>
  );
}
