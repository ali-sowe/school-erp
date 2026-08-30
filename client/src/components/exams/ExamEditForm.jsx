import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useUpdateExam } from '@/hooks/exams/useExamMutations';

// Edit-only counterpart to ExamForm: class_id/term_id/academic_year_id are
// fixed at scheduling time (see ExamForm's comment on why), but
// updateExamSchema does allow changing name/exam_type/planned dates after
// the fact — a typo in the name or a rescheduled date shouldn't be
// unfixable, so this covers just those four fields.
function ExamEditForm({ exam, onSaved, onCancel }) {
  const { t } = useTranslation('exams');

  const editSchema = z.object({
    name: z.string().min(1, t('form.errors.nameRequired')),
    exam_type: z.string().optional(),
    planned_start_date: z.string().min(1, t('form.errors.startRequired')),
    planned_end_date: z.string().min(1, t('form.errors.endRequired')),
  });

  const form = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: exam.name || '',
      exam_type: exam.exam_type || '',
      planned_start_date: exam.planned_start_date ? exam.planned_start_date.slice(0, 10) : '',
      planned_end_date: exam.planned_end_date ? exam.planned_end_date.slice(0, 10) : '',
    },
  });

  const updateExam = useUpdateExam(exam.id);

  const onSubmit = async (values) => {
    try {
      const saved = await updateExam.mutateAsync({
        name: values.name,
        exam_type: values.exam_type || undefined,
        planned_start_date: values.planned_start_date,
        planned_end_date: values.planned_end_date,
      });
      toast.success(t('detail.toasts.updated'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
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
              <FormLabel>{t('form.nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="exam_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.examTypeLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.examTypePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="planned_start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.plannedStartLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="planned_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.plannedEndLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={updateExam.isPending}>
            {t('detail.cancelButton')}
          </Button>
          <Button type="submit" disabled={updateExam.isPending}>
            {updateExam.isPending ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default ExamEditForm;
