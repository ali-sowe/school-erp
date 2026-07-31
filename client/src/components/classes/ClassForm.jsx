import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { GradeLevelSelector } from '@/components/erp/GradeLevelSelector';
import { useCreateClass, useUpdateClass } from '@/hooks/classes/useClassMutations';

function ClassForm({ classItem, onSaved, onCancel }) {
  const { t } = useTranslation('classes');
  const isEdit = Boolean(classItem?.id);

  const classSchema = z.object({
    grade_level_id: z.string().min(1, t('classes.form.errors.gradeLevelRequired')),
    name: z.string().min(1, t('classes.form.errors.nameRequired')).max(50),
    capacity: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      grade_level_id: classItem?.grade_level_id ? String(classItem.grade_level_id) : '',
      name: classItem?.name || '',
      capacity: classItem?.capacity !== undefined && classItem?.capacity !== null ? String(classItem.capacity) : '',
    },
  });

  const createClass = useCreateClass();
  const updateClass = useUpdateClass(classItem?.id);
  const submitting = createClass.isPending || updateClass.isPending;

  const onSubmit = async (values) => {
    try {
      let saved;
      if (isEdit) {
        const payload = { name: values.name, ...(values.capacity !== '' ? { capacity: Number(values.capacity) } : {}) };
        saved = await updateClass.mutateAsync(payload);
      } else {
        const payload = {
          grade_level_id: Number(values.grade_level_id),
          name: values.name,
          ...(values.capacity !== '' ? { capacity: Number(values.capacity) } : {}),
        };
        saved = await createClass.mutateAsync(payload);
      }
      toast.success(isEdit ? t('classes.form.toasts.updated') : t('classes.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('classes.form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        {!isEdit && (
          <FormField
            control={form.control}
            name="grade_level_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('classes.form.gradeLevelLabel')}</FormLabel>
                <FormControl>
                  <GradeLevelSelector value={field.value} onChange={field.onChange} params={{ status: 'ACTIVE' }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('classes.form.nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('classes.form.namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('classes.form.capacityLabel')}</FormLabel>
              <FormControl>
                <Input type="number" min="1" placeholder={t('classes.form.capacityPlaceholder')} {...field} />
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

export default ClassForm;
