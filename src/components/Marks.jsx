import { STATUS } from '../lib/exam.js';

export const STATUS_LABELS = {
  [STATUS.NOT_VISITED]: 'Not Visited',
  [STATUS.NOT_ANSWERED]: 'Not Answered',
  [STATUS.ANSWERED]: 'Answered',
  [STATUS.MARKED]: 'Marked for Review',
  [STATUS.ANSWERED_MARKED]: 'Answered and Marked for Review',
};

/** A palette shape. Shapes copy the real console and differ by more than colour. */
export function StatusMark({ status, children }) {
  return <span className={`st st-${status}`}>{children}</span>;
}

export function StatusLegend({ counts }) {
  return (
    <ul className="legend">
      {Object.values(STATUS).map((status) => (
        <li key={status}>
          <StatusMark status={status}>{counts ? counts[status] : ''}</StatusMark>
          <span>{STATUS_LABELS[status]}</span>
        </li>
      ))}
    </ul>
  );
}
