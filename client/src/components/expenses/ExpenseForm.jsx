import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { AcademicYearSelector } from '@/components/erp/AcademicYearSelector';
import { useExpenseCategories } from '@/hooks/expenses/useExpenseCategories';
import { useSubmitExpense } from '@/hooks/expenses/useExpenseMutations';

function ExpenseForm({ onSaved, onCancel }) {
  const { t } = useTranslation('expenses');

  const expenseSchema = z.object({
    category_id: z.string().min(1, t('expenses.form.errors.categoryRequired')),
    academic_year_id: z.string().min(1, t('expenses.form.errors.academicYearRequired')),
    title: z.string().min(1, t('expenses.form.errors.titleRequired')).max(255),
    description: z.string().max(1000).optional(),
    amount: z.string().min(1, t('expenses.form.errors.amountRequired')),
    expense_date: z.string().min(1, t('expenses.form.errors.expenseDateRequired')),
    vendor_name: z.string().max(150).optional(),
    payment_method: z.string().max(30).optional(),
    reference_number: z.string().max(100).optional(),
  });

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category_id: '',
      academic_year_id: '',
      title: '',
      description: '',
      amount: '',
      expense_date: '',
      vendor_name: '',
      payment_method: '',
      reference_number: '',
    },
  });

  const { data: categories } = useExpenseCategories({ status: 'ACTIVE' });
  const submitExpense = useSubmitExpense();

  const onSubmit = async (values) => {
    try {
      const saved = await submitExpense.mutateAsync({
        category_id: Number(values.category_id),
        academic_year_id: Number(values.academic_year_id),
        title: values.title,
        description: values.description || undefined,
        amount: Number(values.amount),
        expense_date: values.expense_date,
        vendor_name: values.vendor_name || undefined,
        payment_method: values.payment_method || undefined,
        reference_number: values.reference_number || undefined,
      });
      toast.success(t('expenses.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('expenses.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.form.categoryLabel')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('expenses.form.categoryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="academic_year_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.form.academicYearLabel')}</FormLabel>
                <FormControl>
                  <AcademicYearSelector value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.form.titleLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('expenses.form.titlePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.form.descriptionLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('expenses.form.descriptionPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.form.amountLabel')}</FormLabel>
                <FormControl>
                  <Input type="number" min="0.01" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expense_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.form.expenseDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="vendor_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.form.vendorNameLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('expenses.form.vendorNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.form.paymentMethodLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('expenses.form.paymentMethodPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reference_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.form.referenceLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('expenses.form.referencePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitExpense.isPending}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={submitExpense.isPending}>
            {submitExpense.isPending ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default ExpenseForm;
