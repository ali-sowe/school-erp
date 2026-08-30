import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateSubject, useUpdateSubject } from '@/hooks/classes/useSubjects';

function SubjectForm({ subject, onSaved, onCancel }) {
  const { t } = useTranslation('classes');
  const isEdit = Boolean(subject?.id);

  const subjectSchema = z.object({
    name: z.string().min(1, t('subjects.form.errors.nameRequired')).max(100),
    code: z.string().min(1, t('subjects.form.errors.codeRequired')).max(20),
    is_core: z.boolean(),
  });

  const form = useForm({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: subject?.name || '',
      code: subject?.code || '',
      is_core: subject?.is_core ?? true,
    },
  });

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject(subject?.id);
  const submitting = createSubject.isPending || updateSubject.isPending;

  const onSubmit = async (values) => {
    try {
      const saved = isEdit ? await updateSubject.mutateAsync(values) : await createSubject.mutateAsync(values);
      toast.success(isEdit ? t('subjects.form.toasts.updated') : t('subjects.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('subjects.form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('subjects.form.nameLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('subjects.form.codeLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('subjects.form.codePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_core"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-space-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">{t('subjects.form.isCoreLabel')}</FormLabel>
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

export default SubjectForm;
