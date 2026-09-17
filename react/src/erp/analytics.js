/* ══════════════════════════════════════════════════════════════
   Derived analytics.

   Everything here is a sum over records the registers already
   hold. Nothing is stored, nothing is seeded, and nothing can
   drift from the thing it describes — which was the whole problem
   with the figures these replace: a hand-written table said three
   sites ran five vehicles each while the fleet register showed
   forty-eight, and both were on screen at the same time.

   One module, read by the Analytics tab, the dashboard's site
   table and the compliance report, so those three cannot disagree.
   ══════════════════════════════════════════════════════════════ */

import { SITES, siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { TODAY } from './seed.js';

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SITE_KEYS = SITES.filter((s) => s.key !== 'ALL').map((s) => s.key);

/* A sheet passes if it did not ground the vehicle. A go-but is a
   pass on a concession, which is the definition the runner, the
   defect clock and the status bar all use — stated once, here. */
export const passed = (i) => i.result !== 'no-go';
export const passRateOf = (list) => (list.length
  ? (list.filter(passed).length / list.length) * 100
  : 0);

const monthKey = (isoDate) => (isoDate || '').slice(0, 7);
const labelOf = (key) => `${MONTH[+key.slice(5, 7) - 1]} ${key.slice(2, 4)}`;

/* ── the last n calendar months, oldest first ─────────────────── */
export function monthKeys(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════
   Volume and outcome, by month.
   ══════════════════════════════════════════════════════════════ */
export function monthlySeries(inspections, n = 12, site = 'ALL') {
  const scoped = site === 'ALL' ? inspections : inspections.filter((i) => i.site === site);
  return monthKeys(n).map((key) => {
    const set = scoped.filter((i) => monthKey(i.on) === key);
    return {
      key,
      m: labelOf(key).split(' ')[0],
      y: +labelOf(key).split(' ')[1],
      label: labelOf(key),
      total: set.length,
      ok: set.filter((i) => i.result === 'in-order').length,
      go: set.filter((i) => i.result === 'go-but').length,
      ng: set.filter((i) => i.result === 'no-go').length,
      pass: +passRateOf(set).toFixed(2),
    };
  });
}

/* ── the month in progress ──────────────────────────────────────
   The current month is only as long as today. Comparing eighteen
   days against a full thirty reads as a collapse, so the delta is
   measured against the same span of the previous month. */
export function monthToDate(inspections) {
  const day = TODAY.getDate();
  const thisKey = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  const upTo = (key) => inspections.filter((i) => monthKey(i.on) === key && +i.on.slice(8) <= day);
  const now = upTo(thisKey);
  const was = upTo(prevKey);
  return {
    day,
    label: labelOf(thisKey),
    prevLabel: labelOf(prevKey),
    now: now.length,
    was: was.length,
    nowPass: +passRateOf(now).toFixed(2),
    wasPass: +passRateOf(was).toFixed(2),
    nowNg: now.filter((i) => i.result === 'no-go').length,
    wasNg: was.filter((i) => i.result === 'no-go').length,
    nowGo: now.filter((i) => i.result === 'go-but').length,
    wasGo: was.filter((i) => i.result === 'go-but').length,
  };
}

/* ══════════════════════════════════════════════════════════════
   Per site: how many people, how many vehicles, how much was
   captured, and whether it is getting better.
   ══════════════════════════════════════════════════════════════ */
export function sitePerformance(store, months = 6) {
  const { inspections, users, vehicles, defects } = store;
  const keys = monthKeys(months);

  return SITE_KEYS.map((key, i) => {
    const mine = inspections.filter((x) => x.site === key);
    const trend = keys.map((k) => {
      const set = mine.filter((x) => monthKey(x.on) === k);
      return set.length ? +passRateOf(set).toFixed(1) : null;
    });
    /* a month with no sheets carries the previous month's reading
       rather than a hole — a gap in a sparkline reads as a crash */
    let last = null;
    const filled = trend.map((v) => { if (v != null) last = v; return last; });
    const first = filled.find((v) => v != null);

    return {
      key,
      site: siteName(key),
      c: SERIES[i % SERIES.length],
      users: users.filter((u) => u.site === key).length,
      vehicles: vehicles.filter((v) => v.site === key).length,
      insp: mine.length,
      pass: +passRateOf(mine).toFixed(1),
      ng: defects.filter((d) => d.site === key && d.severity === 'No Go' && d.status !== 'Closed').length,
      trend: filled.map((v) => (v == null ? (first || 0) : v)),
      /* the drift over the window is the finding, not the level */
      drift: +((filled[filled.length - 1] || 0) - (first || 0)).toFixed(1),
    };
  });
}

/* volume per site per month — the isometric field and its 2D twin */
export function siteSeries(inspections, months = 6) {
  const keys = monthKeys(months);
  return {
    months: keys.map((k) => labelOf(k).split(' ')[0]),
    series: SITE_KEYS.map((key, i) => ({
      site: siteName(key),
      key,
      c: SERIES[i % SERIES.length],
      v: keys.map((k) => inspections.filter((x) => x.site === key && monthKey(x.on) === k).length),
    })),
  };
}

/* ══════════════════════════════════════════════════════════════
   Where it fails.

   Four cuts of the same records. Ranking by pass rate answers
   "which is worst"; the count beside it stops a single sheet at
   99% looking like a finding.
   ══════════════════════════════════════════════════════════════ */
const cutBy = (inspections, keyOf) => {
  const by = {};
  inspections.forEach((i) => {
    const k = keyOf(i);
    if (k == null) return;
    (by[k] = by[k] || []).push(i);
  });
  return Object.entries(by).map(([k, set]) => ({
    k,
    n: set.length,
    pass: +passRateOf(set).toFixed(1),
    ng: set.filter((i) => i.result === 'no-go').length,
    go: set.filter((i) => i.result === 'go-but').length,
  }));
};

export const bySite = (inspections) => cutBy(inspections, (i) => siteName(i.site)).sort((a, b) => a.pass - b.pass);
export const byShift = (inspections) => cutBy(inspections, (i) => i.shift).sort((a, b) => a.pass - b.pass);
export const byOperator = (inspections) => cutBy(inspections, (i) => i.op)
  .filter((x) => x.n >= 5).sort((a, b) => a.pass - b.pass);

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const byWeekday = (inspections) => {
  const rows = cutBy(inspections, (i) => (i.on ? DOW[new Date(i.on + 'T00:00:00').getDay()] : null));
  /* a week reads in order, not ranked — Monday next to Tuesday */
  return DOW.slice(1).concat(DOW[0]).map((d) => rows.find((r) => r.k === d)).filter(Boolean);
};

/* Which check fails most. This is the cut that changes what the
   workshop orders, so it counts failures rather than sheets. */
export function byItem(inspections, limit = 8) {
  const by = {};
  inspections.forEach((i) => (i.failed || []).forEach((f) => {
    const e = (by[f.label] = by[f.label] || { k: f.label, section: f.section, n: 0, ng: 0, go: 0 });
    e.n += 1;
    if (f.severity === 'No Go') e.ng += 1; else e.go += 1;
  }));
  const rows = Object.values(by).sort((a, b) => b.n - a.n);
  const total = rows.reduce((a, x) => a + x.n, 0) || 1;
  return rows.slice(0, limit).map((x) => ({ ...x, share: +((x.n / total) * 100).toFixed(1) }));
}

/* ══════════════════════════════════════════════════════════════
   Defect aging, on the sequential ramp, with one breach colour for
   the bin that is past the configured repair window.
   ══════════════════════════════════════════════════════════════ */
export function agingBins(defects, goButMaxDays, seq) {
  const bins = [
    { b: '0–7 days', v: 0, c: seq[1] },
    { b: '8–14 days', v: 0, c: seq[2] },
    { b: '15–21 days', v: 0, c: seq[3] },
    { b: `22–${goButMaxDays} days`, v: 0, c: seq[4] },
    { b: 'past the window', v: 0, c: '#C33B3B', breach: true },
  ];
  defects.filter((d) => d.status !== 'Closed').forEach((d) => {
    const n = d.age > goButMaxDays || d.status === 'Overdue' ? 4
      : d.age <= 7 ? 0 : d.age <= 14 ? 1 : d.age <= 21 ? 2 : 3;
    bins[n].v += 1;
  });
  return bins;
}
