import type { EmployeeStatus } from '../types';
import { STATUS_LABELS } from '../utils/format';

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABELS[status]}</span>;
}
