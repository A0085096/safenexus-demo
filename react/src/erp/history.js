/* ══════════════════════════════════════════════════════════════
   The inspection history.

   Analytics was the last screen still asserting its numbers rather
   than deriving them: it reported three sites with five vehicles
   each while the fleet register showed forty-eight. The cause was
   that the store only held the eight recent sheets the defect
   register points at — there was no history to compute a trend
   from, so the trend was written by hand and then drifted.

   This generates the history instead. Twelve months of pre-use
   sheets across the live fleet, each one dated, on a shift, on a
   weekday, carrying the items that actually failed. Every figure
   on the Analytics tab is then a sum over these records, which
   means it cannot disagree with the register it came from.

   The eight hand-written sheets stay at the head of the list: the
   defects, work orders and concessions in data.js reference them
   by number, and that story is the point of the demo.
   ══════════════════════════════════════════════════════════════ */

import { TODAY, DAY, iso } from './seed.js';
import { allItems, templateFor } from '../inspection/templates.js';

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

/* The shifts a sheet can be captured on. A pre-use inspection
   happens at the start of a shift, so the mix follows the roster:
   most work is on days, least on nights. */
const SHIFTS = [
  ['Day A', 0.30], ['Day B', 0.26], ['Aft A', 0.16],
  ['Aft B', 0.12], ['Night A', 0.09], ['Night B', 0.07],
];
const weighted = (r, table) => {
  let x = r();
  for (const [value, w] of table) { x -= w; if (x <= 0) return value; }
  return table[table.length - 1][0];
};

/* A mine does not inspect evenly across the week. Monday carries
   the weekly checks on top of the daily ones, and the weekend is
   a skeleton crew. */
const DOW_WEIGHT = [0.04, 0.20, 0.18, 0.17, 0.16, 0.15, 0.10];

export function buildInspectionHistory(vehicles, people, templates, months = 12) {
  const r = rng(551133);
  const operators = people.filter((u) => u.role === 'Operator' && u.status === 'Active');
  const supervisors = people.filter((u) => ['Supervisor', 'Safety officer'].includes(u.role));
  if (!vehicles.length || !operators.length) return [];

  /* A sheet is only captured on a vehicle somebody can operate. */
  const inspectable = vehicles.filter((v) => v.cls !== 'Trailer');
  const out = [];
  let ref = 2118000;

  /* Volume grows over the year the way adoption does — the mine did
     not start inspecting everything on day one. */
  for (let m = months - 1; m >= 0; m -= 1) {
    const adoption = 0.55 + ((months - 1 - m) / (months - 1)) * 0.45;
    const perMonth = Math.round(inspectable.length * 8 * adoption);

    for (let k = 0; k < perMonth; k += 1) {
      /* spread across the month, weighted by weekday */
      let day;
      let tries = 0;
      do {
        day = int(r, 0, 27);
        tries += 1;
      } while (tries < 6 && r() > DOW_WEIGHT[new Date(TODAY.getTime() - (m * 30 + day) * DAY).getDay()] * 5);

      const when = new Date(TODAY.getTime() - (m * 30 + day) * DAY);
      if (when > TODAY) continue;

      const v = pick(r, inspectable);
      const op = operators.find((u) => u.vehicle === v.plate) || pick(r, operators);
      const tpl = templateFor(v.type, templates);
      const items = allItems(tpl);
      if (!items.length) continue;

      /* The outcome mix is what every figure on the Analytics tab
         ultimately measures, so it is the one number worth being
         deliberate about. A go-but counts as a pass, so the no-go share is
         what the pass rate really reports. Four to seven percent puts the
         fleet in the mid-nineties against a 95% target — tight
         enough that the target means something, and improving
         across the year. */
      const noGo = 0.070 - ((months - 1 - m) / (months - 1)) * 0.032;
      const goBut = 0.16;
      const roll = r();
      const result = roll < noGo ? 'no-go'
        : roll < noGo + goBut ? 'go-but' : 'in-order';

      /* which checks failed — drawn from the sections whose
         severity matches the outcome, so a no-go sheet fails a
         no-go item and not a cab-cleanliness one */
      const pool = items.filter((i) => (result === 'no-go'
        ? i.severity === 'No Go'
        : i.severity === 'Go But'));
      const nFail = result === 'in-order' ? 0
        : result === 'no-go' ? 1
          : int(r, 1, 3);
      const failed = [];
      for (let f = 0; f < nFail && pool.length; f += 1) {
        const item = pick(r, pool);
        if (!failed.some((x) => x.id === item.id)) {
          failed.push({ id: item.id, label: item.label, section: item.section, severity: item.severity });
        }
      }

      const go = result === 'go-but' ? failed.length : 0;
      const ng = result === 'no-go' ? failed.length : 0;
      /* Old sheets are closed out: leaving 10% of a year's history
         unsigned puts hundreds of stale rows in the sign-off queue
         and buries the handful that actually need a signature. */
      const ageDays = Math.round((TODAY - when) / DAY);
      const signed = ageDays > 21 ? r() > 0.01
        : result === 'in-order' ? r() > 0.10 : r() > 0.25;

      out.push({
        ref: String(ref -= 1),
        on: iso(when),
        date: when.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          + ' ' + String(int(r, 4, 19)).padStart(2, '0') + ':' + String(int(r, 0, 59)).padStart(2, '0'),
        vehicle: v.plate,
        op: op.name,
        site: v.site,
        shift: weighted(r, SHIFTS),
        ok: items.length - failed.length,
        go,
        ng,
        result,
        signed,
        signedBy: signed ? (supervisors.find((s) => s.name === op.reports) || pick(r, supervisors) || { name: '—' }).name : undefined,
        templateId: tpl.id,
        failed,
        sheet: null,
        historic: true,
      });
    }
  }

  return out.sort((a, b) => (a.on < b.on ? 1 : -1));
}

/* The eight hand-written sheets carry display dates like
   "Today 06:15" rather than an ISO one. Analytics needs something
   sortable, so they are given the date those words mean. */
export function datedCore(core) {
  const dayOf = (text) => {
    if (/^Today/.test(text)) return iso(TODAY);
    if (/^Yesterday/.test(text)) return iso(new Date(TODAY.getTime() - DAY));
    /* "16 Jun 06:22" — the seed year is the platform's own */
    const m = text.match(/^(\d{1,2})\s+([A-Za-z]{3})/);
    if (m) {
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(m[2]);
      if (month >= 0) return iso(new Date(TODAY.getFullYear(), month, +m[1]));
    }
    return iso(TODAY);
  };
  return core.map((i) => ({ ...i, on: dayOf(i.date), sheet: null }));
}
