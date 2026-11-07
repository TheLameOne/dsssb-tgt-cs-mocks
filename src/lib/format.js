export function clock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export function duration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/** 132.25 stays exact; 132 has no trailing zeros. Negative marks keep their sign. */
export function marks(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '');
}

export function percent(fraction) {
  return fraction === null || fraction === undefined ? 'None attempted' : `${Math.round(fraction * 100)}%`;
}

export function shortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole days from today (in local time) until an ISO date. */
export function daysUntil(isoDate, now = new Date()) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}
