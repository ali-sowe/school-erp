import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useInvoice } from '@/hooks/finance/useInvoices';
import { useVoidInvoice, useRequestInvoiceVoid } from '@/hooks/finance/useInvoiceMutations';
import { usePaymentsForInvoice, useRecordPayment, useVoidPayment, useRequestPaymentVoid } from '@/hooks/finance/usePayments';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { EmptyState } from '@/components/erp/EmptyState';

function formatAmount(amount) {
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// A reason-required action (void, void-request) shares this exact shape —
// plain Dialog + Textarea + inline required-field error, same pattern as
// ExamDetailPage's reopen dialog, rather than ConfirmDialog (which is
// yes/no only, no input).
function ReasonDialog({ open, onOpenChange, title, description, confirmLabel, pending, onConfirm }) {
  const { t } = useTranslation('finance');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setReason('');
      setError('');
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError(t('invoices.detail.voidDialog.reasonRequired'));
      return;
    }
    await onConfirm(reason.trim());
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t('invoices.detail.voidDialog.reasonPlaceholder')} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={pending}>
            {pending ? t('common:states.loading', { ns: 'common' }) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentDialog({ open, onOpenChange, invoiceId, remainingBalance }) {
  const { t } = useTranslation('finance');
  const recordPayment = useRecordPayment(invoiceId);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState({});

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setMethod('');
      setDate('');
      setReference('');
      setErrors({});
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!amount) nextErrors.amount = t('invoices.detail.recordPaymentDialog.errors.amountRequired');
    if (!method.trim()) nextErrors.method = t('invoices.detail.recordPaymentDialog.errors.methodRequired');
    if (!date) nextErrors.date = t('invoices.detail.recordPaymentDialog.errors.dateRequired');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await recordPayment.mutateAsync({
        amount: Number(amount),
        payment_method: method.trim(),
        payment_date: date,
        reference_number: reference || undefined,
      });
      toast.success(t('invoices.detail.toasts.paymentRecorded'));
      handleClose(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('invoices.detail.toasts.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('invoices.detail.recordPaymentDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-space-4">
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('invoices.detail.recordPaymentDialog.amountLabel')}</label>
            <Input
              type="number"
              min="0.01"
              max={remainingBalance || undefined}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('invoices.detail.recordPaymentDialog.methodLabel')}</label>
            <Input
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              placeholder={t('invoices.detail.recordPaymentDialog.methodPlaceholder')}
            />
            {errors.method && <p className="text-sm text-destructive">{errors.method}</p>}
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('invoices.detail.recordPaymentDialog.dateLabel')}</label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('invoices.detail.recordPaymentDialog.referenceLabel')}</label>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder={t('invoices.detail.recordPaymentDialog.referencePlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? t('common:states.loading', { ns: 'common' }) : t('invoices.detail.actions.recordPayment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('finance');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('finance.write');

  const { data: invoice, isLoading, isError } = useInvoice(id);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsForInvoice(id);

  const voidInvoice = useVoidInvoice(id);
  const requestInvoiceVoid = useRequestInvoiceVoid(id);
  const voidPayment = useVoidPayment(id);
  const requestPaymentVoid = useRequestPaymentVoid(id);

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [voidInvoiceDialog, setVoidInvoiceDialog] = useState(null); // 'direct' | 'request' | null
  const [voidPaymentDialog, setVoidPaymentDialog] = useState(null); // { paymentId, mode } | null

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('invoices.detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/finance" className="text-sm text-primary hover:underline">
          ← {t('invoices.detail.backLink')}
        </Link>
      </div>
    );
  }

  const remainingBalance = Number(invoice.amount_due) - Number(invoice.amount_paid);
  const isVoided = invoice.status === 'VOIDED';
  const hasPayments = Number(invoice.amount_paid) > 0;

  return (
    <div className="space-y-space-6">
      <Link to="/finance" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('invoices.detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">{invoice.description}</CardTitle>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={invoice.status} />
            {canWrite && !isVoided && !hasPayments && (
              <Button variant="outline" onClick={() => setVoidInvoiceDialog('direct')}>
                {t('invoices.detail.actions.void')}
              </Button>
            )}
            {canWrite && !isVoided && hasPayments && (
              <Button variant="outline" onClick={() => setVoidInvoiceDialog('request')}>
                {t('invoices.detail.actions.requestVoid')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-space-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">{t('invoices.detail.amountDueLabel')}</dt>
              <dd className="font-medium">{formatAmount(invoice.amount_due)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('invoices.detail.amountPaidLabel')}</dt>
              <dd className="font-medium">{formatAmount(invoice.amount_paid)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('invoices.detail.balanceLabel')}</dt>
              <dd className="font-medium">{formatAmount(remainingBalance)}</dd>
            </div>
            {invoice.due_date && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('invoices.detail.dueDateLabel')}</dt>
                <dd className="font-medium">{invoice.due_date.slice(0, 10)}</dd>
              </div>
            )}
            {invoice.reason && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('invoices.detail.voidedReasonLabel')}</dt>
                <dd className="font-medium">{invoice.reason}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('invoices.detail.paymentsTitle')}</CardTitle>
          {canWrite && !isVoided && remainingBalance > 0 && (
            <Button size="sm" onClick={() => setRecordPaymentOpen(true)}>
              {t('invoices.detail.actions.recordPayment')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !payments || payments.length === 0 ? (
            <EmptyState title={t('invoices.detail.paymentsEmpty')} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.detail.paymentsTable.date')}</TableHead>
                    <TableHead>{t('invoices.detail.paymentsTable.amount')}</TableHead>
                    <TableHead>{t('invoices.detail.paymentsTable.method')}</TableHead>
                    <TableHead>{t('invoices.detail.paymentsTable.reference')}</TableHead>
                    <TableHead>{t('invoices.detail.paymentsTable.status')}</TableHead>
                    <TableHead>{t('invoices.detail.paymentsTable.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.payment_date?.slice(0, 10)}</TableCell>
                      <TableCell>{formatAmount(payment.amount)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>{payment.reference_number || '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>
                        {canWrite && payment.status !== 'VOIDED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setVoidPaymentDialog({ paymentId: payment.id, mode: 'direct' })}
                          >
                            {t('common:actions.delete', { ns: 'common' })}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        invoiceId={id}
        remainingBalance={remainingBalance}
      />

      <ReasonDialog
        open={voidInvoiceDialog !== null}
        onOpenChange={(open) => !open && setVoidInvoiceDialog(null)}
        title={voidInvoiceDialog === 'request' ? t('invoices.detail.voidDialog.titleRequest') : t('invoices.detail.voidDialog.title')}
        description={
          voidInvoiceDialog === 'request'
            ? t('invoices.detail.voidDialog.descriptionRequest')
            : t('invoices.detail.voidDialog.description')
        }
        confirmLabel={
          voidInvoiceDialog === 'request'
            ? t('invoices.detail.voidDialog.confirmButtonRequest')
            : t('invoices.detail.voidDialog.confirmButton')
        }
        pending={voidInvoice.isPending || requestInvoiceVoid.isPending}
        onConfirm={async (reason) => {
          try {
            if (voidInvoiceDialog === 'request') {
              await requestInvoiceVoid.mutateAsync(reason);
              toast.success(t('invoices.detail.toasts.invoiceVoidRequested'));
            } else {
              await voidInvoice.mutateAsync(reason);
              toast.success(t('invoices.detail.toasts.invoiceVoided'));
            }
          } catch (error) {
            toast.error(error?.response?.data?.message || t('invoices.detail.toasts.error'));
          }
        }}
      />

      <ReasonDialog
        open={voidPaymentDialog !== null}
        onOpenChange={(open) => !open && setVoidPaymentDialog(null)}
        title={
          voidPaymentDialog?.mode === 'request'
            ? t('invoices.detail.voidPaymentDialog.titleRequest')
            : t('invoices.detail.voidPaymentDialog.title')
        }
        description=""
        confirmLabel={
          voidPaymentDialog?.mode === 'request'
            ? t('invoices.detail.voidPaymentDialog.confirmButtonRequest')
            : t('invoices.detail.voidPaymentDialog.confirmButton')
        }
        pending={voidPayment.isPending || requestPaymentVoid.isPending}
        onConfirm={async (reason) => {
          try {
            if (voidPaymentDialog.mode === 'request') {
              await requestPaymentVoid.mutateAsync({ paymentId: voidPaymentDialog.paymentId, reason });
              toast.success(t('invoices.detail.toasts.paymentVoidRequested'));
            } else {
              await voidPayment.mutateAsync({ paymentId: voidPaymentDialog.paymentId, reason });
              toast.success(t('invoices.detail.toasts.paymentVoided'));
            }
          } catch (error) {
            toast.error(error?.response?.data?.message || t('invoices.detail.toasts.error'));
          }
        }}
      />
    </div>
  );
}

export default InvoiceDetailPage;
