import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateGuardian, useUpdateGuardian } from '@/hooks/guardians/useGuardianMutations';

// Mirrors the backend's createGuardianSchema/updateGuardianSchema exactly —
// all fields optional except first/last name, same on create and update.
function GuardianForm({ guardian, onSaved, onCancel }) {
  const { t } = useTranslation('guardians');
  const isEdit = Boolean(guardian?.id);

  const guardianSchema = z.object({
    first_name: z.string().min(1, t('form.errors.firstNameRequired')).max(100),
    last_name: z.string().min(1, t('form.errors.lastNameRequired')).max(100),
    phone: z.string().max(30).optional(),
    email: z.union([z.string().email(t('form.errors.emailInvalid')), z.literal('')]).optional(),
    address: z.string().max(255).optional(),
    occupation: z.string().max(100).optional(),
  });

  const form = useForm({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      first_name: guardian?.first_name || '',
      last_name: guardian?.last_name || '',
      phone: guardian?.phone || '',
      email: guardian?.email || '',
      address: guardian?.address || '',
      occupation: guardian?.occupation || '',
    },
  });

  const createGuardian = useCreateGuardian();
  const updateGuardian = useUpdateGuardian(guardian?.id);
  const submitting = createGuardian.isPending || updateGuardian.isPending;

  const onSubmit = async (values) => {
    // Optional fields left blank shouldn't overwrite existing values with
    // empty strings on update, or fail email/phone validation on create.
    const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));

    try {
      const saved = isEdit ? await updateGuardian.mutateAsync(payload) : await createGuardian.mutateAsync(payload);
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.phoneLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.phonePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.addressLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.occupationLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
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

export default GuardianForm;
