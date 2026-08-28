import React, { useState } from 'react';
import {
  GraduationCap, Award, Clock, AlertTriangle, CheckCircle2, PlayCircle, Users as UsersIcon,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { SERIES, SEQ } from '../theme.js';
import {
  DataGrid, Btn, Badge, Avatar, Panel, ChartCard, Seg, SecHead, ListRow,
} from '../components/ui.jsx';

const tone = (s) => ({ Valid: 'green', Expiring: 'gold', Expired: 'red', 'In progress': 'blue' }[s] || 'grey');

/* ══════════════════════════════════════════════════════════════
   Learning — the competencies behind the inspections. An operator
   whose pre-use competency has lapsed should not be signing sheets,
   so the gaps are counted here and surfaced on their record.
   ══════════════════════════════════════════════════════════════ */
export default function Learning({ run }) {
  const { users, courses, enrolments, selection, select } = useStore();
  const [view, setView] = useState('records');

  const rows = enrolments.map((e) => {
    const c = courses.find((x) => x.id === e.course);
    const u = users.find((x) => x.name === e.user);
    return { ...e, course: c, courseName: c?.name || e.course, user: e.user, role: u?.role || '—', tone: u?.tone || 'grey', init: u?.init || '?' };
  });

  /* required course × person, so a gap is a real absence not a missing row */
  const gaps = [];
  users.forEach((u) => {
    courses.filter((c) => c.required && c.roles.includes(u.role)).forEach((c) => {
      const e = enrolments.find((x) => x.user === u.name && x.course === c.id);
      if (!e || e.status === 'Expired') gaps.push({ user: u, course: c, why: e ? 'Expired' : 'Never taken' });
    });
  });

  const valid = rows.filter((r) => r.status === 'Valid').length;
  const expiring = rows.filter((r) => r.status === 'Expiring').length;
  const expired = rows.filter((r) => r.status === 'Expired').length;
  const inProgress = rows.filter((r) => r.status === 'In progress');
  const compliance = rows.length ? Math.round(valid / rows.length * 100) : 0;

  const recordCols = [
    {
      key: 'user', label: 'Person', value: (r) => r.user,
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar init={r.init} tone={r.tone} />
          <div><div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.user}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.role}</div></div>
        </div>
      ),
    },
    { key: 'course', label: 'Course', value: (r) => r.courseName, render: (r) => r.courseName },
    { key: 'cat', label: 'Category', value: (r) => r.course?.cat, render: (r) => <Badge tone="grey">{r.course?.cat}</Badge> },
    { key: 'req', label: 'Required', value: (r) => (r.course?.required ? 'Yes' : 'No'), render: (r) => (r.course?.required ? <Badge tone="purple">Required</Badge> : <span style={{ color: 'var(--text3)' }}>optional</span>) },
    { key: 'done', label: 'Completed', value: (r) => r.done || '', render: (r) => <span style={{ color: 'var(--text2)' }}>{r.done || '—'}</span> },
    { key: 'exp', label: 'Valid until', value: (r) => r.expires || '', render: (r) => <span style={{ color: r.status === 'Expired' ? 'var(--red)' : r.status === 'Expiring' ? 'var(--gold)' : 'var(--text2)' }}>{r.expires || '—'}</span> },
    {
      key: 'score', label: 'Score', num: true, value: (r) => r.score ?? -1,
      render: (r) => (r.score != null ? `${r.score}%` : (
        <div className="cellbar"><div className="track" style={{ width: 56 }}>
          <div className="fill" style={{ width: (r.progress || 0) + '%', background: SERIES[0] }} /></div>
          <span className="pct" style={{ fontSize: 11 }}>{r.progress || 0}%</span></div>
      )),
    },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={tone(r.status)}>{r.status}</Badge> },
    {
      key: 'act', label: '',
      render: (r) => (r.status === 'In progress'
        ? <Btn small icon={CheckCircle2} onClick={() => run(`completeCourse:${r.user}|${r.course.id}`)}>Mark complete</Btn>
        : <Btn small onClick={() => run(`enrolFor:${r.user}|${r.course.id}`)}>Re-enrol</Btn>),
    },
  ];

  const courseCols = [
    { key: 'name', label: 'Course', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'cat', label: 'Category', value: (r) => r.cat, render: (r) => <Badge tone="grey">{r.cat}</Badge> },
    { key: 'roles', label: 'Applies to', value: (r) => r.roles.join(', '), render: (r) => <span style={{ color: 'var(--text2)' }}>{r.roles.join(', ')}</span> },
    { key: 'hours', label: 'Hours', num: true, value: (r) => r.hours, render: (r) => r.hours },
    { key: 'validity', label: 'Valid for', value: (r) => r.validity, render: (r) => (r.validity ? `${r.validity} months` : 'no expiry') },
    { key: 'req', label: 'Required', value: (r) => (r.required ? 1 : 0), render: (r) => (r.required ? <Badge tone="purple">Required</Badge> : <span style={{ color: 'var(--text3)' }}>optional</span>) },
    {
      key: 'held', label: 'Valid holders', num: true,
      value: (r) => enrolments.filter((e) => e.course === r.id && e.status === 'Valid').length,
      render: (r) => {
        const held = enrolments.filter((e) => e.course === r.id && e.status === 'Valid').length;
        const need = users.filter((u) => r.roles.includes(u.role)).length;
        const pct = need ? held / need * 100 : 0;
        return (
          <div className="cellbar">
            <div className="track"><div className="fill" style={{ width: pct + '%', background: pct >= 90 ? SERIES[1] : pct >= 60 ? SERIES[2] : SERIES[4] }} /></div>
            <span className="pct">{held}/{need}</span>
          </div>
        );
      },
    },
    { key: 'act', label: '', render: (r) => <Btn small icon={UsersIcon} onClick={() => run('enrolCourse:' + r.id)}>Enrol</Btn> },
  ];

  const switcher = (
    <Seg value={view} onChange={setView} options={[
      { v: 'records', l: `Records (${rows.length})`, icon: Award },
      { v: 'courses', l: `Courses (${courses.length})`, icon: GraduationCap },
      { v: 'gaps', l: `Gaps (${gaps.length})`, icon: AlertTriangle },
    ]} />
  );

  if (view === 'gaps') {
    return (
      <>
        <div className="cmdstrip solo">
          {switcher}
          <span className="count">{gaps.length} required course{gaps.length === 1 ? '' : 's'} missing or lapsed</span>
        </div>
        {gaps.length === 0
          ? <Panel title="No gaps"><div style={{ fontSize: 12.5, color: 'var(--text2)' }}>Everyone holds the training their role requires.</div></Panel>
          : (
            <Panel title="Training gaps" note="a lapsed competency should stop the operator signing sheets" flush>
              {gaps.map((g) => (
                <ListRow key={g.user.name + g.course.id}
                  avatar={<Avatar init={g.user.init} tone={g.user.tone} />}
                  title={`${g.user.name} — ${g.course.name}`}
                  sub={`${g.user.role} · ${g.user.co}`}
                  right={
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge tone={g.why === 'Expired' ? 'red' : 'gold'}>{g.why}</Badge>
                      <Btn small onClick={() => run(`enrolFor:${g.user.name}|${g.course.id}`)}>Enrol</Btn>
                    </div>
                  } />
              ))}
            </Panel>
          )}
      </>
    );
  }

  if (view === 'courses') {
    return <DataGrid cols={courseCols} rows={courses} keyOf={(r) => r.id} toolbar={switcher} />;
  }

  return (
    <>
      <div className="kpis">
        {[
          { l: 'Competency compliance', v: compliance + '%', note: `${valid} of ${rows.length} records valid`, dir: compliance >= 80 ? 'up' : 'warn', icon: Award },
          { l: 'Expiring within 90 days', v: String(expiring), note: 'renew before the certificate lapses', dir: 'warn', icon: Clock },
          { l: 'Expired', v: String(expired), note: 'the person may not operate on it', dir: 'dn', icon: AlertTriangle },
          { l: 'In progress', v: String(inProgress.length), note: inProgress.map((r) => r.user.split(' ')[0]).join(', ') || 'nobody mid-course', dir: 'flat', icon: PlayCircle },
        ].map((k) => (
          <div className="kpi" key={k.l}>
            <div className="kpi-lbl"><k.icon size={14} strokeWidth={1.8} />{k.l}</div>
            <div className="kpi-row"><span className="kpi-val">{k.v}</span></div>
            <div className="kpi-foot"><span className={'delta ' + k.dir} /><span className="kpi-note">{k.note}</span></div>
          </div>
        ))}
      </div>
      <DataGrid cols={recordCols} rows={rows} keyOf={(r) => r.user + r.course.id}
        selected={selection.enrolment} onSelect={(k) => select('enrolment', k)}
        toolbar={<>{switcher}<Btn small primary icon={GraduationCap} onClick={() => run('enrol')}>Assign training</Btn></>} />
    </>
  );
}
