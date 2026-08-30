import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, ClipboardList } from 'lucide-react';

import { useMyPendingApprovals } from '@/hooks/useMyPendingApprovals';
import { useApprovalRequests } from '@/hooks/approvals/useApprovalRequests';
import { useUsers } from '@/hooks/admin/useUsers';
import { getWorkflowTypeLabel } from '@/lib/workflowTypeLabels';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';

const STATUS_FILTER_VALUES = {
  pending: 'PENDING_REVIEW',
  approved: 'APPROVED',
  executed: 'EXECUTED',
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
};

function ApprovalsPage() {
  const { t } = useTranslation('approvals');

  const { data: myPending, isLoading: myPendingLoading } = useMyPendingApprovals();

  const [statusFilter, setStatusFilter] = useState('all');
  const { data: allRequests, isLoading: allLoading } = useApprovalRequests(
    statusFilter === 'all' ? {} : { status: STATUS_FILTER_VALUES[statusFilter] }
  );

  const { data: users } = useUsers();
  const nameById = useMemo(
    () => new Map((users ?? []).map((user) => [user.id, `${user.first_name} ${user.last_name}`])),
    [users]
  );

  const myPendingColumns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: t('all.columns.title'),
        cell: ({ row }) => (
          <Link to={`/approvals/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      { accessorKey: 'workflow_type', header: t('all.columns.workflowType'), cell: ({ row }) => getWorkflowTypeLabel(row.original.workflow_type) },
      { accessorKey: 'step_number', header: t('myPending.columns.yourStep'), cell: ({ row }) => row.original.step_number },
    ],
    [t]
  );

  const allColumns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: t('all.columns.title'),
        cell: ({ row }) => (
          <Link to={`/approvals/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      { accessorKey: 'workflow_type', header: t('all.columns.workflowType'), cell: ({ row }) => getWorkflowTypeLabel(row.original.workflow_type) },
      { accessorKey: 'status', header: t('all.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        accessorKey: 'requested_by',
        header: t('all.columns.requestedBy'),
        cell: ({ row }) => nameById.get(row.original.requested_by) || '—',
      },
      {
        accessorKey: 'created_at',
        header: t('all.columns.requestedAt'),
        cell: ({ row }) => row.original.created_at?.slice(0, 10),
      },
    ],
    [t, nameById]
  );

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4" />
            {t('myPending.sectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={myPendingColumns}
            data={myPending}
            isLoading={myPendingLoading}
            emptyState={<EmptyState icon={ClipboardCheck} title={t('myPending.empty')} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" />
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
            emptyState={<EmptyState icon={ClipboardList} title={t('all.empty.title')} description={t('all.empty.description')} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ApprovalsPage;
