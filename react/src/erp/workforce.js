/* ══════════════════════════════════════════════════════════════
   The workforce.

   Three things that are usually three systems, and are one here
   because they are one set of facts read three ways:

     the roster   who is meant to be on which shift
     the shift log  what actually happened on that shift
     the timesheet  what that adds up to at the end of the week

   A mine that already knows who signed which pre-use sheet, on
   which machine, at what meter reading, is most of the way to
   knowing all three. What is missing is the shift the sheet
   belonged to — so that is what this adds.
   ══════════════════════════════════════════════════════════════ */

import { TODAY, DAY, iso, num } from './seed.js';

/* ── the calendar ───────────────────────────────────────────────
   A roster is a grid of days, so everything here works in plain
   ISO dates rather than Date objects — no timezone, no drift. */
export const isoAdd = (d, n) => iso(new Date(new Date(d + 'T00:00:00').getTime() + n * DAY));
export const dowOf = (d) => new Date(d + 'T00:00:00').getDay();
export function mondayOf(d) {
  const w = dowOf(d);
  return isoAdd(d, w === 0 ? -6 : 1 - w);
}
export const weekStart = mondayOf;
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dayLabel = (d) => `${d.slice(8)} ${MONTH[+d.slice(5, 7) - 1]}`;
export const isWeekend = (d) => dowOf(d) === 0 || dowOf(d) === 6;
export const TODAY_ISO = iso(TODAY);

/* ── the shifts a person can be on ──────────────────────────────
   One letter per shift, because a roster board has 52 pixels of
   width per day and a fortnight to show. The colour is the
   shift's identity everywhere it appears. */
export const SHIFT_DEFS = {
  D: { code: 'D', label: 'Day', time: '06:00 – 18:00', hours: 12, colour: '#1762B5', night: false },
  N: { code: 'N', label: 'Night', time: '18:00 – 06:00', hours: 12, colour: '#5B4FC7', night: true },
  M: { code: 'M', label: 'Morning', time: '06:00 – 14:00', hours: 8, colour: '#17876B', night: false },
  A: { code: 'A', label: 'Afternoon', time: '14:00 – 22:00', hours: 8, colour: '#B26A0A', night: false },
  S: { code: 'S', label: 'Standby', time: 'on call', hours: 4, colour: '#94A3B8', night: false },
  T: { code: 'T', label: 'Training', time: '07:00 – 15:00', hours: 8, colour: '#0F6E56', night: false },
  L: { code: 'L', label: 'Leave', time: '—', hours: 0, colour: '#C33B3B', night: false },
  O: { code: 'O', label: 'Off', time: '—', hours: 0, colour: '#E2E8F0', night: false },
};
/* the order a cell cycles through when you double-click it */
export const SHIFT_CYCLE = ['D', 'N', 'M', 'A', 'S', 'T', 'L', 'O'];
export const WORKING = (c) => c && c !== 'O' && c !== 'L';

/* ── the patterns a roster is generated from ────────────────────
   A pattern is a repeating cycle laid over the crew with each
   person offset by one, so the shifts interlock and the machine
   is never uncovered. */
export const PATTERNS = [
  { name: '5 on, 2 off — day shift', cycle: ['D', 'D', 'D', 'D', 'D', 'O', 'O'],
    note: 'The standard workshop and head-office week. Twelve-hour days, Monday to Friday.' },
  { name: '4 on, 4 off — continuous 12 hour', cycle: ['D', 'D', 'N', 'N', 'O', 'O', 'O', 'O'],
    note: 'Two crews cover a machine around the clock. The classic mining roster.' },
  { name: '7 on, 7 off — 12 hour', cycle: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
    note: 'Remote-site crews. Watch the weekly hours ceiling — week one is 84 hours.' },
  { name: '2-2-3 Panama — 12 hour', cycle: ['D', 'D', 'O', 'O', 'N', 'N', 'N', 'O', 'O', 'D', 'D', 'O', 'O', 'O'],
    note: 'Every second weekend off, with a slow day-to-night rotation.' },
  { name: '6 on, 1 off — 8 hour', cycle: ['M', 'M', 'M', 'M', 'M', 'M', 'O'],
    note: 'Six-day week on eight-hour mornings. Used on seasonal and stripping work.' },
  { name: 'Double day — morning and afternoon', cycle: ['M', 'M', 'M', 'A', 'A', 'A', 'O'],
    note: 'Two eight-hour shifts, no night work. Common on plant and screening.' },
  { name: 'Night only — 12 hour', cycle: ['N', 'N', 'N', 'N', 'O', 'O', 'O'],
    note: 'A dedicated night crew, usually on continuous haulage.' },
];

/* ── why a machine stood still ──────────────────────────────────
   The delay code is the whole point of a shift log: hours lost
   without a reason cannot be fixed, and "the machine was down"
   is not a reason. */
