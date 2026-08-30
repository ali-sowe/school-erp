import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateCalendarEvent, useUpdateCalendarEvent } from '@/hooks/academic-calendar/useCalendarEvents';

// category is free text, not a fixed dropdown — schools name their own
// categories (see calendar.validation.js's comment: "Public Holiday",
// "Mid-Term Break", "Eid", "Sports Day", "Emergency Closure", ...).
// is_school_closed is the one field that actually drives behavior
// elsewhere (blocks attendance — see attendance.service.js), kept as an
// explicit checkbox rather than inferred from whatever category text was typed.
function CalendarEventForm({ event, academicYearId, onSaved, onCancel }) {
  const { t } = useTranslation('academic-calendar');
  const isEdit = Boolean(event?.id);

  const eventSchema = z
    .object({
      title: z.string().min(1, t('events.form.errors.titleRequired')).max(150),
      description: z.string().max(1000).optional(),
      category: z.string().max(50).optional(),
      start_date: z.string().min(1, t('events.form.errors.startDateRequired')),
      end_date: z.string().min(1, t('events.form.errors.endDateRequired')),
      is_school_closed: z.boolean(),
    })
    .refine((values) => values.end_date >= values.start_date, {
      message: t('events.form.errors.endNotBeforeStart'),
      path: ['end_date'],
    });

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      category: event?.category || '',
      start_date: event?.start_date ? event.start_date.slice(0, 10) : '',
      end_date: event?.end_date ? event.end_date.slice(0, 10) : '',
      is_school_closed: event?.is_school_closed ?? false,
    },
  });

  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent(event?.id);
  const submitting = createEvent.isPending || updateEvent.isPending;

  const onSubmit = async (values) => {
    try {
      const saved = isEdit
        ? await updateEvent.mutateAsync(values)
        : await createEvent.mutateAsync({ ...values, academic_year_id: academicYearId });
      toast.success(isEdit ? t('events.form.toasts.updated') : t('events.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('events.form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('events.form.titleLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('events.form.titlePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('events.form.categoryLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('events.form.categoryPlaceholder')} {...field} />
              </FormControl>
              <FormDescription>{t('events.form.categoryHint')}</FormDescription>
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
                <FormLabel>{t('events.form.startDateLabel')}</FormLabel>
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
                <FormLabel>{t('events.form.endDateLabel')}</FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('events.form.descriptionLabel')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('events.form.descriptionPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_school_closed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-space-2 rounded-lg border p-space-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t('events.form.schoolClosedLabel')}</FormLabel>
                <FormDescription>{t('events.form.schoolClosedHint')}</FormDescription>
              </div>
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

export default CalendarEventForm;
