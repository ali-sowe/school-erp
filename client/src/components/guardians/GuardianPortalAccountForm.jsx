import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateGuardianPortalAccount } from '@/hooks/guardians/useGuardianMutations';

function GuardianPortalAccountForm({ guardianId, onSaved, onCancel }) {
  const { t } = useTranslation('guardians');

  const portalAccountSchema = z.object({
    email: z.union([z.string().email(t('portal.errors.emailInvalid')), z.literal('')]).optional(),
    password: z.string().min(8, t('portal.errors.passwordTooShort')),
  });

  const form = useForm({
    resolver: zodResolver(portalAccountSchema),
    defaultValues: { email: '', password: '' },
  });

  const createPortalAccount = useCreateGuardianPortalAccount(guardianId);

  const onSubmit = async (values) => {
    const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));

    try {
      const saved = await createPortalAccount.mutateAsync(payload);
      toast.success(t('portal.toasts.granted'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('portal.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('portal.emailLabel')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('portal.emailPlaceholder')} {...field} />
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
              <FormLabel>{t('portal.passwordLabel')}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={createPortalAccount.isPending}>
            {t('portal.cancelButton')}
          </Button>
          <Button type="submit" disabled={createPortalAccount.isPending}>
            {createPortalAccount.isPending ? t('common:states.loading', { ns: 'common' }) : t('portal.submitButton')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default GuardianPortalAccountForm;
