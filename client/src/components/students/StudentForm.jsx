import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateStudent, useUpdateStudent } from '@/hooks/students/useStudentMutations';

// admission_number and admission_date only apply on create — the backend's
// updateStudentSchema deliberately doesn't accept them (admission history
// shouldn't be rewritten after the fact).
function StudentForm({ student, onSaved, onCancel }) {
  const { t } = useTranslation('students');
  const isEdit = Boolean(student?.id);

  const studentSchema = z.object({
    admission_number: z.string().max(50).optional(),
    first_name: z.string().min(1, t('form.errors.firstNameRequired')).max(100),
    last_name: z.string().min(1, t('form.errors.lastNameRequired')).max(100),
    gender: z.string().optional(),
    date_of_birth: z
      .string()
      .optional()
      .refine((value) => !value || new Date(value) <= new Date(), { message: t('form.errors.dateOfBirthFuture') }),
    admission_date: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admission_number: '',
      first_name: student?.first_name || '',
      last_name: student?.last_name || '',
      gender: student?.gender || '',
      date_of_birth: student?.date_of_birth ? student.date_of_birth.slice(0, 10) : '',
      admission_date: '',
    },
  });

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(student?.id);
  const submitting = createStudent.isPending || updateStudent.isPending;

  const onSubmit = async (values) => {
    try {
      let saved;
      if (isEdit) {
        const payload = Object.fromEntries(
          Object.entries({
            first_name: values.first_name,
            last_name: values.last_name,
            gender: values.gender,
            date_of_birth: values.date_of_birth,
          }).filter(([, value]) => value !== '')
        );
        saved = await updateStudent.mutateAsync(payload);
        toast.success(t('form.toasts.updated'));
      } else {
        const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
        saved = await createStudent.mutateAsync(payload);
        toast.success(t('form.toasts.created'));
      }
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        {!isEdit && (
          <FormField
            control={form.control}
            name="admission_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.admissionNumberLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.admissionNumberPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.genderLabel')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.genderNotSpecified')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">{t('form.genderMale')}</SelectItem>
                    <SelectItem value="Female">{t('form.genderFemale')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.dateOfBirthLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isEdit && (
          <FormField
            control={form.control}
            name="admission_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.admissionDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" placeholder={t('form.admissionDatePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

export default StudentForm;
