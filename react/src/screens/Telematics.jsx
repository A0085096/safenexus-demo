import React, { useMemo } from 'react';
import {
  Radio, Activity, Zap, MapPin, CheckCircle2, Gauge, Signal, TrendingUp, Timer,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Breakdown, Bar } from '../components/erpUi.jsx';
import { num, fmtShort } from '../erp/seed.js';

/* ══════════════════════════════════════════════════════════════
   Telematics.

   The units are the reason the rest of the platform can be trusted:
   they are where the meter reading, the idle time and the position
   come from. A unit that has stopped reporting is not a small
   problem — every figure that vehicle contributes goes stale with
   it, so offline units are the first thing this screen shows.
   ══════════════════════════════════════════════════════════════ */
export default function Telematics({ run }) {
  const { vehicles, events, users, settings, selection, select, subView, setView } = useStore();
  const view = subView.telematics || 'events';

  const online = vehicles.filter((v) => v.telematics?.online);
  const offline = vehicles.filter((v) => !v.telematics?.online);
  const unack = events.filter((e) => !e.acknowledged);
  const critical = events.filter((e) => e.tone === 'red' && !e.acknowledged);
  const avgIdle = vehicles.reduce((a, v) => a + (v.month?.idlePct || 0), 0) / (vehicles.length || 1);

  const eventCols = [
    { key: 'id', label: 'Event', mono: true, value: (r) => r.id, render: (r) => r.id },
    { key: 'k', label: 'Kind', value: (r) => r.kind, render: (r) => <Badge tone={r.tone}>{r.kind}</Badge> },
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'd', label: 'Operator', value: (r) => r.driver, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.driver}</span> },
    { key: 'w', label: 'Where', value: (r) => r.where, render: (r) => r.where },
    { key: 't', label: 'When', value: (r) => r.date + r.time, render: (r) => (
      <span>{fmtShort(r.date)} <span style={{ color: 'var(--text3)' }}>{r.time}</span></span>
    ) },
    { key: 'val', label: 'Reading', wrap: true, value: (r) => r.value, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.value}</span> },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'a', label: 'Acknowledged', value: (r) => (r.acknowledged ? 'Yes' : 'No'),
      render: (r) => (r.acknowledged
        ? <Badge tone="green">Acknowledged</Badge>
        : <Btn small icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); run('ackEvent:' + r.id); }}>Acknowledge</Btn>) },
  ];

  const unitCols = [
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'f', label: 'Fleet no.', value: (r) => r.fleetNo, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.fleetNo}</span> },
    { key: 'u', label: 'Unit', mono: true, value: (r) => r.telematics?.unit, render: (r) => r.telematics?.unit },
    { key: 't', label: 'Type', value: (r) => r.type, render: (r) => <Badge tone="grey">{r.type}</Badge> },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'p', label: 'Last position', value: (r) => r.telematics?.lastPing,
      render: (r) => <span style={{ color: 'var(--text2)' }}>{r.telematics?.lastPing}</span> },
    { key: 'c', label: 'Coordinates', mono: true, value: (r) => r.telematics?.lat,
      render: (r) => <span style={{ color: 'var(--text3)', fontSize: 11 }}>
        {r.telematics?.lat.toFixed(3)}, {r.telematics?.lng.toFixed(3)}</span> },
    { key: 'ut', label: 'Utilisation', num: true, value: (r) => r.month?.utilPct, render: (r) => (
      <Bar value={r.month?.utilPct || 0} max={100} target={70}
        colour={(r.month?.utilPct || 0) >= 70 ? SERIES[1] : (r.month?.utilPct || 0) >= 45 ? SERIES[2] : SERIES[4]}
        label={(r.month?.utilPct || 0) + '%'} />
    ) },
    { key: 'i', label: 'Idle', num: true, value: (r) => r.month?.idlePct,
      render: (r) => <span style={{ fontFamily: 'var(--num)', color: (r.month?.idlePct || 0) > 15 ? 'var(--red)' : 'var(--text)' }}>
        {r.month?.idlePct}%</span> },
    { key: 'o', label: 'Unit', value: (r) => (r.telematics?.online ? 'Online' : 'Offline'),
      render: (r) => (r.telematics?.online
        ? <Badge tone="green">Reporting</Badge>
        : <Badge tone="red">Offline</Badge>) },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('telematics', v)} options={[
      { v: 'events', l: `Events (${unack.length} open)`, icon: Zap },
      { v: 'units', l: `Units (${vehicles.length})`, icon: Radio },
      { v: 'behaviour', l: 'Operator behaviour', icon: Gauge },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Units reporting', v: online.length, unit: `of ${vehicles.length}`, icon: Signal,
        dir: offline.length ? 'dn' : 'up',
        delta: offline.length ? `${offline.length} offline` : 'all reporting',
        note: 'an offline unit takes its vehicle’s figures with it' },
      { l: 'Events to action', v: unack.length, icon: Zap,
        dir: critical.length ? 'dn' : 'flat',
        delta: critical.length ? `${critical.length} serious` : 'none serious',
        note: 'over the last seven days' },
      { l: 'Average utilisation', v: (vehicles.reduce((a, v) => a + (v.month?.utilPct || 0), 0) / (vehicles.length || 1)).toFixed(0), unit: '%', icon: TrendingUp,
        note: 'engine time against available time' },
      { l: 'Average idling', v: avgIdle.toFixed(1), unit: '%', icon: Timer,
        dir: avgIdle > settings.idleAlertPct ? 'dn' : 'up',
        note: `alert threshold is ${settings.idleAlertPct}% of engine hours` },
    ]} />
  );

  if (view === 'behaviour') return <><>{kpis}</><Behaviour users={users} events={events} settings={settings} switcher={switcher} /></>;

  if (view === 'units') {
    return (
      <>
        {kpis}
        {offline.length > 0 && (
          <div className="infobar" style={{ marginBottom: 12 }}>
            <Radio size={15} strokeWidth={1.8} />
            <span>
              <b>{offline.length} unit{offline.length === 1 ? '' : 's'}</b> stopped reporting. Until they are back,
              the meter reading, idle time and position for those vehicles come from the last pre-use sheet
              rather than the feed — accurate to the shift, not the minute.
            </span>
          </div>
        )}
        <DataGrid cols={unitCols} rows={vehicles} keyOf={(r) => r.plate}
          selected={selection.vehicle} onSelect={(k) => select('vehicle', k)}
          rowClass={(r) => (r.telematics?.online ? '' : 'overdue')}
          toolbar={<>{switcher}<Btn small icon={MapPin} onClick={() => run('liveMap')}>Live map</Btn></>} />
      </>
    );
  }

  return (
    <>
      {kpis}
      <DataGrid cols={eventCols} rows={events} keyOf={(r) => r.id}
        rowClass={(r) => (r.tone === 'red' && !r.acknowledged ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={CheckCircle2} onClick={() => run('ackAll')}>Acknowledge all</Btn>
          </>
        } />
    </>
  );
}

