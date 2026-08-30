import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateExpenseCategory, useUpdateExpenseCategory } from '@/hooks/expenses/useExpenseCategoryMutations';

function ExpenseCategoryForm({ category, onSaved, onCancel }) {
  const { t } = useTranslation('expenses');
  const isEdit = Boolean(category?.id);

  const categorySchema = z.object({
    name: z.string().min(1, t('categories.form.errors.nameRequired')).max(100),
    description: z.string().max(255).optional(),
  });

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
    },
  });

  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory(category?.id);
  const submitting = createCategory.isPending || updateCategory.isPending;

  const onSubmit = async (values) => {
    const payload = { name: values.name, description: values.description || undefined };

    try {
      const saved = isEdit ? await updateCategory.mutateAsync(payload) : await createCategory.mutateAsync(payload);
      toast.success(isEdit ? t('categories.form.toasts.updated') : t('categories.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('categories.form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('categories.form.nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('categories.form.namePlaceholder')} {...field} />
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
              <FormLabel>{t('categories.form.descriptionLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('categories.form.descriptionPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default ExpenseCategoryForm;
