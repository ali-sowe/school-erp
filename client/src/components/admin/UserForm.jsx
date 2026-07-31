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
import { useCreateUser, useUpdateUser } from '@/hooks/admin/useUserMutations';

// The backend's user creation route has no server-side validation layer
// yet (an older module that predates the validate() middleware convention
// every module since has used — see server/routes/user/user.routes.js) —
// this client-side schema is the only safety net for password strength
// today, not a duplicate of one that also exists server-side.
function UserForm({ user, roles, onSaved, onCancel }) {
  const { t } = useTranslation('admin');
  const isEdit = Boolean(user?.id);

  const userSchema = z
    .object({
      first_name: z.string().min(1, t('users.form.errors.firstNameRequired')).max(100),
      last_name: z.string().min(1, t('users.form.errors.lastNameRequired')).max(100),
      email: z.string().min(1, t('users.form.errors.emailRequired')).email(t('users.form.errors.emailInvalid')),
      role_id: z.string().min(1, t('users.form.errors.roleRequired')),
      password: z.string().optional(),
    })
    // Required only on create, and only fires when nothing was typed at
    // all — kept separate from the length check below so a too-short
    // password shows "too short", not "required" (Zod runs every .refine()
    // on the same path, so overlapping conditions would otherwise both
    // fire and show the wrong one first).
    .refine((data) => isEdit || Boolean(data.password), {
      message: t('users.form.errors.passwordRequired'),
      path: ['password'],
    })
    .refine((data) => !data.password || data.password.length >= 8, {
      message: t('users.form.errors.passwordTooShort'),
      path: ['password'],
    });

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      role_id: user?.role_id ? String(user.role_id) : '',
      password: '',
    },
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id);
  const submitting = createUser.isPending || updateUser.isPending;

  const onSubmit = async (values) => {
    // On edit, a blank password means "keep the current one" — don't send
    // an empty string that would overwrite it.
    const payload = {
      ...values,
      role_id: Number(values.role_id),
      password: values.password || undefined,
    };

    try {
      const saved = isEdit ? await updateUser.mutateAsync(payload) : await createUser.mutateAsync(payload);
      toast.success(isEdit ? t('users.form.toasts.updated') : t('users.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('users.form.toasts.error'));
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
                <FormLabel>{t('users.form.firstNameLabel')}</FormLabel>
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
                <FormLabel>{t('users.form.lastNameLabel')}</FormLabel>
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
              <FormLabel>{t('users.form.emailLabel')}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.form.roleLabel')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.form.rolePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.form.passwordLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={isEdit ? t('users.form.passwordPlaceholderEdit') : t('users.form.passwordPlaceholderCreate')}
                  {...field}
                />
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

export default UserForm;
