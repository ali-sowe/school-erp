import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateAcademicYear, useUpdateAcademicYear } from '@/hooks/academic-calendar/useAcademicYearMutations';

function AcademicYearForm({ academicYear, onSaved, onCancel }) {
  const { t } = useTranslation('academic-calendar');
  const isEdit = Boolean(academicYear?.id);

  const academicYearSchema = z
    .object({
      name: z.string().min(1, t('years.form.errors.nameRequired')).max(20),
      start_date: z.string().min(1, t('years.form.errors.startDateRequired')),
      end_date: z.string().min(1, t('years.form.errors.endDateRequired')),
    })
    .refine((values) => values.end_date > values.start_date, {
      message: t('years.form.errors.endAfterStart'),
      path: ['end_date'],
    });

  const form = useForm({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: academicYear?.name || '',
      start_date: academicYear?.start_date ? academicYear.start_date.slice(0, 10) : '',
      end_date: academicYear?.end_date ? academicYear.end_date.slice(0, 10) : '',
    },
  });

  const createAcademicYear = useCreateAcademicYear();
  const updateAcademicYear = useUpdateAcademicYear(academicYear?.id);
  const submitting = createAcademicYear.isPending || updateAcademicYear.isPending;

  const onSubmit = async (values) => {
    try {
      const saved = isEdit ? await updateAcademicYear.mutateAsync(values) : await createAcademicYear.mutateAsync(values);
      toast.success(isEdit ? t('years.form.toasts.updated') : t('years.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('years.form.toasts.error'));
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
              <FormLabel>{t('years.form.nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('years.form.namePlaceholder')} {...field} />
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
                <FormLabel>{t('years.form.startDateLabel')}</FormLabel>
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
                <FormLabel>{t('years.form.endDateLabel')}</FormLabel>
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

export default AcademicYearForm;
