import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateTeacher, useUpdateTeacher } from '@/hooks/teachers/useTeacherMutations';

// name/email/password/employee_number only apply on create — the
// backend's updateTeacherSchema deliberately only accepts qualification,
// specialization, and hire_date (identity fields aren't rewritten after
// the fact), same reasoning as StudentForm's admission_number/date split.
function TeacherForm({ teacher, onSaved, onCancel }) {
  const { t } = useTranslation('teachers');
  const isEdit = Boolean(teacher?.id);

  const teacherSchema = isEdit
    ? z.object({
        qualification: z.string().max(150).optional(),
        specialization: z.string().max(150).optional(),
        hire_date: z.string().optional(),
      })
    : z.object({
        first_name: z.string().min(1, t('form.errors.firstNameRequired')).max(100),
        last_name: z.string().min(1, t('form.errors.lastNameRequired')).max(100),
        email: z.string().min(1, t('form.errors.emailRequired')).email(t('form.errors.emailInvalid')),
        password: z.string().min(8, t('form.errors.passwordTooShort')),
        employee_number: z.string().max(50).optional(),
        qualification: z.string().max(150).optional(),
        specialization: z.string().max(150).optional(),
        hire_date: z.string().optional(),
      });

  const form = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      employee_number: '',
      qualification: teacher?.qualification || '',
      specialization: teacher?.specialization || '',
      hire_date: teacher?.hire_date ? teacher.hire_date.slice(0, 10) : '',
    },
  });

  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher(teacher?.id);
  const submitting = createTeacher.isPending || updateTeacher.isPending;

  const onSubmit = async (values) => {
    // Blank optional fields shouldn't overwrite an existing value with an
    // empty string on update — omit them instead so the backend leaves
    // that field untouched (updateTeacherSchema requires .min(1) anyway).
    const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));

    try {
      const saved = isEdit ? await updateTeacher.mutateAsync(payload) : await createTeacher.mutateAsync(payload);
      toast.success(isEdit ? t('form.toasts.updated') : t('form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        {!isEdit && (
          <>
            <div className="grid gap-space-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.firstNameLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.lastNameLabel')}</FormLabel>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.emailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.passwordLabel')}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder={t('form.passwordPlaceholderCreate')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employee_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.employeeNumberLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>{t('form.employeeNumberHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.qualificationLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.specializationLabel')}</FormLabel>
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
          name="hire_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.hireDateLabel')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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

export default TeacherForm;
