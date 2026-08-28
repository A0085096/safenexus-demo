/* SafeNexus design tokens — the JS mirror of styles.css :root */

export const T = {
  midnight: '#071E3D',
  navy: '#0C3D7A',
  primary: '#1762B5',
  accent: '#4A9EF5',
  sky: '#93C5FD',
  surface: '#E6F1FB',
  text: '#1E293B',
  text2: '#475569',
  text3: '#94A3B8',
  stroke: '#E2E8F0',
  strokeSoft: '#EEF2F7',
  strokeStrong: '#CBD5E1',
  pane: '#F1F5F9',
  app: '#F8FAFC',
  green: '#0F6E56',
  gold: '#854F0B',
  red: '#A32D2D',
  purple: '#3C3489',
  grid: '#E9EEF4',
};

/* Chart series — derived from the brand hues, then validated for the
   lightness band, chroma floor, colour-vision separation (ΔE) and
   contrast against the chart surface. Assign in this fixed order. */
export const SERIES = ['#1762B5', '#17876B', '#B26A0A', '#5B4FC7', '#C33B3B'];

/* Ordered bins / magnitude: one hue, light → dark */
export const SEQ = ['#E6F1FB', '#BCD9F5', '#7FB6E8', '#4A9EF5', '#1762B5', '#0C3D7A'];

/* Outcome is a state, so it gets the reserved status steps */
export const OUTCOME = { ok: '#17876B', go: '#B26A0A', ng: '#C33B3B' };

export const nf = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const pct = (n, d = 1) => n.toFixed(d) + '%';

/* lighten / darken a hex by an amount, for the isometric faces */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.min(255, Math.max(0, v));
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
