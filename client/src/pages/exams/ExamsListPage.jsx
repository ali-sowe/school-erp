import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Plus, FileSpreadsheet } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useExams } from '@/hooks/exams/useExams';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClassSelector } from '@/components/erp/ClassSelector';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import ExamForm from '@/components/exams/ExamForm';

function ExamsListPage() {
  const { t } = useTranslation('exams');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('exams.write');

  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
  const { data: exams, isLoading } = useExams({ class_id: classId || undefined, status: status || undefined });

  const [formOpen, setFormOpen] = useState(false);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('list.columns.name'),
        cell: ({ row }) => (
          <Link to={`/exams/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: 'exam_type', header: t('list.columns.type') },
      {
        id: 'dates',
        header: t('list.columns.dates'),
        cell: ({ row }) => `${row.original.planned_start_date?.slice(0, 10)} → ${row.original.planned_end_date?.slice(0, 10)}`,
      },
      { accessorKey: 'status', header: t('list.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    ],
    [t]
  );

  return (
    <div className="space-y-space-6">
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('list.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('list.actions.addExam')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-space-3">
        <div className="w-56 space-y-1">
          <p className="text-sm font-medium">{t('list.filters.classLabel')}</p>
          <ClassSelector value={classId} onChange={setClassId} params={{ status: 'ACTIVE' }} />
        </div>
        <div className="w-48 space-y-1">
          <p className="text-sm font-medium">{t('list.filters.statusLabel')}</p>
          <Select value={status || 'ALL'} onValueChange={(value) => setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('list.filters.allStatuses')}</SelectItem>
              <SelectItem value="SCHEDULED">{t('list.statuses.SCHEDULED')}</SelectItem>
              <SelectItem value="ONGOING">{t('list.statuses.ONGOING')}</SelectItem>
              <SelectItem value="COMPLETED">{t('list.statuses.COMPLETED')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={exams}
        isLoading={isLoading}
        emptyState={<EmptyState icon={FileSpreadsheet} title={t('list.empty.title')} description={t('list.empty.description')} />}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('form.createTitle')}</DialogTitle>
          </DialogHeader>
          <ExamForm onSaved={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExamsListPage;
