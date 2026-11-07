import { useEffect, useRef, useState } from 'react';

// Figures for data interpretation questions. Candidates must read exact values from these,
// so every value is printed: at the bar tip, in the pie's key, or in a table under the line chart.

function useWidth(initial = 480) {
  const ref = useRef(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

const seriesColor = (i) => `var(--series-${(i % 6) + 1})`;

function format(value, unit) {
  const text = Number.isInteger(value) ? value.toLocaleString('en-IN') : String(value);
  return unit === '%' ? `${text}%` : text;
}

function Legend({ names }) {
  if (names.length < 2) return null;
  return (
    <ul className="chart-legend">
      {names.map((name, i) => (
        <li key={name}>
          <span className="chart-swatch" style={{ background: seriesColor(i) }} />
          {name}
        </li>
      ))}
    </ul>
  );
}

function Bars({ chart }) {
  const max = Math.max(...chart.series.flatMap((s) => s.values), 1);
  return (
    <>
      <Legend names={chart.series.map((s) => s.name)} />
      <div className="bars">
        {chart.labels.map((label, row) => (
          <div className="bars-row" key={label}>
            <div className="bars-label">{label}</div>
            <div className="bars-track">
              {chart.series.map((s, i) => (
                <div className="bars-line" key={s.name}>
                  <span
                    className="bars-bar"
                    style={{ width: `calc((100% - 4.5em) * ${s.values[row] / max})`, background: seriesColor(i) }}
                  />
                  <span className="bars-value">{format(s.values[row], chart.unit)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function polar(cx, cy, r, angle) {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}

function Pie({ chart }) {
  const values = chart.series[0].values;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const size = 200;
  const c = size / 2;
  const r = c - 2;
  let angle = 0;
  const slices = values.map((value, i) => {
    const start = angle;
    angle += (value / total) * 2 * Math.PI;
    const end = angle;
    const [x1, y1] = polar(c, c, r, start);
    const [x2, y2] = polar(c, c, r, end);
    const large = end - start > Math.PI ? 1 : 0;
    const mid = (start + end) / 2;
    const [lx, ly] = polar(c, c, r * 0.64, mid);
    return {
      i,
      d: `M${c},${c} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`,
      lx,
      ly,
      showLabel: end - start > 0.5,
    };
  });
  return (
    <div className="pie">
      <svg viewBox={`0 0 ${size} ${size}`} className="pie-svg" aria-hidden="true">
        {slices.map((s) => (
          <path key={s.i} d={s.d} fill={seriesColor(s.i)} stroke="var(--paper)" strokeWidth="2" strokeLinejoin="round" />
        ))}
        {slices.map(
          (s) =>
            s.showLabel && (
              <text key={s.i} x={s.lx} y={s.ly} className="pie-label" style={{ fill: `var(--series-${(s.i % 6) + 1}-on)` }}>
                {format(values[s.i], chart.unit)}
              </text>
            ),
        )}
      </svg>
      <ul className="pie-key">
        {chart.labels.map((label, i) => (
          <li key={label}>
            <span className="chart-swatch" style={{ background: seriesColor(i) }} />
            <span>{label}</span>
            <b>{format(values[i], chart.unit)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function niceTicks(lo, hi) {
  const span = hi - lo || 1;
  const rough = span / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough);
  const start = Math.floor(lo / step) * step;
  const ticks = [];
  for (let t = start; t <= hi + step * 0.001; t += step) ticks.push(Number(t.toFixed(6)));
  if (ticks[ticks.length - 1] < hi) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

function Lines({ chart }) {
  const [ref, width] = useWidth();
  const all = chart.series.flatMap((s) => s.values);
  const ticks = niceTicks(Math.min(0, ...all), Math.max(...all));
  const top = ticks[ticks.length - 1];
  const bottom = ticks[0];
  const height = 200;
  const pad = { left: 44, right: 14, top: 10, bottom: 26 };
  const w = Math.max(width, 240);
  const x = (i) => pad.left + (chart.labels.length === 1 ? 0 : (i * (w - pad.left - pad.right)) / (chart.labels.length - 1));
  const y = (v) => pad.top + ((top - v) / (top - bottom)) * (height - pad.top - pad.bottom);
  return (
    <div ref={ref}>
      <Legend names={chart.series.map((s) => s.name)} />
      <svg width={w} height={height} className="line-svg" aria-hidden="true">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} className={t === bottom ? 'chart-axis' : 'chart-grid'} />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-tick">
              {t.toLocaleString('en-IN')}
            </text>
          </g>
        ))}
        {chart.labels.map((label, i) => (
          <text key={label} x={x(i)} y={height - 8} textAnchor="middle" className="chart-tick">
            {label}
          </text>
        ))}
        {chart.series.map((s, si) => (
          <g key={s.name}>
            <polyline
              points={s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={seriesColor(si)}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="4" fill={seriesColor(si)} stroke="var(--paper)" strokeWidth="2" />
            ))}
          </g>
        ))}
      </svg>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">{chart.series.length > 1 ? 'Series' : ''}</th>
              {chart.labels.map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.series.map((s) => (
              <tr key={s.name}>
                <th scope="row">{s.name}</th>
                {s.values.map((v, i) => (
                  <td key={i}>{format(v, chart.unit)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Chart({ chart }) {
  const description = `${chart.title ?? 'Chart'}: ${chart.series
    .map((s) => `${s.name}: ${chart.labels.map((l, i) => `${l} ${format(s.values[i], chart.unit)}`).join(', ')}`)
    .join('; ')}`;
  const showUnit = chart.unit && chart.unit !== '%' && !chart.title?.toLowerCase().includes(chart.unit.toLowerCase());
  return (
    <figure className="chart" aria-label={description}>
      {chart.title && (
        <figcaption className="chart-title">
          {chart.title}
          {showUnit ? ` (${chart.unit})` : ''}
        </figcaption>
      )}
      {chart.type === 'bar' && <Bars chart={chart} />}
      {chart.type === 'pie' && <Pie chart={chart} />}
      {chart.type === 'line' && <Lines chart={chart} />}
    </figure>
  );
}