/* ── operator behaviour ─────────────────────────────────────────
   The score is what the events add up to. It is only worth showing
   next to the events that made it, because "62" is an argument and
   "nine harsh-braking events and four over-speeds" is a coaching
   conversation. */
function Behaviour({ users, events, settings, switcher }) {
  const ceiling = settings.maxWeeklyHours;
  const warnAt = ceiling - 5;
  const operators = users.filter((u) => u.role === 'Operator');

  const rows = useMemo(() => operators.map((u) => {
    const mine = events.filter((e) => e.driver === u.name);
    return {
      ...u,
      recent: mine.length,
      speeding: mine.filter((e) => e.kind === 'Over-speeding').length,
      harshRecent: mine.filter((e) => e.kind.startsWith('Harsh')).length,
    };
  }).sort((a, b) => a.score - b.score), [operators, events]);

  const cols = [
    { key: 'n', label: 'Operator', value: (r) => r.name, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.code} · {r.licenceCode}</div></div>
    ) },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'sp', label: 'Speeding', num: true, value: (r) => r.events.speeding,
      render: (r) => <span style={{ color: r.events.speeding > 6 ? 'var(--red)' : 'var(--text)' }}>{r.events.speeding}</span> },
    { key: 'h', label: 'Harsh events', num: true, value: (r) => r.events.harsh, render: (r) => r.events.harsh },
    { key: 'i', label: 'Idle', num: true, value: (r) => r.events.idle,
      render: (r) => <span style={{ fontFamily: 'var(--num)', color: r.events.idle > settings.idleAlertPct ? 'var(--gold)' : 'var(--text)' }}>{r.events.idle}%</span> },
    { key: 'km', label: 'Km, month', num: true, value: (r) => r.kmMonth, render: (r) => num(r.kmMonth) },
    { key: 'hw', label: 'Hours, week', num: true, value: (r) => r.hoursWeek,
      render: (r) => <span style={{ fontFamily: 'var(--num)', color: r.hoursWeek > warnAt ? 'var(--red)' : 'var(--text)' }}>{r.hoursWeek}</span> },
    { key: 'sc', label: 'Score', num: true, value: (r) => r.score, render: (r) => (
      <Bar value={r.score} max={100} target={70}
        colour={r.score >= 75 ? SERIES[1] : r.score >= 55 ? SERIES[2] : SERIES[4]}
        label={String(r.score)} />
    ) },
    { key: 'st', label: 'Standing', value: (r) => r.score,
      render: (r) => (r.score < settings.standDownScore
        ? <Badge tone="red">Stand down for coaching</Badge>
        : r.score < settings.coachingScore ? <Badge tone="gold">Coaching due</Badge> : <Badge tone="green">Good standing</Badge>) },
  ];

  const overHours = rows.filter((r) => r.hoursWeek > warnAt);

  return (
    <>
      {overHours.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <Timer size={15} strokeWidth={1.8} />
          <span>
            <b>{overHours.length} operator{overHours.length === 1 ? '' : 's'}</b> {overHours.length === 1 ? 'is' : 'are'} over
            {' '}{warnAt} hours this week, against a {ceiling}-hour ceiling. Dispatch blocks a job that would take one past it —
            fatigue is the cause behind most of the events on this screen, not the driving.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.name} toolbar={switcher}
        rowClass={(r) => (r.score < settings.standDownScore ? 'overdue' : '')} />
      <div className="grid-2">
        <Panel title="Events by kind" note="last seven days, across the fleet" flush>
          <Breakdown rows={[...new Set(events.map((e) => e.kind))].map((k, i) => ({
            k, v: events.filter((e) => e.kind === k).length,
            c: events.find((e) => e.kind === k)?.tone === 'red' ? SERIES[4] : SERIES[2],
          })).sort((a, b) => b.v - a.v)} />
        </Panel>
        <Panel title="Events by site" flush>
          <Breakdown rows={['PIT', 'STL', 'HO'].map((k, i) => ({
            k: siteName(k), c: SERIES[i], v: events.filter((e) => e.site === k).length,
          }))} />
        </Panel>
      </div>
    </>
  );
}
