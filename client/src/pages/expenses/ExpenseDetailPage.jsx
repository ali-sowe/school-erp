import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { useExpense } from '@/hooks/expenses/useExpenses';
import { useExpenseCategories } from '@/hooks/expenses/useExpenseCategories';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/erp/StatusBadge';

function formatAmount(amount) {
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// No void/edit actions here, unlike InvoiceDetailPage — an expense has no
// mutation of its own once submitted (see expense.service.js's own
// comment: the approval itself is the outcome). Approving, rejecting,
// executing, or cancelling all happen on the linked approval request's own
// page, not duplicated here.
function ExpenseDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('expenses');

  const { data: expense, isLoading, isError } = useExpense(id);
  const { data: categories } = useExpenseCategories();
  const categoryName = (categories ?? []).find((category) => category.id === expense?.category_id)?.name;

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !expense) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/expenses" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-6">
      <Link to="/expenses" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">{expense.title}</CardTitle>
          <StatusBadge status={expense.status} />
        </CardHeader>
        <CardContent className="space-y-space-4">
          {expense.description && <p>{expense.description}</p>}

          <dl className="grid gap-space-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.categoryLabel')}</dt>
              <dd className="font-medium">{categoryName || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.amountLabel')}</dt>
              <dd className="font-medium">{formatAmount(expense.amount)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.expenseDateLabel')}</dt>
              <dd className="font-medium">{expense.expense_date?.slice(0, 10)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.vendorNameLabel')}</dt>
              <dd className="font-medium">{expense.vendor_name || t('detail.notSet')}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.paymentMethodLabel')}</dt>
              <dd className="font-medium">{expense.payment_method || t('detail.notSet')}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.referenceLabel')}</dt>
              <dd className="font-medium">{expense.reference_number || t('detail.notSet')}</dd>
            </div>
          </dl>

          {expense.approval_request_id && (
            <div className="border-t pt-space-4">
              <p className="mb-space-2 text-sm text-muted-foreground">{t('detail.approvalLinkLabel')}</p>
              <Button variant="outline" asChild>
                <Link to={`/approvals/${expense.approval_request_id}`}>
                  <ExternalLink className="h-4 w-4" />
                  {t('detail.viewApprovalButton')}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExpenseDetailPage;
