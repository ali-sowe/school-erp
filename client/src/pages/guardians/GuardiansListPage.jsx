import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, UserRound } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useGuardians } from '@/hooks/guardians/useGuardians';
import { useArchiveGuardian, useRestoreGuardian } from '@/hooks/guardians/useGuardianMutations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import GuardianForm from '@/components/guardians/GuardianForm';

function GuardiansListPage() {
  const { t } = useTranslation('guardians');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('guardians.write');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const { data: guardians, isLoading } = useGuardians({ search: search || undefined, status: status === 'ALL' ? undefined : status });

  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, action: 'archive' | 'restore' }

  const archiveGuardian = useArchiveGuardian();
  const restoreGuardian = useRestoreGuardian();

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      if (confirmTarget.action === 'archive') {
        await archiveGuardian.mutateAsync(confirmTarget.id);
        toast.success(t('list.toasts.archived'));
      } else {
        await restoreGuardian.mutateAsync(confirmTarget.id);
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
          <Link to={`/guardians/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.first_name} {row.original.last_name}
          </Link>
        ),
      },
      {
        id: 'contact',
        header: t('list.columns.contact'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.phone || t('list.noPhone')} · {row.original.email || t('list.noEmail')}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('list.columns.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: t('list.columns.actions'),
              cell: ({ row }) => {
                const guardian = row.original;
                return guardian.status === 'ARCHIVED' ? (
                  <Button variant="outline" size="sm" onClick={() => setConfirmTarget({ id: guardian.id, action: 'restore' })}>
                    {t('list.row.restore')}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setConfirmTarget({ id: guardian.id, action: 'archive' })}>
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
        {canWrite && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('list.actions.addGuardian')}
          </Button>
        )}
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
        data={guardians}
        isLoading={isLoading}
        emptyState={<EmptyState icon={UserRound} title={t('list.empty.title')} description={t('list.empty.description')} />}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('form.createTitle')}</DialogTitle>
          </DialogHeader>
          <GuardianForm onSaved={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
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

export default GuardiansListPage;
