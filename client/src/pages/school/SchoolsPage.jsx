import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, Plus } from 'lucide-react';

import { useSchools } from '@/hooks/school/useSchools';
import { useSuspendSchool, useReactivateSchool } from '@/hooks/school/useSchoolMutations';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import SchoolForm from '@/components/school/SchoolForm';

function SchoolsPage() {
  const { t } = useTranslation('school');

  const { data: schools, isLoading } = useSchools();
  const suspendSchool = useSuspendSchool();
  const reactivateSchool = useReactivateSchool();

  const [formOpen, setFormOpen] = useState(false);
  const [activeSchool, setActiveSchool] = useState(null);

  const handleSuspendToggle = async (school) => {
    try {
      if (school.status === 'SUSPENDED') {
        await reactivateSchool.mutateAsync(school.id);
        toast.success(t('toasts.reactivated'));
      } else {
        await suspendSchool.mutateAsync(school.id);
        toast.success(t('toasts.suspended'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('toasts.error'));
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: t('table.name') },
      { accessorKey: 'region', header: t('table.region'), cell: ({ row }) => row.original.region || '—' },
      {
        accessorKey: 'education_levels',
        header: t('table.educationLevels'),
        cell: ({ row }) => (row.original.education_levels ?? []).map((level) => t(`educationLevels.${level}`)).join(', ') || '—',
      },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: t('table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-space-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveSchool(row.original);
                setFormOpen(true);
              }}
            >
              {t('common:actions.edit', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSuspendToggle(row.original)}>
              {row.original.status === 'SUSPENDED' ? t('table.reactivateButton') : t('table.suspendButton')}
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-space-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setActiveSchool(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t('addButton')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={schools}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Building2} title={t('empty.title')} description={t('empty.description')} />}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeSchool ? t('form.editTitle') : t('form.createTitle')}</DialogTitle>
          </DialogHeader>
          <SchoolForm school={activeSchool} onSaved={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SchoolsPage;
