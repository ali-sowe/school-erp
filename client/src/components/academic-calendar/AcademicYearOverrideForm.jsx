import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useOverrideAcademicYear } from '@/hooks/academic-calendar/useAcademicYearMutations';

// "Reality overrides plans" (lifecycle-status.helper.js) — this is how a
// school records that the year actually started or ended on a different
// date than planned (a delayed reopening, an early closure). Both dates
// are optional individually (a school might only need to correct one),
// but a reason is always required since this is an audited correction, not
// routine editing.
function AcademicYearOverrideForm({ academicYear, onSaved, onCancel }) {
  const { t } = useTranslation('academic-calendar');

  const overrideSchema = z.object({
    actual_start_date: z.string().optional(),
    actual_end_date: z.string().optional(),
    reason: z.string().min(3, t('years.overrideForm.errors.reasonRequired')).max(255),
  });

  const form = useForm({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      actual_start_date: academicYear?.actual_start_date ? academicYear.actual_start_date.slice(0, 10) : '',
      actual_end_date: academicYear?.actual_end_date ? academicYear.actual_end_date.slice(0, 10) : '',
      reason: '',
    },
  });

  const overrideAcademicYear = useOverrideAcademicYear(academicYear?.id);

  const onSubmit = async (values) => {
    const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
    try {
      const saved = await overrideAcademicYear.mutateAsync(payload);
      toast.success(t('years.overrideForm.toasts.saved'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('years.overrideForm.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <p className="text-sm text-muted-foreground">{t('years.overrideForm.description')}</p>

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="actual_start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('years.overrideForm.actualStartLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actual_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('years.overrideForm.actualEndLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('years.overrideForm.reasonLabel')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('years.overrideForm.reasonPlaceholder')} {...field} />
              </FormControl>
              <FormDescription>{t('years.overrideForm.reasonHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={overrideAcademicYear.isPending}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={overrideAcademicYear.isPending}>
            {overrideAcademicYear.isPending ? t('common:states.loading', { ns: 'common' }) : t('years.overrideForm.submitButton')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default AcademicYearOverrideForm;
