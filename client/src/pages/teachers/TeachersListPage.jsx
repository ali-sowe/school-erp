import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, Plus, Presentation } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useTeachers } from '@/hooks/teachers/useTeachers';
import { useArchiveTeacher, useRestoreTeacher } from '@/hooks/teachers/useTeacherMutations';
import { downloadFile } from '@/lib/downloadFile';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import TeacherForm from '@/components/teachers/TeacherForm';

function TeachersListPage() {
  const { t } = useTranslation('teachers');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('teachers.write');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const { data: teachers, isLoading } = useTeachers({ search: search || undefined, status: status === 'ALL' ? undefined : status });

  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, action: 'archive' | 'restore' }

  const archiveTeacher = useArchiveTeacher();
  const restoreTeacher = useRestoreTeacher();

  const handleExport = async () => {
    try {
      await downloadFile('/reports/teachers/download', { params: { format: 'xlsx' }, fallbackFilename: 'teachers.xlsx' });
    } catch {
      toast.error(t('list.toasts.error'));
    }
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      if (confirmTarget.action === 'archive') {
        await archiveTeacher.mutateAsync(confirmTarget.id);
        toast.success(t('list.toasts.archived'));
      } else {
        await restoreTeacher.mutateAsync(confirmTarget.id);
        toast.success(t('list.toasts.restored'));
      }
    } catch {
      toast.error(t('list.toasts.error'));
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'last_name',
        header: t('list.columns.name'),
        cell: ({ row }) => (
          <Link to={`/teachers/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.first_name} {row.original.last_name}
          </Link>
        ),
      },
      { accessorKey: 'employee_number', header: t('list.columns.employeeNumber') },
      {
        accessorKey: 'specialization',
        header: t('list.columns.specialization'),
        cell: ({ row }) => row.original.specialization || '—',
      },
      { accessorKey: 'status', header: t('list.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: t('list.columns.actions'),
              cell: ({ row }) => {
                const teacher = row.original;
                return teacher.status === 'ARCHIVED' ? (
                  <Button variant="outline" size="sm" onClick={() => setConfirmTarget({ id: teacher.id, action: 'restore' })}>
                    {t('list.row.restore')}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setConfirmTarget({ id: teacher.id, action: 'archive' })}>
                    {t('list.row.archive')}
                  </Button>
                );
              },
            },
          ]
        : []),
    ],
    [canWrite, t]
  );

  return (
    <div className="space-y-space-6">
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('list.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        <div className="flex gap-space-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t('list.actions.export')}
          </Button>
          {canWrite && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('list.actions.addTeacher')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-space-3">
        <Input
          placeholder={t('list.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">{t('list.statusFilter.active')}</SelectItem>
            <SelectItem value="ARCHIVED">{t('list.statusFilter.archived')}</SelectItem>
            <SelectItem value="ALL">{t('list.statusFilter.all')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Presentation} title={t('list.empty.title')} description={t('list.empty.description')} />}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('form.createTitle')}</DialogTitle>
          </DialogHeader>
          <TeacherForm onSaved={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={confirmTarget?.action === 'archive' ? t('list.confirmArchive.title') : t('list.confirmRestore.title')}
        description={confirmTarget?.action === 'archive' ? t('list.confirmArchive.description') : t('list.confirmRestore.description')}
        confirmLabel={confirmTarget?.action === 'archive' ? t('list.row.archive') : t('list.row.restore')}
        destructive={confirmTarget?.action === 'archive'}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export default TeachersListPage;
