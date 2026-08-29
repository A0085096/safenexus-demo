import React, { useMemo, useState } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Repeat, ArrowLeftRight, CalendarPlus,
  Trash2, Users, AlertTriangle, Truck, Printer, RotateCcw,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName, SITES } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel, SecHead, KV } from '../components/ui.jsx';
import { Kpis, Breakdown, Bar, Expiry } from '../components/erpUi.jsx';
import { fmtDate, num } from '../erp/seed.js';
import {
  SHIFT_DEFS, SHIFT_CYCLE, WORKING, PATTERNS, rosterKey, rosterConflicts, coverageFor,
  isoAdd, mondayOf, dowOf, isWeekend, dayLabel, DOW, TODAY_ISO,
} from '../erp/workforce.js';

/* ══════════════════════════════════════════════════════════════
   The roster.

   Who is meant to be on which shift, laid out the way a planner
   actually works: people down the side, days across the top, one
   letter per cell. Click a cell to inspect it, double-click to
   cycle the shift.

   The board does not refuse an illegal shift — it flags it with a
   red dot and tells you why. A planner needs to see the whole
   conflict before resolving it, and sometimes the right answer is
   to renew the certificate rather than move the shift.
   ══════════════════════════════════════════════════════════════ */
export default function Roster({ run, openDialog }) {
  const {
    users, roster, vehicles, settings, dispatch, me, flash, selection, select, subView, setView,
  } = useStore();
  const view = subView.roster || 'board';

  const [site, setSite] = useState('ALL');
  const [start, setStart] = useState(() => mondayOf(TODAY_ISO));
  const [span, setSpan] = useState(14);

  const staff = useMemo(
    () => users.filter((u) => (u.role === 'Operator' || u.role === 'Supervisor')
      && (site === 'ALL' || u.site === site)),
    [users, site],
  );
  const days = useMemo(() => Array.from({ length: span }, (_, i) => isoAdd(start, i)), [start, span]);

  const sel = selection.rosterCell;
  const selPerson = sel ? staff.find((p) => p.code === sel.code) : null;

  /* every conflict on the visible window, so the header can say how
     many there are without the planner hunting for red dots */
  const conflicts = useMemo(() => {
    const out = [];
    staff.forEach((p) => days.forEach((d) => {
      const c = rosterConflicts(roster, p, d, settings);
      if (c.length) out.push({ person: p, date: d, reasons: c });
    }));
    return out;
  }, [staff, days, roster, settings]);

  const conflictPeople = new Set(conflicts.map((c) => c.person.code)).size;
  const onToday = staff.filter((p) => WORKING(roster[rosterKey(p.code, TODAY_ISO)])).length;
  const uncovered = days.filter((d) => {
    const c = coverageFor(roster, staff, d);
    return c.D + c.M + c.A === 0;
  }).length;
  const totalHours = staff.reduce((a, p) => a
    + days.reduce((x, d) => x + (SHIFT_DEFS[roster[rosterKey(p.code, d)]] || { hours: 0 }).hours, 0), 0);

  const setShift = (person, date, code) => dispatch({
    type: 'SET_SHIFT', code: person.code, name: person.name, date, shift: code, by: me.name,
  });
  const cycle = (person, date) => {
    const cur = roster[rosterKey(person.code, date)] || 'O';
    setShift(person, date, SHIFT_CYCLE[(SHIFT_CYCLE.indexOf(cur) + 1) % SHIFT_CYCLE.length]);
  };

  const switcher = (
    <Seg value={view} onChange={(v) => setView('roster', v)} options={[
      { v: 'board', l: 'Roster board', icon: CalendarDays },
      { v: 'coverage', l: `Coverage${uncovered ? ` (${uncovered} gaps)` : ''}`, icon: Users },
      { v: 'patterns', l: 'Shift patterns', icon: Repeat },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'On shift today', v: onToday, unit: `of ${staff.length}`, icon: Users,
        note: `${staff.filter((p) => roster[rosterKey(p.code, TODAY_ISO)] === 'L').length} on leave` },
      { l: 'Hours rostered', v: num(totalHours), unit: 'h', icon: CalendarDays,
        note: `across ${span} days and ${staff.length} people` },
      /* People, not shifts. One operator with a lapsed medical
         rostered ten times is one problem to fix, not ten. */
      { l: 'People with a conflict', v: conflictPeople, icon: AlertTriangle,
        dir: conflictPeople ? 'dn' : 'up',
        delta: conflicts.length ? `${conflicts.length} shifts affected` : 'the window is clean',
        note: 'a lapsed certificate, no rest between shifts, or over the ceiling' },
      { l: 'Days with no cover', v: uncovered, icon: Truck,
        dir: uncovered ? 'dn' : 'up',
        note: 'nobody rostered on a working shift' },
    ]} />
  );

  if (view === 'patterns') return <><>{kpis}</><Patterns switcher={switcher} openDialog={openDialog} /></>;
  if (view === 'coverage') {
    return <><>{kpis}</><Coverage staff={staff} roster={roster} days={days} switcher={switcher} settings={settings} /></>;
  }

  return (
    <>
      {kpis}

      <div className="cmdstrip solo">
        {switcher}
        <Btn small icon={ChevronLeft} onClick={() => setStart(isoAdd(start, -7))}>Back a week</Btn>
        <span style={{ font: '600 12px var(--num)', minWidth: 150, textAlign: 'center' }}>
          {fmtDate(start)} — {fmtDate(days[days.length - 1])}
        </span>
        <Btn small icon={ChevronRight} onClick={() => setStart(isoAdd(start, 7))}>Forward a week</Btn>
        <Btn small icon={RotateCcw} onClick={() => setStart(mondayOf(TODAY_ISO))}>This week</Btn>
        <Seg value={span} onChange={setSpan} options={[{ v: 7, l: '1 week' }, { v: 14, l: '2 weeks' }, { v: 28, l: '4 weeks' }]} />
        {SITES.map((s) => (
          <Btn key={s.key} small active={site === s.key} onClick={() => setSite(s.key)}>{s.short}</Btn>
        ))}
        <span className="count">{staff.length} people</span>
      </div>

      {conflicts.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} strokeWidth={1.8} />
          <span>
            <b>{conflictPeople} {conflictPeople === 1 ? 'person' : 'people'}</b> {conflictPeople === 1 ? 'has' : 'have'} a
            problem across <b>{conflicts.length} rostered shift{conflicts.length === 1 ? '' : 's'}</b> in this
            window — a lapsed certificate, a night running straight into a day, or a week over the
            {' '}{settings.maxWeeklyHours}-hour ceiling. Most of them are one renewal away from clearing; each
            carries a red dot, and clicking the cell says which.
          </span>
        </div>
      )}

      <div className="roster">
        <div className="roster-inner">
          {/* header */}
          <div className="roster-row roster-head">
            <div className="roster-name">Operator · {staff.length}</div>
            {days.map((d) => (
              <div key={d} className={'roster-day' + (d === TODAY_ISO ? ' today' : isWeekend(d) ? ' wknd' : '')}>
                <b>{DOW[dowOf(d)]}</b>
                <i>{dayLabel(d)}</i>
              </div>
            ))}
            <div className="roster-tot">Shifts</div>
            <div className="roster-tot">Hours</div>
          </div>

          {/* one row per person */}
          {staff.map((p) => {
            const hours = days.reduce((a, d) => a + (SHIFT_DEFS[roster[rosterKey(p.code, d)]] || { hours: 0 }).hours, 0);
            const shiftsN = days.filter((d) => WORKING(roster[rosterKey(p.code, d)])).length;
            const anyConflict = conflicts.some((c) => c.person.code === p.code);
            return (
              <div className="roster-row" key={p.code}>
                <div className="roster-name" onClick={() => { select('rosterCell', { code: p.code, date: null }); select('user', p.name); }}>
                  {anyConflict && <AlertTriangle size={12} color="var(--red)" style={{ flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div className="n">{p.name}</div>
                    <div className="s">{p.licenceCode?.replace('Code ', '')} · {siteName(p.site).split(' ')[0]}</div>
                  </div>
                </div>
                {days.map((d) => {
                  const code = roster[rosterKey(p.code, d)] || 'O';
                  const def = SHIFT_DEFS[code];
                  const conf = rosterConflicts(roster, p, d, settings);
                  const on = sel && sel.code === p.code && sel.date === d;
                  return (
                    <div key={d}
                      className={'roster-cell'
                        + (code === 'O' ? ' off' : '')
                        + (isWeekend(d) ? ' wknd' : '')
                        + (on ? ' sel' : '')}
                      style={code === 'O' ? undefined : { background: def.colour }}
                      title={`${p.name} · ${fmtDate(d)} · ${def.label} ${def.time}${conf.length ? ' — ' + conf.join('; ') : ''}`}
                      onClick={() => select('rosterCell', { code: p.code, date: d })}
                      onDoubleClick={() => cycle(p, d)}>
                      {code === 'O' ? '' : code}
                      {conf.length > 0 && <span className="flag" />}
                    </div>
                  );
                })}
                <div className="roster-tot">{shiftsN}</div>
                <div className="roster-tot" style={{ fontWeight: 600, color: hours > settings.maxWeeklyHours * (span / 7) ? 'var(--red)' : undefined }}>
                  {hours}
                </div>
              </div>
            );
          })}

          {/* cover, per shift, per day */}
          {['D', 'N', 'M', 'A'].map((code) => (
            <div className="roster-cover" key={code}>
              <div className="roster-name">{SHIFT_DEFS[code].label} cover</div>
              {days.map((d) => {
                const n = coverageFor(roster, staff, d)[code];
                return (
                  <div key={d} className="roster-cover-cell"
                    style={{ color: n === 0 ? 'var(--text3)' : n < 2 ? 'var(--red)' : 'var(--brand-dark)', fontWeight: n > 0 && n < 2 ? 700 : 400 }}>
                    {n || '—'}
                  </div>
                );
              })}
              <div style={{ width: 116, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="cmdstrip solo" style={{ marginTop: 12 }}>
        <div className="roster-key">
          {Object.values(SHIFT_DEFS).map((d) => (
            <span key={d.code}>
              <i style={{ background: d.colour, color: d.code === 'O' ? 'var(--text3)' : '#fff' }}>{d.code}</i>
              {d.label} <span style={{ color: 'var(--text3)' }}>{d.time}</span>
            </span>
          ))}
        </div>
        <span className="count">double-click a cell to cycle the shift</span>
      </div>

      {selPerson && sel?.date && (
        <CellDetail person={selPerson} date={sel.date} roster={roster} settings={settings}
          vehicles={vehicles} run={run} onSet={(c) => setShift(selPerson, sel.date, c)} />
      )}
    </>
  );
}

/* ── what one cell means ────────────────────────────────────────
   A panel rather than a tooltip, because the answer to "why is
   that red" is usually three sentences and an action. */
function CellDetail({ person, date, roster, settings, vehicles, run, onSet }) {
  const code = roster[rosterKey(person.code, date)] || 'O';
  const def = SHIFT_DEFS[code];
  const conflicts = rosterConflicts(roster, person, date, settings);
  const wk = mondayOf(date);
  const weekHours = Array.from({ length: 7 }, (_, i) => roster[rosterKey(person.code, isoAdd(wk, i))])
    .reduce((a, c) => a + (SHIFT_DEFS[c] || { hours: 0 }).hours, 0);
  const veh = vehicles.find((v) => v.plate === person.vehicle);

  return (
    <Panel title={`${person.name} · ${fmtDate(date)}`}
      note={`${def.label} ${def.time}`}
      right={
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {SHIFT_CYCLE.map((c) => (
            <button key={c} className={'chip' + (c === code ? ' on' : '')} onClick={() => onSet(c)}
              title={`${SHIFT_DEFS[c].label} · ${SHIFT_DEFS[c].time}`}>
              {c}
            </button>
          ))}
        </span>
      }>
      {conflicts.length > 0 && (
        <div className="auth-err" style={{ marginBottom: 10 }}>
          <AlertTriangle size={15} />
          <span>{conflicts.join('. ')}.</span>
        </div>
      )}
      <div className="grid-2">
        <div>
          <SecHead>This shift</SecHead>
          <KV k="Shift" v={`${def.label} · ${def.time} · ${def.hours} h`} />
          <KV k="Rostered this week" v={
            <span style={{ fontWeight: 600, color: weekHours > settings.maxWeeklyHours ? 'var(--red)' : undefined }}>
              {weekHours} of {settings.maxWeeklyHours} hours
            </span>} />
          <KV k="Machine" v={person.vehicle === '—'
            ? <span style={{ color: 'var(--text3)' }}>no machine allocated</span>
            : <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openRosterVehicle:' + person.vehicle)}>
              {person.vehicle}{veh ? ` · ${veh.type}` : ''}
            </button>} />
          <KV k="Supervisor" v={person.reports} />
        </div>
        <div>
          <SecHead>Fitness to work</SecHead>
          <KV k="Driving licence" v={<Expiry date={person.licenceExpiry} />} />
          {person.prdpExpiry && <KV k="Operating card" v={<Expiry date={person.prdpExpiry} />} />}
          <KV k="Medical" v={<Expiry date={person.medicalExpiry} />} />
          <KV k="Behaviour score" v={
            <span style={{ fontWeight: 600, color: person.score >= 75 ? 'var(--green)' : person.score >= 55 ? 'var(--gold)' : 'var(--red)' }}>
              {person.score}
            </span>} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <Btn small icon={ArrowLeftRight} onClick={() => run('swapShift')}>Swap this shift</Btn>
        <Btn small icon={CalendarPlus} onClick={() => run('bookLeave')}>Book leave</Btn>
        <Btn small icon={Users} onClick={() => run('openRosterPerson:' + person.name)}>Open the record</Btn>
      </div>
    </Panel>
  );
}

/* ── coverage ───────────────────────────────────────────────────
   The board answers "who is on"; this answers "is anybody on". */
function Coverage({ staff, roster, days, switcher, settings }) {
  const rows = days.map((d) => {
    const c = coverageFor(roster, staff, d);
    const working = c.D + c.N + c.M + c.A;
    return {
      date: d,
      ...c,
      working,
      leave: c.L,
      off: c.O,
      conflicts: staff.reduce((a, p) => a + (rosterConflicts(roster, p, d, settings).length ? 1 : 0), 0),
    };
  });

  const cols = [
    { key: 'd', label: 'Date', value: (r) => r.date, render: (r) => (
      <span style={{ fontWeight: r.date === TODAY_ISO ? 600 : 400, color: r.date === TODAY_ISO ? 'var(--brand-dark)' : undefined }}>
        {DOW[dowOf(r.date)]} {fmtDate(r.date)}
      </span>
    ) },
    ...['D', 'N', 'M', 'A', 'S', 'T'].map((c) => ({
      key: c, label: SHIFT_DEFS[c].label, num: true, value: (r) => r[c],
      render: (r) => (r[c]
        ? <span style={{ fontFamily: 'var(--num)', fontWeight: 600, color: SHIFT_DEFS[c].colour }}>{r[c]}</span>
        : <span style={{ color: 'var(--text3)' }}>—</span>),
    })),
    { key: 'l', label: 'On leave', num: true, value: (r) => r.leave, render: (r) => r.leave || '—' },
    { key: 'w', label: 'Working', num: true, value: (r) => r.working, render: (r) => (
      <Bar value={r.working} max={Math.max(1, ...rows.map((x) => x.working))} target={2}
        colour={r.working === 0 ? SERIES[4] : r.working < 2 ? SERIES[2] : SERIES[1]}
        label={String(r.working)} width={54} />
    ) },
    { key: 'c', label: 'Conflicts', num: true, value: (r) => r.conflicts,
      render: (r) => (r.conflicts ? <Badge tone="red">{r.conflicts}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
    { key: 'st', label: 'Standing', value: (r) => r.working,
      render: (r) => (r.working === 0 ? <Badge tone="red">No cover</Badge>
        : r.working < 2 ? <Badge tone="gold">Thin</Badge>
          : <Badge tone="green">Covered</Badge>) },
  ];

  const gaps = rows.filter((r) => r.working === 0);

  return (
    <>
      {gaps.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <Users size={15} strokeWidth={1.8} />
          <span>
            <b>{gaps.length} day{gaps.length === 1 ? '' : 's'}</b> in this window
            {gaps.length === 1 ? ' has' : ' have'} nobody rostered on a working shift.
            That is not a quiet day unless somebody decided it would be.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.date} toolbar={switcher} pageSize={28}
        rowClass={(r) => (r.working === 0 ? 'overdue' : '')} />
      <div className="grid-2">
        <Panel title="Shifts per person" note="across the window on the board" flush>
          <Breakdown colour={SERIES[0]}
            rows={staff.map((p) => ({
              k: p.name, v: days.filter((d) => WORKING(roster[rosterKey(p.code, d)])).length,
            })).sort((a, b) => b.v - a.v).slice(0, 10)} />
        </Panel>
        <Panel title="Hours per person" note={`ceiling is ${settings.maxWeeklyHours} a week`} flush>
          <Breakdown format={(v) => v + ' h'} colour={SERIES[2]}
            rows={staff.map((p) => ({
              k: p.name,
              v: days.reduce((a, d) => a + (SHIFT_DEFS[roster[rosterKey(p.code, d)]] || { hours: 0 }).hours, 0),
            })).sort((a, b) => b.v - a.v).slice(0, 10)} />
        </Panel>
      </div>
    </>
  );
}

/* ── the patterns a roster is generated from ────────────────── */
function Patterns({ switcher, openDialog }) {
  const cols = [
    { key: 'n', label: 'Pattern', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'c', label: 'Cycle', wrap: true, value: (r) => r.cycle.join(''), render: (r) => (
      <span className="ts-week">
        {r.cycle.map((c, i) => (
          <span key={i} className={'ts-day' + (c === 'O' ? ' off' : '')}
            style={c === 'O' ? undefined : { background: SHIFT_DEFS[c].colour }}
            title={SHIFT_DEFS[c].label}>{c === 'O' ? '' : c}</span>
        ))}
      </span>
    ) },
    { key: 'l', label: 'Cycle length', num: true, value: (r) => r.cycle.length, render: (r) => r.cycle.length + ' days' },
    { key: 'h', label: 'Hours per cycle', num: true, value: (r) => r.cycle.reduce((a, c) => a + SHIFT_DEFS[c].hours, 0),
      render: (r) => r.cycle.reduce((a, c) => a + SHIFT_DEFS[c].hours, 0) + ' h' },
    { key: 'w', label: 'Average week', num: true,
      value: (r) => (r.cycle.reduce((a, c) => a + SHIFT_DEFS[c].hours, 0) / r.cycle.length) * 7,
      render: (r) => {
        const avg = (r.cycle.reduce((a, c) => a + SHIFT_DEFS[c].hours, 0) / r.cycle.length) * 7;
        return <Badge tone={avg > 60 ? 'red' : avg > 50 ? 'gold' : 'green'}>{avg.toFixed(0)} h</Badge>;
      } },
    { key: 'nt', label: 'Nights', num: true, value: (r) => r.cycle.filter((c) => SHIFT_DEFS[c].night).length,
      render: (r) => r.cycle.filter((c) => SHIFT_DEFS[c].night).length },
    { key: 'note', label: 'What it is for', wrap: true, value: (r) => r.note,
      render: (r) => <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>{r.note}</span> },
  ];

  return (
    <>
      <div className="infobar" style={{ marginBottom: 12 }}>
        <Repeat size={15} strokeWidth={1.8} />
        <span>
          A pattern is a repeating cycle laid over the crew with each person offset by one, so the shifts
          interlock and the machine is never uncovered. The average week is the number to watch: anything
          above sixty hours breaches the ceiling in at least one week of the cycle, whatever the average says.
        </span>
      </div>
      <DataGrid cols={cols} rows={PATTERNS} keyOf={(r) => r.name} toolbar={
        <>
          {switcher}
          <Btn small primary icon={CalendarDays} onClick={() => openDialog('generateRoster')}>Generate a roster</Btn>
        </>
      } pageSize={20} />
    </>
  );
}
