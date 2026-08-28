import React, { useMemo, useState } from 'react';
import {
  Timer, ChevronLeft, ChevronRight, CheckCircle2, Banknote, Download, Lock,
  RotateCcw, Users, Moon, Clock, AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName, SITES } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Bar } from '../components/erpUi.jsx';
import { R, num, fmtDate } from '../erp/seed.js';
import {
  SHIFT_DEFS, timesheetFor, mondayOf, isoAdd, dowOf, DOW, TODAY_ISO,
  NORMAL_WEEK, OT_FACTOR, NIGHT_ALLOWANCE, STANDBY_FACTOR, HOURLY_RATE,
} from '../erp/workforce.js';

/* ══════════════════════════════════════════════════════════════
   Timesheets.

   Built from the roster rather than typed again. That is the whole
   argument for having the roster in the same system: the hours a
   person is paid for are the hours they were rostered, so any
   dispute is with the board — which is dated, audited and visible
   to the supervisor who set it — rather than with a spreadsheet
   somebody keyed on Friday afternoon.

   Normal time runs to forty-five hours; past that it is overtime
   at time and a half. Sunday is overtime whatever the total. Night
   work carries an allowance per hour, and standby is paid at a
   fraction, because being reachable is not being at work.
   ══════════════════════════════════════════════════════════════ */
