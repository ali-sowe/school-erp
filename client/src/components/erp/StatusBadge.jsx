import { Badge } from '@/components/ui/badge';

// Central place mapping the ERP's various status strings to a semantic
// badge variant + human label, per ADR-010 ("status badges... should be
// readable by color alone") and the UI Patterns doc's component list.
// Deliberately covers the status values shared across many modules
// (approval lifecycle, active/archived, scheduled/ongoing/completed,
// payment states) rather than one bespoke badge per module — anything not
// listed here still renders sensibly via the fallback below.
const STATUS_MAP = {
  // Approval Workflow Engine (request-level statuses above; PENDING and
  // SKIPPED are step-level — a step waiting its turn, or one that never
  // ran because the request was rejected/cancelled before reaching it)
  PENDING_REVIEW: { label: 'Pending review', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  EXECUTED: { label: 'Executed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
  PENDING: { label: 'Pending', variant: 'warning' },
  SKIPPED: { label: 'Skipped', variant: 'secondary' },

  // Archive/restore lifecycle (fee structures, subjects, classes, etc.)
  ACTIVE: { label: 'Active', variant: 'success' },
  ARCHIVED: { label: 'Archived', variant: 'secondary' },

  // Academic Years / Terms / Exams
  SCHEDULED: { label: 'Scheduled', variant: 'secondary' },
  ONGOING: { label: 'Ongoing', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },

  // Finance
  UNPAID: { label: 'Unpaid', variant: 'destructive' },
  PARTIALLY_PAID: { label: 'Partially paid', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  VOIDED: { label: 'Voided', variant: 'secondary' },
  RECORDED: { label: 'Recorded', variant: 'success' },

  // Attendance
  PRESENT: { label: 'Present', variant: 'success' },
  ABSENT: { label: 'Absent', variant: 'destructive' },
  LATE: { label: 'Late', variant: 'warning' },
  EXCUSED: { label: 'Excused', variant: 'secondary' },

  // Library (copies + borrow records)
  AVAILABLE: { label: 'Available', variant: 'success' },
  BORROWED: { label: 'Borrowed', variant: 'warning' },
  RETURNED: { label: 'Returned', variant: 'success' },
  DAMAGED: { label: 'Damaged', variant: 'destructive' },
  LOST: { label: 'Lost', variant: 'destructive' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'secondary' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
};

function humanize(status) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function StatusBadge({ status, className }) {
  if (!status) return null;

  const entry = STATUS_MAP[status] || { label: humanize(status), variant: 'outline' };

  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}

export { StatusBadge };
