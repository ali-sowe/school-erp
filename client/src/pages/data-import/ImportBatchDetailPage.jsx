import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { useImportBatch, useImportBatchRows } from '@/hooks/data-import/useImportBatches';
import { useConfirmImportBatch, useCancelImportBatch } from '@/hooks/data-import/useImportBatchMutations';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';

// Rows only ever have PENDING_VALIDATION-family batches confirmable — the
// backend itself is the source of truth for exactly which statuses allow
// which action (see import-batch.service.js's own guards); this is just a
// UI-level shortcut to avoid showing buttons that would immediately 400.
const CONFIRMABLE_STATUSES = ['PENDING_VALIDATION', 'VALIDATED'];
const CANCELLABLE_STATUSES = ['PENDING_VALIDATION', 'VALIDATED'];

function ImportBatchDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('data-import');

  const { data: batch, isLoading, isError } = useImportBatch(id);
  const { data: rows, isLoading: rowsLoading } = useImportBatchRows(id);
  const confirmBatch = useConfirmImportBatch(id);
  const cancelBatch = useCancelImportBatch(id);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/data-imports" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  const canConfirm = CONFIRMABLE_STATUSES.includes(batch.status) && batch.valid_rows > 0;
  const canCancel = CANCELLABLE_STATUSES.includes(batch.status);

  const handleConfirm = async () => {
    try {
      await confirmBatch.mutateAsync();
      toast.success(t('detail.toasts.confirmed'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
      throw error;
    }
  };

  const handleCancel = async () => {
    try {
      await cancelBatch.mutateAsync();
      toast.success(t('detail.toasts.cancelled'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
      throw error;
    }
  };

  return (
    <div className="space-y-space-6">
      <Link to="/data-imports" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">{batch.target_type}</CardTitle>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={batch.status} />
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                {t('detail.cancelButton')}
              </Button>
            )}
            {canConfirm && <Button onClick={() => setConfirmDialogOpen(true)}>{t('detail.confirmButton')}</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-space-4 sm:grid-cols-5">
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.totalRows')}</dt>
              <dd className="font-medium">{batch.total_rows}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.validRows')}</dt>
              <dd className="font-medium">{batch.valid_rows}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.invalidRows')}</dt>
              <dd className="font-medium">{batch.invalid_rows}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.importedRows')}</dt>
              <dd className="font-medium">{batch.imported_rows}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.failedRows')}</dt>
              <dd className="font-medium">{batch.failed_rows}</dd>
            </div>
          </dl>
          {batch.validation_error && (
            <Alert variant="destructive" className="mt-space-4">
              <AlertDescription>{batch.validation_error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('detail.rowsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {rowsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('detail.rowsTable.rowNumber')}</TableHead>
                    <TableHead>{t('detail.rowsTable.status')}</TableHead>
                    <TableHead>{t('detail.rowsTable.errors')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rows ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.row_number}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-sm text-destructive">
                        {Array.isArray(row.errors) ? row.errors.join('; ') : row.errors || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={t('detail.confirmDialog.title')}
        description={t('detail.confirmDialog.description', { count: batch.valid_rows })}
        confirmLabel={t('detail.confirmButton')}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title={t('detail.cancelDialog.title')}
        description={t('detail.cancelDialog.description')}
        confirmLabel={t('detail.cancelButton')}
        onConfirm={handleCancel}
      />
    </div>
  );
}

export default ImportBatchDetailPage;
