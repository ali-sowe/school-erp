import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CalendarClock, CalendarDays, Plus } from 'lucide-react';

import { useMyLeaveRequests, useLeaveRequests } from '@/hooks/leave-requests/useLeaveRequests';
import { useUsers } from '@/hooks/admin/useUsers';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import LeaveRequestForm from '@/components/leave-requests/LeaveRequestForm';

const STATUS_FILTER_VALUES = {
  pending: 'PENDING_REVIEW',
  approved: 'APPROVED',
  executed: 'EXECUTED',
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
};

function formatDateRange(row) {
  return `${row.start_date?.slice(0, 10)} → ${row.end_date?.slice(0, 10)}`;
}

function LeaveRequestsPage() {
  const { t } = useTranslation('leave-requests');

  const { data: myRequests, isLoading: myRequestsLoading } = useMyLeaveRequests();

  const [statusFilter, setStatusFilter] = useState('all');
  const { data: allRequests, isLoading: allLoading } = useLeaveRequests(
    statusFilter === 'all' ? {} : { status: STATUS_FILTER_VALUES[statusFilter] }
  );

  const { data: users } = useUsers();
  const nameById = useMemo(
    () => new Map((users ?? []).map((user) => [user.id, `${user.first_name} ${user.last_name}`])),
    [users]
  );

  const [formOpen, setFormOpen] = useState(false);

  const titleColumn = {
    accessorKey: 'leave_type',
    header: t('myRequests.columns.leaveType'),
    cell: ({ row }) => (
      <Link to={`/leave-requests/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.leave_type}
      </Link>
    ),
  };

  const myRequestsColumns = useMemo(
    () => [
      titleColumn,
      { id: 'dates', header: t('myRequests.columns.dates'), cell: ({ row }) => formatDateRange(row.original) },
      { accessorKey: 'status', header: t('myRequests.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    ],
    [t]
  );

  const allColumns = useMemo(
    () => [
      titleColumn,
      {
        accessorKey: 'user_id',
        header: t('all.columns.requestedBy'),
        cell: ({ row }) => nameById.get(row.original.user_id) || '—',
      },
      { id: 'dates', header: t('all.columns.dates'), cell: ({ row }) => formatDateRange(row.original) },
      { accessorKey: 'status', header: t('all.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    ],
    [t, nameById]
  );

  return (
    <div className="space-y-space-6">
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('page.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('myRequests.addButton')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            {t('myRequests.sectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={myRequestsColumns}
            data={myRequests}
            isLoading={myRequestsLoading}
            emptyState={<EmptyState icon={CalendarClock} title={t('myRequests.empty.title')} description={t('myRequests.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            {t('all.sectionTitle')}
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all.statusFilter.all')}</SelectItem>
              <SelectItem value="pending">{t('all.statusFilter.pending')}</SelectItem>
              <SelectItem value="approved">{t('all.statusFilter.approved')}</SelectItem>
              <SelectItem value="executed">{t('all.statusFilter.executed')}</SelectItem>
              <SelectItem value="rejected">{t('all.statusFilter.rejected')}</SelectItem>
              <SelectItem value="cancelled">{t('all.statusFilter.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={allColumns}
            data={allRequests}
            isLoading={allLoading}
            emptyState={<EmptyState icon={CalendarDays} title={t('all.empty.title')} description={t('all.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('form.createTitle')}</DialogTitle>
          </DialogHeader>
          <LeaveRequestForm onSaved={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LeaveRequestsPage;