export const DELAY_CODES = [
  ['MECH', 'Breakdown — mechanical'],
  ['ELEC', 'Breakdown — electrical'],
  ['HYDR', 'Breakdown — hydraulic'],
  ['TYRE', 'Tyre change'],
  ['FUEL', 'Refuelling'],
  ['OPER', 'No operator available'],
  ['BLST', 'Blasting'],
  ['WTHR', 'Weather'],
  ['NOLD', 'No load or no tipping space'],
  ['SHFT', 'Shift change'],
  ['INSP', 'Pre-use inspection'],
  ['STDN', 'Planned standing time'],
];
export const delayName = (code) => (DELAY_CODES.find((c) => c[0] === code) || [code, code])[1];

const SCHEDULED = 12;   /* hours in a rostered shift */
const HOURLY = 128;     /* operator rate, rand per hour */

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));

/* ══════════════════════════════════════════════════════════════
   The shift log.

   One row per machine per shift: what the meter read at each end,
   what was scheduled, what was lost and to what, and what came out
   of the ground for it. Availability and utilisation both fall out
   of those numbers, which is why they are worth capturing by hand
   at the end of every shift.
   ══════════════════════════════════════════════════════════════ */
export function buildShifts(vehicles, people, n = 130) {
  const r = rng(818283);
  /* plant and haulage are what get logged by the shift; a bakkie
     doing site errands is not */
  const machines = vehicles.filter((v) => v.cls === 'Plant' || v.cls === 'Heavy');
  const operators = people.filter((u) => u.role === 'Operator');
  if (!machines.length || !operators.length) return [];

  return Array.from({ length: n }, (_, i) => {
    const v = pick(r, machines);
    const d = operators.find((x) => x.vehicle === v.plate) || pick(r, operators);
    const date = iso(new Date(TODAY.getTime() - int(r, 0, 13) * DAY));

    /* Most shifts run. Some lose twenty minutes to a tyre or a
       refuel; a few lose most of the shift to a breakdown. A
       generator that makes every shift a disaster produces a fleet
       nobody would recognise, so the long tail is deliberately
       rare and the total is capped at a third of the shift. */
    const nDelays = r() < 0.42 ? 0 : r() < 0.85 ? 1 : 2;
    const budget = { left: SCHEDULED * 60 * 0.34 };
    const delays = Array.from({ length: nDelays }, () => {
      const [code, reason] = pick(r, DELAY_CODES);
      const heavy = reason.startsWith('Breakdown') && r() < 0.35;
      const want = heavy ? int(r, 90, 240) : int(r, 15, 75);
      const minutes = Math.max(10, Math.min(want, budget.left));
      budget.left -= minutes;
      const hh = int(r, 6, 16);
      return {
        code,
        reason,
        minutes,
        reported: `${String(hh).padStart(2, '0')}:${r() < 0.5 ? '20' : '50'}`,
        repaired: r() < 0.78 ? `${String(Math.min(23, hh + int(r, 1, 4))).padStart(2, '0')}:${r() < 0.5 ? '15' : '45'}` : '',
      };
    }).filter((d) => d.minutes >= 10);

    const lost = +(delays.reduce((a, x) => a + x.minutes, 0) / 60).toFixed(1);
    const worked = Math.max(0, +(SCHEDULED - lost - r() * 1.4).toFixed(1));
    const meterStart = v.meterType === 'hours' ? v.km - int(r, 0, 280) : v.km - int(r, 0, 5200);
    const meterEnd = v.meterType === 'hours'
      ? +(meterStart + worked).toFixed(1)
      : meterStart + Math.round(worked * int(r, 22, 46));

    return {
      ref: 'SHF-26-' + String(9000 + i),
      date,
      shift: pick(r, ['A', 'B', 'Night']),
      vehicle: v.plate,
      fleetNo: v.fleetNo,
      type: v.type,
      meterType: v.meterType,
      site: v.site,
      operator: d.name,
      operatorCode: d.code,
      supervisor: d.reports,
      meterStart,
      meterEnd,
      scheduled: SCHEDULED,
      worked,
      lost,
      delays,
      /* tonnes for a hauler, cubic metres for a loader */
      production: Math.round((v.cls === 'Heavy' ? 34 : 210) * worked * (0.6 + r() * 0.8)),
      unit: v.cls === 'Heavy' ? 'Tonnes hauled' : 'Cubic metres moved',
      availability: Math.round(((SCHEDULED - lost) / SCHEDULED) * 100),
      utilisation: Math.round((worked / Math.max(0.1, SCHEDULED - lost)) * 100),
      signedOff: r() > 0.2,
      notes: '',
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const shiftHours = (s) => ({ scheduled: s.scheduled, worked: s.worked, lost: s.lost });

/* ══════════════════════════════════════════════════════════════
   The roster.

   A flat map keyed by person and date, because that is what a
   board reads and what a timesheet sums. Four weeks either side of
   today, so the board can be paged without generating anything.
   ══════════════════════════════════════════════════════════════ */
export const rosterKey = (code, date) => `${code}|${date}`;

export function buildRoster(people) {
  const r = rng(272829);
  const map = {};
  const start = isoAdd(TODAY_ISO, -14);
  people.filter((p) => p.role === 'Operator' || p.role === 'Supervisor').forEach((p, i) => {
    const pat = PATTERNS[i % PATTERNS.length];
    const offset = i % pat.cycle.length;

    /* Leave is a block. Somebody takes a fortnight in December, not
       every third Tuesday — sprinkling it across the board makes the
       roster unreadable and the pattern impossible to see. */
    const onLeave = p.duty === 'On leave';
    const leaveFrom = onLeave ? int(r, 0, 28) : r() < 0.22 ? int(r, 0, 34) : -1;
    const leaveLen = leaveFrom < 0 ? 0 : onLeave ? int(r, 10, 16) : int(r, 3, 7);

    for (let k = 0; k < 42; k += 1) {
      const date = isoAdd(start, k);
      let code = pat.cycle[(k + offset) % pat.cycle.length];
      if (leaveFrom >= 0 && k >= leaveFrom && k < leaveFrom + leaveLen) code = 'L';
      if (p.status === 'Suspended') code = 'O';
      map[rosterKey(p.code, date)] = code;
    }
  });
  return map;
}

/* ── what makes a rostered shift illegal ────────────────────────
   The board shows a red dot rather than refusing the shift,
   because a planner needs to see the whole conflict before they
   can resolve it — and sometimes the answer is to renew the
   certificate rather than move the shift. */
export function rosterConflicts(map, person, date, settings = {}) {
  const out = [];
  if (!person) return out;
  const code = map[rosterKey(person.code, date)];
  if (!WORKING(code)) return out;

  const stale = (d) => d && new Date(d) < new Date(date);
  if (stale(person.prdpExpiry)) out.push('Operating card expired');
  if (stale(person.medicalExpiry)) out.push('Medical certificate expired');
  if (stale(person.licenceExpiry)) out.push('Driving licence expired');
  if (person.status === 'Suspended') out.push('Suspended from duty');

  /* a night finishing at 06:00 into a day starting at 06:00 is
     nine hours of rest that do not exist */
  const prev = map[rosterKey(person.code, isoAdd(date, -1))];
  if (prev === 'N' && (code === 'D' || code === 'M')) out.push('Night into day — no minimum rest between shifts');

  const ceiling = settings.maxWeeklyHours || 60;
  const wk = mondayOf(date);
  let hours = 0;
  for (let i = 0; i < 7; i += 1) {
    const s = map[rosterKey(person.code, isoAdd(wk, i))];
    if (s && SHIFT_DEFS[s]) hours += SHIFT_DEFS[s].hours;
  }
  if (hours > ceiling) out.push(`${hours} hours rostered this week, over the ${ceiling}-hour ceiling`);
  return out;
}

/* ── coverage ───────────────────────────────────────────────────
   How many bodies are on each shift on each day. A day with one
   person on nights is a day with no cover the moment they call in. */
export function coverageFor(map, staff, date) {
  const c = { D: 0, N: 0, M: 0, A: 0, S: 0, T: 0, L: 0, O: 0 };
  staff.forEach((p) => {
    const s = map[rosterKey(p.code, date)] || 'O';
    if (c[s] !== undefined) c[s] += 1;
  });
  return c;
}

/* ══════════════════════════════════════════════════════════════
   The timesheet.

   Built from the roster rather than typed again, so the hours a
   person is paid for are the hours they were rostered — and any
   argument is with the board, not with the spreadsheet.

   Normal time runs to 45 hours a week; past that it is overtime at
   time and a half. Sunday is overtime whatever the total. Night
   work carries a shift allowance per hour. Standby is paid at a
   fraction of the rate, because being reachable is not the same as
   being at work.
   ══════════════════════════════════════════════════════════════ */
export const NORMAL_WEEK = 45;
export const OT_FACTOR = 1.5;
export const NIGHT_ALLOWANCE = 14;   /* rand per night hour */
export const STANDBY_FACTOR = 0.4;

export function timesheetFor(map, person, weekOf, rate = HOURLY) {
  let normal = 0;
  let overtime = 0;
  let night = 0;
  let standby = 0;
  let leave = 0;
  let days = 0;
  const cells = [];

  for (let i = 0; i < 7; i += 1) {
    const date = isoAdd(weekOf, i);
    const code = map[rosterKey(person.code, date)] || 'O';
    const def = SHIFT_DEFS[code];
    cells.push({ date, code });
    if (!def) continue;
    if (code === 'L') { leave += 8; continue; }
    if (code === 'S') { standby += def.hours; continue; }
    if (def.hours <= 0) continue;

    days += 1;
    if (dowOf(date) === 0) {
      overtime += def.hours;                       /* Sunday is always overtime */
    } else if (normal + def.hours > NORMAL_WEEK) {
      const room = Math.max(0, NORMAL_WEEK - normal);
      normal += room;
      overtime += def.hours - room;
    } else {
      normal += def.hours;
    }
    if (def.night) night += def.hours;
  }

  const pay = Math.round(
    normal * rate
    + overtime * rate * OT_FACTOR
    + night * NIGHT_ALLOWANCE
    + standby * rate * STANDBY_FACTOR,
  );

  return { cells, normal, overtime, night, standby, leave, days, rate, pay, total: normal + overtime };
}

export const HOURLY_RATE = HOURLY;
