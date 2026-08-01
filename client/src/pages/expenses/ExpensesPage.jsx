import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Tag, Receipt } from 'lucide-react';

import { useExpenseCategories } from '@/hooks/expenses/useExpenseCategories';
import { useArchiveExpenseCategory, useRestoreExpenseCategory } from '@/hooks/expenses/useExpenseCategoryMutations';
import { useExpenses } from '@/hooks/expenses/useExpenses';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import ExpenseCategoryForm from '@/components/expenses/ExpenseCategoryForm';
import ExpenseForm from '@/components/expenses/ExpenseForm';

function formatAmount(amount) {
  // amount is a string (DECIMAL column) — Number() before formatting, same
  // string-vs-number care as FinancePage's own formatAmount.
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ExpensesPage() {
  const { t } = useTranslation('expenses');
  const navigate = useNavigate();

  const { data: categories, isLoading: categoriesLoading } = useExpenseCategories();
  const archiveCategory = useArchiveExpenseCategory();
  const restoreCategory = useRestoreExpenseCategory();

  const { data: expenses, isLoading: expensesLoading } = useExpenses();

  // Expenses only carry a raw category_id (SELECT e.*, ar.status... — no
  // join to expense_categories — see expense.repository.js's findAll), so
  // the name has to be resolved client-side, same id-to-name mapping
  // pattern as FinancePage's studentNameById.
  const categoryNameById = useMemo(() => {
    const map = new Map();
    (categories ?? []).forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);

  const handleArchiveToggle = async (category) => {
    try {
      if (category.status === 'ARCHIVED') {
        await restoreCategory.mutateAsync(category.id);
        toast.success(t('categories.toasts.restored'));
      } else {
        await archiveCategory.mutateAsync(category.id);
        toast.success(t('categories.toasts.archived'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('categories.toasts.error'));
    }
  };

  const categoryColumns = useMemo(
    () => [
      { accessorKey: 'name', header: t('categories.table.name') },
      {
        accessorKey: 'description',
        header: t('categories.table.description'),
        cell: ({ row }) => row.original.description || '—',
      },
      {
        accessorKey: 'status',
        header: t('categories.table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: t('categories.table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-space-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveCategory(row.original);
                setCategoryFormOpen(true);
              }}
            >
              {t('common:actions.edit', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleArchiveToggle(row.original)}>
              {row.original.status === 'ARCHIVED'
                ? t('common:actions.restore', { ns: 'common' })
                : t('common:actions.archive', { ns: 'common' })}
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  const expenseColumns = useMemo(
    () => [
      { accessorKey: 'title', header: t('expenses.table.title') },
      {
        id: 'category',
        header: t('expenses.table.category'),
        cell: ({ row }) => categoryNameById.get(row.original.category_id) || '—',
      },
      { accessorKey: 'amount', header: t('expenses.table.amount'), cell: ({ row }) => formatAmount(row.original.amount) },
      {
        accessorKey: 'expense_date',
        header: t('expenses.table.expenseDate'),
        cell: ({ row }) => row.original.expense_date?.slice(0, 10),
      },
      {
        // The linked approval_requests.status, joined in — never a column
        // on expenses itself (see expense.repository.js's SELECT_WITH_STATUS).
        accessorKey: 'status',
        header: t('expenses.table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: t('expenses.table.actions'),
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => navigate(`/expenses/${row.original.id}`)}>
            {t('expenses.table.viewButton')}
          </Button>
        ),
      },
    ],
    [t, navigate, categoryNameById]
  );

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" />
            {t('categories.sectionTitle')}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setActiveCategory(null);
              setCategoryFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('categories.addButton')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={categoryColumns}
            data={categories}
            isLoading={categoriesLoading}
            emptyState={<EmptyState icon={Tag} title={t('categories.empty.title')} description={t('categories.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            {t('expenses.sectionTitle')}
          </CardTitle>
          <Button size="sm" onClick={() => setExpenseFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('expenses.addButton')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={expenseColumns}
            data={expenses}
            isLoading={expensesLoading}
            emptyState={<EmptyState icon={Receipt} title={t('expenses.empty.title')} description={t('expenses.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Dialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeCategory ? t('categories.form.editTitle') : t('categories.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <ExpenseCategoryForm category={activeCategory} onSaved={() => setCategoryFormOpen(false)} onCancel={() => setCategoryFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('expenses.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            onSaved={(expense) => {
              setExpenseFormOpen(false);
              if (expense?.id) navigate(`/expenses/${expense.id}`);
            }}
            onCancel={() => setExpenseFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExpensesPage;
