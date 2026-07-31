import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { ClassSelector } from '@/components/erp/ClassSelector';
import { TermSelector } from '@/components/erp/TermSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useAcademicYears } from '@/hooks/shared/useAcademicYears';
import { useCreateExam } from '@/hooks/exams/useExamMutations';

// Only class/term/name/type/planned dates are ever submitted at creation —
// updateExamSchema doesn't allow changing class/term/academic_year after
// the fact (an exam's scope is fixed at scheduling time), so there's no
// separate edit variant of this form the way TeacherForm has one.
// Only class/term/name/type/planned dates are ever submitted at creation —
// updateExamSchema doesn't allow changing class/term/academic_year after
// the fact (an exam's scope is fixed at scheduling time), so there's no
// separate edit variant of this form the way TeacherForm has one.
function ExamForm({ onSaved, onCancel }) {
  const { t } = useTranslation('exams');

  const examSchema = z.object({
    class_id: z.string().min(1, t('form.errors.classRequired')),
    term_id: z.string().min(1, t('form.errors.termRequired')),
    name: z.string().min(1, t('form.errors.nameRequired')),
    exam_type: z.string().optional(),
    planned_start_date: z.string().min(1, t('form.errors.startRequired')),
    planned_end_date: z.string().min(1, t('form.errors.endRequired')),
  });

  // The exam always belongs to the currently-active academic year — the
  // backend resolves this itself when academic_year_id is omitted
  // (resolveAcademicYearId in exam.service.js), so the form only needs to
  // know it to narrow the TermSelector's own options.
  const { data: academicYears } = useAcademicYears();
  const activeAcademicYear = (academicYears ?? []).find((year) => year.status === 'ACTIVE');

  const form = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: { class_id: '', term_id: '', name: '', exam_type: '', planned_start_date: '', planned_end_date: '' },
  });

  const createExam = useCreateExam();

  const onSubmit = async (values) => {
    try {
      const saved = await createExam.mutateAsync({
        class_id: Number(values.class_id),
        term_id: Number(values.term_id),
        name: values.name,
        exam_type: values.exam_type || undefined,
        planned_start_date: values.planned_start_date,
        planned_end_date: values.planned_end_date,
      });
      toast.success(t('form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="class_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.classLabel')}</FormLabel>
                <FormControl>
                  <ClassSelector value={field.value} onChange={field.onChange} params={{ status: 'ACTIVE' }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="term_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.termLabel')}</FormLabel>
                <FormControl>
                  <TermSelector value={field.value} onChange={field.onChange} academicYearId={activeAcademicYear?.id} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          <Button type="button" variant="outline" onClick={onCancel} disabled={createExam.isPending}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={createExam.isPending}>
            {createExam.isPending ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default ExamForm;