export default function Timesheets({ run }) {
  const {
    users, roster, approvedWeeks, dispatch, me, flash, subView, setView,
  } = useStore();
  const view = subView.timesheets || 'week';

  const [week, setWeek] = useState(() => mondayOf(TODAY_ISO));
  const [site, setSite] = useState('ALL');

  const staff = useMemo(
    () => users.filter((u) => (u.role === 'Operator' || u.role === 'Supervisor')
      && (site === 'ALL' || u.site === site)),
    [users, site],
  );

  const rows = useMemo(
    () => staff.map((p) => ({ ...p, ts: timesheetFor(roster, p, week) }))
      .filter((r) => r.ts.total > 0 || r.ts.leave > 0 || r.ts.standby > 0)
      .sort((a, b) => b.ts.pay - a.ts.pay),
    [staff, roster, week],
  );

  const approved = approvedWeeks.includes(week);
  const sum = (k) => rows.reduce((a, r) => a + r.ts[k], 0);
  const totalPay = sum('pay');
  const overtimeShare = sum('total') ? (sum('overtime') / sum('total')) * 100 : 0;
  const overCeiling = rows.filter((r) => r.ts.total > 60);

  const approve = () => {
    if (approved) {
      dispatch({ type: 'REOPEN_WEEK', week, by: me.name });
      flash(`The week of ${fmtDate(week)} has been reopened — timesheets can be changed again.`,
        { tone: 'warn', title: 'Week reopened' });
      return;
    }
    if (overCeiling.length) {
      const who = overCeiling.length === 1
        ? `${overCeiling[0].name} is`
        : `${overCeiling.length} people are`;
      flash(`${who} over sixty hours this week. Fix the roster before approving — approving it turns a rostering mistake into a payroll record.`,
        { tone: 'warn', title: 'Over the ceiling' });
      return;
    }
    dispatch({
      type: 'APPROVE_WEEK', week, by: me.name,
      people: rows.length, hours: sum('total').toFixed(0), pay: totalPay,
    });
    flash(`Timesheets approved for the week of ${fmtDate(week)} — ${rows.length} people, ${sum('total').toFixed(0)} hours, ${R(totalPay)}.`,
      { title: 'Week approved' });
  };

  const days = Array.from({ length: 7 }, (_, i) => isoAdd(week, i));

  const cols = [
    { key: 'n', label: 'Person', value: (r) => r.name, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.empNo} · {r.role}</div></div>
    ) },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'wk', label: 'The week', value: (r) => r.ts.cells.map((c) => c.code).join(''), render: (r) => (
      <span className="ts-week">
        {r.ts.cells.map((c) => (
          <span key={c.date} className={'ts-day' + (c.code === 'O' ? ' off' : '')}
            style={c.code === 'O' ? undefined : { background: SHIFT_DEFS[c.code].colour }}
            title={`${DOW[dowOf(c.date)]} ${fmtDate(c.date)} · ${SHIFT_DEFS[c.code].label}`}>
            {c.code === 'O' ? '' : c.code}
          </span>
        ))}
      </span>
    ) },
    { key: 'd', label: 'Days', num: true, value: (r) => r.ts.days, render: (r) => r.ts.days },
    { key: 'nm', label: 'Normal', num: true, value: (r) => r.ts.normal, render: (r) => r.ts.normal + ' h' },
    { key: 'ot', label: 'Overtime', num: true, value: (r) => r.ts.overtime,
      render: (r) => (r.ts.overtime
        ? <span style={{ fontFamily: 'var(--num)', fontWeight: 600, color: 'var(--gold)' }}>{r.ts.overtime} h</span>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'nt', label: 'Night', num: true, value: (r) => r.ts.night,
      render: (r) => (r.ts.night ? r.ts.night + ' h' : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'sb', label: 'Standby', num: true, value: (r) => r.ts.standby,
      render: (r) => (r.ts.standby ? r.ts.standby + ' h' : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'lv', label: 'Leave', num: true, value: (r) => r.ts.leave,
      render: (r) => (r.ts.leave ? r.ts.leave + ' h' : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'tt', label: 'Total worked', num: true, value: (r) => r.ts.total, render: (r) => (
      <Bar value={Math.min(r.ts.total, 72)} max={72} target={60}
        colour={r.ts.total > 60 ? SERIES[4] : r.ts.total > 45 ? SERIES[2] : SERIES[1]}
        label={r.ts.total + ' h'} />
    ) },
    { key: 'p', label: 'Pay', num: true, value: (r) => r.ts.pay, render: (r) => <Money v={r.ts.pay} bold /> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('timesheets', v)} options={[
      { v: 'week', l: 'The week', icon: Timer },
      { v: 'rates', l: 'How it is calculated', icon: Banknote },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'People on the sheet', v: rows.length, icon: Users,
        note: `${rows.reduce((a, r) => a + r.ts.days, 0)} shifts worked in the week` },
      { l: 'Hours worked', v: sum('total').toFixed(0), unit: 'h', icon: Clock,
        delta: `${sum('overtime').toFixed(0)} h overtime`,
        dir: overtimeShare > 20 ? 'dn' : 'flat',
        note: `${overtimeShare.toFixed(0)}% of the week is at time and a half` },
      { l: 'Night hours', v: sum('night').toFixed(0), unit: 'h', icon: Moon,
        note: `allowance ${R(NIGHT_ALLOWANCE)} an hour on top of the rate` },
      { l: 'Payroll for the week', v: R(totalPay).replace('R ', ''), unit: 'R', icon: Banknote,
        dir: approved ? 'up' : 'flat',
        delta: approved ? 'approved' : 'not yet approved',
        note: `at ${R(HOURLY_RATE)} an hour normal time` },
    ]} />
  );

  if (view === 'rates') return <><>{kpis}</><Rates rows={rows} switcher={switcher} /></>;

  return (
    <>
      {kpis}

      <div className="cmdstrip solo">
        {switcher}
        <Btn small icon={ChevronLeft} onClick={() => setWeek(isoAdd(week, -7))}>Previous</Btn>
        <span style={{ font: '600 12px var(--num)', minWidth: 178, textAlign: 'center' }}>
          Week of {fmtDate(week)} — {fmtDate(days[6])}
        </span>
        <Btn small icon={ChevronRight} onClick={() => setWeek(isoAdd(week, 7))}>Next</Btn>
        <Btn small icon={RotateCcw} onClick={() => setWeek(mondayOf(TODAY_ISO))}>This week</Btn>
        {SITES.map((s) => (
          <Btn key={s.key} small active={site === s.key} onClick={() => setSite(s.key)}>{s.short}</Btn>
        ))}
        {approved && <Badge tone="green">Approved</Badge>}
      </div>

      {overCeiling.length > 0 && !approved && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} strokeWidth={1.8} />
          <span>
            <b>{overCeiling.map((r) => r.name).join(', ')}</b> {overCeiling.length === 1 ? 'is' : 'are'} over
            sixty hours this week. The week cannot be approved until the roster is fixed — approving it would
            turn a rostering mistake into a payroll record, and payroll records are what an inspector asks for.
          </span>
        </div>
      )}

      {approved && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <Lock size={15} strokeWidth={1.8} />
          <span>
            This week was approved and is closed for payroll. Reopening it is possible and audited, but
            anything already sent to payroll will not come back on its own.
          </span>
        </div>
      )}

      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.name} pageSize={20}
        onSelect={(k) => run('openTimesheetPerson:' + k)}
        rowClass={(r) => (r.ts.total > 60 ? 'overdue' : '')}
        toolbar={
          <>
            <Btn small primary={!approved} icon={approved ? RotateCcw : CheckCircle2} onClick={approve}>
              {approved ? 'Reopen the week' : 'Approve the week'}
            </Btn>
            <Btn small icon={Banknote} onClick={() => run('sendPayroll')}>Send to payroll</Btn>
            <Btn small icon={Download} onClick={() => run('export')}>Export CSV</Btn>
          </>
        }
        emptyText="Nobody was rostered in this week. Move to another week, or generate a roster."
        totals={(list) => (
          <>
            <td colSpan={3} style={{ fontWeight: 600 }}>{list.length} people</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.ts.days, 0)}</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.ts.normal, 0)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.ts.overtime, 0)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.ts.night, 0)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.ts.standby, 0)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.ts.leave, 0)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.ts.total, 0)} h</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + r.ts.pay, 0))}</td>
          </>
        )} />
    </>
  );
}

