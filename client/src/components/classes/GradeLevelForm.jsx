import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateGradeLevel, useUpdateGradeLevel } from '@/hooks/classes/useGradeLevels';

function GradeLevelForm({ gradeLevel, onSaved, onCancel }) {
  const { t } = useTranslation('classes');
  const isEdit = Boolean(gradeLevel?.id);

  const gradeLevelSchema = z.object({
    name: z.string().min(1, t('gradeLevels.form.errors.nameRequired')).max(50),
    education_level: z.string().min(1, t('gradeLevels.form.errors.educationLevelRequired')).max(50),
    sequence_order: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(gradeLevelSchema),
    defaultValues: {
      name: gradeLevel?.name || '',
      education_level: gradeLevel?.education_level || '',
      sequence_order: gradeLevel?.sequence_order !== undefined ? String(gradeLevel.sequence_order) : '',
    },
  });

  const createGradeLevel = useCreateGradeLevel();
  const updateGradeLevel = useUpdateGradeLevel(gradeLevel?.id);
  const submitting = createGradeLevel.isPending || updateGradeLevel.isPending;

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      education_level: values.education_level,
      ...(values.sequence_order !== '' ? { sequence_order: Number(values.sequence_order) } : {}),
    };

    try {
      const saved = isEdit ? await updateGradeLevel.mutateAsync(payload) : await createGradeLevel.mutateAsync(payload);
      toast.success(isEdit ? t('gradeLevels.form.toasts.updated') : t('gradeLevels.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('gradeLevels.form.toasts.error'));
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
              <FormLabel>{t('gradeLevels.form.nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('gradeLevels.form.namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="education_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('gradeLevels.form.educationLevelLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>{t('gradeLevels.form.educationLevelHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sequence_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('gradeLevels.form.sequenceLabel')}</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormDescription>{t('gradeLevels.form.sequenceHint')}</FormDescription>
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

export default GradeLevelForm;
