import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, UploadCloud } from 'lucide-react';

import { useImportBatches, useImportTargetTypes } from '@/hooks/data-import/useImportBatches';
import { useCreateImportBatch } from '@/hooks/data-import/useImportBatchMutations';
import { useUploadDocument } from '@/hooks/documents/useDocumentMutations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';

function NewImportDialog({ open, onOpenChange }) {
  const { t } = useTranslation('data-import');
  const navigate = useNavigate();
  const { data: targetTypes } = useImportTargetTypes();
  const uploadDocument = useUploadDocument();
  const createBatch = useCreateImportBatch();

  const [file, setFile] = useState(null);
  const [targetType, setTargetType] = useState('');
  const [errors, setErrors] = useState({});

  const submitting = uploadDocument.isPending || createBatch.isPending;

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFile(null);
      setTargetType('');
      setErrors({});
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!file) nextErrors.file = t('newDialog.errors.fileRequired');
    if (!targetType) nextErrors.targetType = t('newDialog.errors.targetTypeRequired');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      // Title is required by the underlying document upload but doesn't
      // matter much for a data file — the filename itself is descriptive
      // enough, so it's derived rather than asked for separately.
      const document = await uploadDocument.mutateAsync({
        file,
        title: file.name,
        category: 'DATA_IMPORT',
      });

      const batch = await createBatch.mutateAsync({ documentId: document.id, targetType });
      toast.success(t('newDialog.toastSuccess'));
      handleClose(false);
      navigate(`/data-imports/${batch.id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('newDialog.toastError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('newDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-space-4">
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('newDialog.targetTypeLabel')}</label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger>
                <SelectValue placeholder={t('newDialog.targetTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {(targetTypes ?? []).map((type) => (
                  <SelectItem key={type.target_type} value={type.target_type}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.targetType && <p className="text-sm text-destructive">{errors.targetType}</p>}
            {targetType && (
              <p className="text-xs text-muted-foreground">
                {t('newDialog.expectedColumns')}:{' '}
                {(targetTypes ?? []).find((type) => type.target_type === targetType)?.expected_columns?.join(', ')}
              </p>
            )}
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('newDialog.fileLabel')}</label>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common:states.loading', { ns: 'common' }) : t('newDialog.submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportBatchesPage() {
  const { t } = useTranslation('data-import');
  const navigate = useNavigate();
  const { data: batches, isLoading } = useImportBatches();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = useMemo(
    () => [
      { accessorKey: 'target_type', header: t('table.targetType') },
      { accessorKey: 'total_rows', header: t('table.totalRows') },
      { accessorKey: 'valid_rows', header: t('table.validRows') },
      { accessorKey: 'invalid_rows', header: t('table.invalidRows') },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: t('table.actions'),
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => navigate(`/data-imports/${row.original.id}`)}>
            {t('table.viewButton')}
          </Button>
        ),
      },
    ],
    [t, navigate]
  );

  return (
    <div className="space-y-space-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('newButton')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        isLoading={isLoading}
        emptyState={<EmptyState icon={UploadCloud} title={t('empty.title')} description={t('empty.description')} />}
      />

      <NewImportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

export default ImportBatchesPage;