/* ── how the number was arrived at ──────────────────────────────
   Payroll disputes are almost never about the hours; they are
   about which hours counted as what. So the rules are on screen
   next to the money they produced. */
function Rates({ rows, switcher }) {
  const sum = (k) => rows.reduce((a, r) => a + r.ts[k], 0);

  const bands = [
    { k: 'Normal time', hours: sum('normal'), rate: HOURLY_RATE,
      pay: sum('normal') * HOURLY_RATE, c: SERIES[0],
      rule: `The first ${NORMAL_WEEK} hours of the week, at the standard rate.` },
    { k: 'Overtime', hours: sum('overtime'), rate: HOURLY_RATE * OT_FACTOR,
      pay: sum('overtime') * HOURLY_RATE * OT_FACTOR, c: SERIES[2],
      rule: `Anything past ${NORMAL_WEEK} hours, and all of Sunday, at time and a half.` },
    { k: 'Night allowance', hours: sum('night'), rate: NIGHT_ALLOWANCE,
      pay: sum('night') * NIGHT_ALLOWANCE, c: SERIES[3],
      rule: 'Paid per night hour on top of whatever band the hour already fell in.' },
    { k: 'Standby', hours: sum('standby'), rate: HOURLY_RATE * STANDBY_FACTOR,
      pay: sum('standby') * HOURLY_RATE * STANDBY_FACTOR, c: SERIES[4],
      rule: 'Being reachable is not being at work, so it is paid at a fraction of the rate.' },
  ];

  const cols = [
    { key: 'k', label: 'Band', value: (r) => r.k, render: (r) => <span style={{ fontWeight: 600 }}>{r.k}</span> },
    { key: 'r', label: 'Rule', wrap: true, value: (r) => r.rule,
      render: (r) => <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>{r.rule}</span> },
    { key: 'h', label: 'Hours', num: true, value: (r) => r.hours, render: (r) => r.hours + ' h' },
    { key: 'rt', label: 'Rate', num: true, value: (r) => r.rate, render: (r) => 'R ' + r.rate.toFixed(2) },
    { key: 'p', label: 'Pay', num: true, value: (r) => r.pay, render: (r) => <Money v={r.pay} bold /> },
    { key: 'sh', label: 'Share of the bill', num: true, value: (r) => r.pay, render: (r) => {
      const total = bands.reduce((a, b) => a + b.pay, 0);
      return (
        <Bar value={r.pay} max={Math.max(...bands.map((b) => b.pay))} colour={r.c}
          label={total ? ((r.pay / total) * 100).toFixed(0) + '%' : '0%'} />
      );
    } },
  ];

  return (
    <>
      <div className="infobar" style={{ marginBottom: 12 }}>
        <Banknote size={15} strokeWidth={1.8} />
        <span>
          Every hour on the timesheet came off the roster, and every hour is placed in exactly one band —
          then the night allowance is added on top of whichever band the hour already fell in. That is the
          whole calculation; nothing is keyed by hand, so nothing can be keyed wrong.
        </span>
      </div>
      <DataGrid cols={cols} rows={bands} keyOf={(r) => r.k} toolbar={switcher} pageSize={20}
        totals={(list) => (
          <>
            <td colSpan={2} style={{ fontWeight: 600 }}>Total for the week</td>
            <td className="num" style={{ fontWeight: 600 }}>{list.reduce((a, r) => a + r.hours, 0)} h</td>
            <td />
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + r.pay, 0))}</td>
            <td />
          </>
        )} />
      <div className="grid-2">
        <Panel title="Pay by person" note="the ten largest this week" flush>
          <Breakdown format={R} colour={SERIES[0]}
            rows={rows.slice(0, 10).map((r) => ({ k: r.name, v: r.ts.pay }))} />
        </Panel>
        <Panel title="Overtime by person" note="where the premium is going" flush>
          <Breakdown format={(v) => v + ' h'} colour={SERIES[2]}
            rows={rows.filter((r) => r.ts.overtime).map((r) => ({ k: r.name, v: r.ts.overtime }))
              .sort((a, b) => b.v - a.v).slice(0, 10)} />
        </Panel>
      </div>
    </>
  );
}
