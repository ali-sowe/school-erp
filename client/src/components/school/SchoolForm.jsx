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
import { useCreateSchool, useUpdateSchool } from '@/hooks/school/useSchoolMutations';

// Matches server/constants/education-levels.js exactly — the Gambian
// Context doc's structure (Early Childhood -> Lower Basic -> Upper Basic ->
// Senior Secondary). Every grade a school creates later has to be one of
// these AND one the school actually offers (see grade.helper.js), so this
// list has to stay in sync with the server's own.
const EDUCATION_LEVELS = ['EARLY_CHILDHOOD', 'LOWER_BASIC', 'UPPER_BASIC', 'SENIOR_SECONDARY'];

// The admin account is only created once, atomically with the school
// itself (see school.service.js's createSchool) — there's no separate
// "add administrator" step later in this form, so admin fields simply
// don't apply on edit.
function SchoolForm({ school, onSaved, onCancel }) {
  const { t } = useTranslation('school');
  const isEdit = Boolean(school?.id);

  const schoolSchema = z.object({
    name: z.string().min(1, t('form.errors.nameRequired')).max(150),
    ownership_type: z.string().max(50).optional(),
    region: z.string().max(100).optional(),
    education_levels: z.array(z.string()).default([]),
    admin: isEdit
      ? z.any().optional()
      : z.object({
          first_name: z.string().min(1, t('form.errors.adminFirstNameRequired')),
          last_name: z.string().min(1, t('form.errors.adminLastNameRequired')),
          email: z.string().min(1, t('form.errors.adminEmailRequired')).email(t('form.errors.adminEmailInvalid')),
          password: z.string().min(8, t('form.errors.adminPasswordTooShort')),
        }),
  });

  const form = useForm({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: school?.name || '',
      ownership_type: school?.ownership_type || '',
      region: school?.region || '',
      education_levels: school?.education_levels || [],
      admin: { first_name: '', last_name: '', email: '', password: '' },
    },
  });

  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool(school?.id);
  const submitting = createSchool.isPending || updateSchool.isPending;

  const onSubmit = async (values) => {
    const payload = isEdit
      ? {
          name: values.name,
          ownership_type: values.ownership_type || undefined,
          region: values.region || undefined,
          education_levels: values.education_levels,
        }
      : { ...values, ownership_type: values.ownership_type || undefined, region: values.region || undefined };

    try {
      const saved = isEdit ? await updateSchool.mutateAsync(payload) : await createSchool.mutateAsync(payload);
      toast.success(isEdit ? t('form.toasts.updated') : t('form.toasts.created'));
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.nameLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.regionLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ownership_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.ownershipTypeLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.ownershipTypePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="education_levels"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.educationLevelsLabel')}</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-space-4 rounded-md border p-space-4">
                  {EDUCATION_LEVELS.map((level) => (
                    <label key={level} className="flex items-center gap-space-2 text-sm">
                      <Checkbox
                        checked={field.value.includes(level)}
                        onCheckedChange={(checked) => {
                          const next = checked ? [...field.value, level] : field.value.filter((l) => l !== level);
                          field.onChange(next);
                        }}
                      />
                      {t(`educationLevels.${level}`)}
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEdit && (
          <div className="space-y-space-4 rounded-md border p-space-4">
            <p className="text-sm font-semibold">{t('form.adminSectionTitle')}</p>
            <div className="grid gap-space-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="admin.first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.adminFirstNameLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admin.last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.adminLastNameLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="admin.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.adminEmailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="admin.password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.adminPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

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

export default SchoolForm;
