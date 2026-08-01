import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useAddCopies } from '@/hooks/library/useBookCopies';

// copy_numbers, when given, takes priority over quantity — mirrors
// copy.validation.js's own comment on the backend exactly, so the form
// doesn't invent a "mode" the API doesn't actually have.
function AddCopiesForm({ bookId, onSaved, onCancel }) {
  const { t } = useTranslation('library');

  const addCopiesSchema = z
    .object({
      quantity: z.string().optional(),
      copy_numbers: z.string().optional(),
    })
    .refine((data) => (data.quantity && data.quantity !== '') || (data.copy_numbers && data.copy_numbers.trim() !== ''), {
      message: t('copies.form.errors.quantityRequired'),
      path: ['quantity'],
    });

  const form = useForm({
    resolver: zodResolver(addCopiesSchema),
    defaultValues: { quantity: '', copy_numbers: '' },
  });

  const addCopies = useAddCopies(bookId);

  const onSubmit = async (values) => {
    const copyNumbers = values.copy_numbers
      ? values.copy_numbers.split('\n').map((line) => line.trim()).filter(Boolean)
      : [];

    const payload = copyNumbers.length > 0 ? { copy_numbers: copyNumbers } : { quantity: Number(values.quantity) };

    try {
      await addCopies.mutateAsync(payload);
      toast.success(t('copies.toasts.added'));
      onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('copies.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('copies.form.quantityLabel')}</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="copy_numbers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('copies.form.copyNumbersLabel')}</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormDescription>{t('copies.form.copyNumbersHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={addCopies.isPending}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={addCopies.isPending}>
            {addCopies.isPending ? t('common:states.loading', { ns: 'common' }) : t('copies.form.submitButton')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default AddCopiesForm;
