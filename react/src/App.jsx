import React, { useCallback, useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import './styles.css';

import TitleBar from './shell/TitleBar.jsx';
import Ribbon from './shell/Ribbon.jsx';
import NavPane from './shell/NavPane.jsx';
import StatusBar from './shell/StatusBar.jsx';
import Backstage from './shell/Backstage.jsx';
import { MESSAGES } from './shell/ribbon.js';
import { Dialog } from './components/ui.jsx';
import { NAV_COMPANIES } from './data.js';

import Dashboard from './screens/Dashboard.jsx';
import { Companies, Users, Fleet, Inspections, Audit } from './screens/Registers.jsx';
import { Hierarchy, Compliance, CompanyProfile, Reports, Analytics, Settings } from './screens/Misc.jsx';

const DIALOGS = {
  user: {
    title: 'Add user', submit: 'Add user',
    note: 'The user receives an invitation email with auto-generated credentials. Operators must be linked to a supervisor before they can submit inspections.',
    done: 'User created. Credentials emailed automatically.',
    fields: [
      [{ l: 'First name', p: 'Johan' }, { l: 'Last name', p: 'Swart' }],
      [{ l: 'Email address', p: 'johan.swart@acmecorp.co.za', type: 'email' }],
      [{ l: 'Role', options: ['Operator', 'Supervisor', 'Safety officer', 'Administrator'] },
        { l: 'Company', options: ['Acme Mining Corp', 'Grootegeluk Coal', 'Zimele Logistics'] }],
      [{ l: 'Reports to', options: ['P. Dlamini (Supervisor)', 'T. Nkosi (Safety officer)'] },
        { l: 'Assign vehicle', options: ['None', 'GP 789 DBN — Isuzu D-Max', 'WC 321 CT — Nissan Navara'] }],
      [{ l: 'COF expiry', type: 'date' }, { l: 'Mobile number', p: '+27 82 000 0000' }],
    ],
  },
  company: {
    title: 'Register company', submit: 'Register',
    note: 'Registering a company creates its administrator account and starts a 30-day trial on the Starter plan.',
    done: 'Company registered. Administrator credentials sent.',
    fields: [
      [{ l: 'Company name', p: 'Acme Mining Corp' }],
      [{ l: 'Registration number', p: '2018/123456/07' }, { l: 'VAT number', p: '4890123456' }],
      [{ l: 'Industry', options: ['Mining', 'Logistics', 'Construction', 'Agriculture'] },
        { l: 'Plan', options: ['Starter', 'Pro', 'Enterprise'] }],
      [{ l: 'Administrator email', p: 'admin@acmecorp.co.za', type: 'email' }],
      [{ l: 'Physical address', p: '123 Mine Road, Lephalale, Limpopo', area: true }],
    ],
  },
  vehicle: {
    title: 'Add vehicle', submit: 'Add vehicle',
    note: 'A vehicle must pass a pre-use inspection before it can be assigned to an operator.',
    done: 'Vehicle added to the fleet.',
    fields: [
      [{ l: 'Registration plate', p: 'CA 123 GP' }, { l: 'Year', p: '2024', type: 'number' }],
      [{ l: 'Make', p: 'Toyota' }, { l: 'Model', p: 'Hilux' }],
      [{ l: 'Company', options: ['Acme Mining Corp', 'Grootegeluk Coal', 'Zimele Logistics'] },
        { l: 'Current odometer', p: '0', type: 'number' }],
    ],
  },
};

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [company, setCompany] = useState('ALL');
  const [collapsed, setCollapsed] = useState(false);
  const [navWidth, setNavWidth] = useState(208);
  const [navHidden, setNavHidden] = useState(false);
  const [density, setDensity] = useState('Comfortable');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('Ready');
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [backstage, setBackstage] = useState(false);

  const flash = useCallback((text) => {
    setMsg(text);
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    setTimeout(() => setMsg('Ready'), 4000);
  }, []);

  const goTab = useCallback((key) => { setTab(key); setCollapsed(false); }, []);

  const run = useCallback((cmd) => {
    if (cmd.startsWith('goto:')) return goTab(cmd.slice(5));
    if (cmd.startsWith('dlg:')) return setDialog(cmd.slice(4));
    if (cmd.startsWith('report:')) return flash(`Generating ${cmd.slice(7).toLowerCase()}…`);
    if (cmd === 'density') {
      const next = density === 'Comfortable' ? 'Compact' : 'Comfortable';
      setDensity(next);
      return flash(`Row density set to ${next.toLowerCase()}.`);
    }
    if (cmd === 'collapse') return setCollapsed((c) => !c);
    if (cmd === 'toggleNav') {
      setNavHidden((h) => { flash(`Navigation pane ${h ? 'shown' : 'hidden'}.`); return !h; });
      return undefined;
    }
    if (cmd === 'signOffAll') return flash('5 inspections signed off in bulk.');
    return flash(MESSAGES[cmd] || 'Done.');
  }, [density, flash, goTab]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setBackstage(false); setDialog(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const props = { run, goTab, openDialog: setDialog };
  const screen = {
    dashboard: <Dashboard {...props} />,
    companies: <Companies {...props} />,
    users: <Users {...props} />,
    fleet: <Fleet {...props} />,
    inspections: <Inspections {...props} />,
    hierarchy: <Hierarchy {...props} />,
    compliance: <Compliance {...props} />,
    audit: <Audit {...props} />,
    profile: <CompanyProfile {...props} />,
    reports: <Reports {...props} />,
    analytics: <Analytics {...props} />,
    settings: <Settings {...props} />,
    view: <Dashboard {...props} />,
  }[tab];

  const dlg = dialog ? DIALOGS[dialog] : null;

  return (
    <div className={'app' + (collapsed ? ' collapsed' : '')} data-density={density}>
      <TitleBar search={search} setSearch={setSearch} run={run} />
      <Ribbon tab={tab} setTab={setTab} collapsed={collapsed} setCollapsed={setCollapsed}
        openBackstage={() => setBackstage(true)} run={run} />

      <div className="workspace">
        <NavPane hidden={navHidden} company={company} width={navWidth} setWidth={setNavWidth}
          setCompany={(k, name) => { setCompany(k); flash(`Scope set to ${name}.`); }} run={run} />
        <div className="content" key={tab}>{screen}</div>
      </div>

      <StatusBar msg={msg} density={density} toggleDensity={() => run('density')} />

      {backstage && <Backstage onClose={() => setBackstage(false)} run={run} />}

      {dlg && (
        <Dialog title={dlg.title} note={dlg.note} fields={dlg.fields} submit={dlg.submit}
          onClose={() => setDialog(null)}
          onSubmit={() => { setDialog(null); flash(dlg.done); }} />
      )}

      <div className="toastwrap">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <CircleCheck size={17} color="var(--green)" />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
