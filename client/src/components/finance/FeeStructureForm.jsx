import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { AcademicYearSelector } from '@/components/erp/AcademicYearSelector';
import { GradeLevelSelector } from '@/components/erp/GradeLevelSelector';
import { useCreateFeeStructure, useUpdateFeeStructure } from '@/hooks/finance/useFeeStructureMutations';

// academic_year_id and grade_level_id are both immutable after creation
// (the backend's updateFeeStructureSchema only accepts name/amount) — same
// "not rendered in edit mode" choice as ClassForm's grade_level_id.
function FeeStructureForm({ feeStructure, onSaved, onCancel }) {
  const { t } = useTranslation('finance');
  const isEdit = Boolean(feeStructure?.id);

  const feeStructureSchema = z.object({
    academic_year_id: isEdit ? z.string().optional() : z.string().min(1, t('feeStructures.form.errors.academicYearRequired')),
    grade_level_id: z.string().optional(),
    name: z.string().min(1, t('feeStructures.form.errors.nameRequired')).max(150),
    amount: z.string().min(1, t('feeStructures.form.errors.amountRequired')),
  });

  const form = useForm({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      academic_year_id: feeStructure?.academic_year_id ? String(feeStructure.academic_year_id) : '',
      grade_level_id: feeStructure?.grade_level_id ? String(feeStructure.grade_level_id) : '',
      name: feeStructure?.name || '',
      amount: feeStructure?.amount ? String(feeStructure.amount) : '',
    },
  });

  const createFeeStructure = useCreateFeeStructure();
  const updateFeeStructure = useUpdateFeeStructure(feeStructure?.id);
  const submitting = createFeeStructure.isPending || updateFeeStructure.isPending;

  const onSubmit = async (values) => {
    // grade_level_id is omitted entirely (not sent as "") when not chosen —
    // a school-wide fee, per fee-structure.helper.js treating a missing
    // grade_level_id as "applies to every grade".
    const payload = isEdit
      ? { name: values.name, amount: Number(values.amount) }
      : {
          academic_year_id: Number(values.academic_year_id),
          ...(values.grade_level_id ? { grade_level_id: Number(values.grade_level_id) } : {}),
          name: values.name,
          amount: Number(values.amount),
        };

    try {
      const saved = isEdit
        ? await updateFeeStructure.mutateAsync(payload)
        : await createFeeStructure.mutateAsync(payload);
      toast.success(isEdit ? t('feeStructures.form.toasts.updated') : t('feeStructures.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('feeStructures.form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        {!isEdit && (
          <div className="grid gap-space-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feeStructures.form.academicYearLabel')}</FormLabel>
                  <FormControl>
                    <AcademicYearSelector value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade_level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feeStructures.form.gradeLevelLabel')}</FormLabel>
                  <FormControl>
                    <GradeLevelSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('feeStructures.form.gradeLevelPlaceholder')}
                      params={{ status: 'ACTIVE' }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t('feeStructures.form.gradeLevelHint')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('feeStructures.form.nameLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('feeStructures.form.namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('feeStructures.form.amountLabel')}</FormLabel>
                <FormControl>
                  <Input type="number" min="0.01" step="0.01" {...field} />
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

export default FeeStructureForm;
