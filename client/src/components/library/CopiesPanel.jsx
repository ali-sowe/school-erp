import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Layers, Plus } from 'lucide-react';

import { useBookCopies, useWithdrawCopy, useRestoreCopy } from '@/hooks/library/useBookCopies';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import AddCopiesForm from '@/components/library/AddCopiesForm';

function CopiesPanel({ bookId, canWrite }) {
  const { t } = useTranslation('library');

  const { data: copies, isLoading } = useBookCopies(bookId);
  const withdrawCopy = useWithdrawCopy(bookId);
  const restoreCopy = useRestoreCopy(bookId);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null); // copy id
  const [withdrawReason, setWithdrawReason] = useState('');

  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) return;
    try {
      await withdrawCopy.mutateAsync({ copyId: withdrawTarget, reason: withdrawReason });
      toast.success(t('copies.toasts.withdrawn'));
      setWithdrawTarget(null);
      setWithdrawReason('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('copies.toasts.error'));
    }
  };

  const handleRestore = async (copyId) => {
    try {
      await restoreCopy.mutateAsync(copyId);
      toast.success(t('copies.toasts.restored'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('copies.toasts.error'));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4" />
          {t('copies.sectionTitle')}
        </CardTitle>
        {canWrite && (
          <Button size="sm" onClick={() => setAddFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('copies.addButton')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!isLoading && (!copies || copies.length === 0) && <EmptyState title={t('copies.empty')} />}

        {copies && copies.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('copies.columns.copyNumber')}</TableHead>
                  <TableHead>{t('copies.columns.status')}</TableHead>
                  {canWrite && <TableHead>{t('copies.columns.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {copies.map((copy) => (
                  <TableRow key={copy.id}>
                    <TableCell>{copy.copy_number || t('copies.unnumbered')}</TableCell>
                    <TableCell>
                      <StatusBadge status={copy.status} />
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        {copy.status === 'WITHDRAWN' ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(copy.id)}>
                            {t('copies.restoreButton')}
                          </Button>
                        ) : copy.status !== 'BORROWED' ? (
                          <Button variant="destructive" size="sm" onClick={() => setWithdrawTarget(copy.id)}>
                            {t('copies.withdrawButton')}
                          </Button>
                        ) : null}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={addFormOpen} onOpenChange={setAddFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('copies.form.title')}</DialogTitle>
          </DialogHeader>
          <AddCopiesForm bookId={bookId} onSaved={() => setAddFormOpen(false)} onCancel={() => setAddFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* A plain dialog rather than ConfirmDialog — withdrawing requires a
          reason, which ConfirmDialog's fixed title/description shape has no
          room for. */}
      <Dialog open={Boolean(withdrawTarget)} onOpenChange={(open) => !open && setWithdrawTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('copies.confirmWithdraw.title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('copies.confirmWithdraw.description')}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('copies.withdrawForm.reasonLabel')}</p>
            <Input value={withdrawReason} onChange={(event) => setWithdrawReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawTarget(null)}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button variant="destructive" onClick={handleWithdraw} disabled={!withdrawReason.trim() || withdrawCopy.isPending}>
              {t('copies.withdrawForm.submitButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CopiesPanel;
