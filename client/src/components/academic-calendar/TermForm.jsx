import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateTerm, useUpdateTerm } from '@/hooks/academic-calendar/useTermMutations';

// academic_year_id only applies on create (like exam's class_id/term_id —
// a term's year isn't editable after the fact; the backend's
// updateTermSchema doesn't accept it either). academicYearId is passed in
// from the page rather than asked for here again, since the page already
// knows which year's terms are being managed.
function TermForm({ term, academicYearId, onSaved, onCancel }) {
  const { t } = useTranslation('academic-calendar');
  const isEdit = Boolean(term?.id);

  const termSchema = z
    .object({
      name: z.string().min(1, t('terms.form.errors.nameRequired')).max(50),
      start_date: z.string().min(1, t('terms.form.errors.startDateRequired')),
      end_date: z.string().min(1, t('terms.form.errors.endDateRequired')),
    })
    .refine((values) => values.end_date > values.start_date, {
      message: t('terms.form.errors.endAfterStart'),
      path: ['end_date'],
    });

  const form = useForm({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: term?.name || '',
      start_date: term?.start_date ? term.start_date.slice(0, 10) : '',
      end_date: term?.end_date ? term.end_date.slice(0, 10) : '',
    },
  });

  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm(term?.id);
  const submitting = createTerm.isPending || updateTerm.isPending;

  const onSubmit = async (values) => {
    try {
      const saved = isEdit
        ? await updateTerm.mutateAsync(values)
        : await createTerm.mutateAsync({ ...values, academic_year_id: academicYearId });
      toast.success(isEdit ? t('terms.form.toasts.updated') : t('terms.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('terms.form.toasts.error'));
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
              <FormLabel>{t('terms.form.nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('terms.form.namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('terms.form.startDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('terms.form.endDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

export default TermForm;
