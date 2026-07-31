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
import { useCreateRole, useUpdateRole } from '@/hooks/admin/useRoleMutations';
import { PERMISSION_GROUPS, permissionsForResource } from '@/lib/permissionGroups';

// Roles store their permissions as a JSON array on the role row itself
// (server: roles.permissions column, editable via the Role API — see
// server/repositories/role/role.repository.js) — this is the actual editor
// for that; the previous version of this form didn't expose permissions at
// all, so every custom role had to be edited directly in the database.
function RoleForm({ role, onSaved, onCancel }) {
  const { t } = useTranslation('admin');
  const isEdit = Boolean(role?.id);

  const roleSchema = z.object({
    role_name: z.string().min(1, t('roles.form.errors.nameRequired')).max(100),
    description: z.string().max(255).optional(),
    permissions: z.array(z.string()).default([]),
  });

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role_name: role?.role_name || '',
      description: role?.description || '',
      permissions: role?.permissions || [],
    },
  });

  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id);
  const submitting = createRole.isPending || updateRole.isPending;

  const onSubmit = async (values) => {
    const payload = { ...values, description: values.description || undefined };

    try {
      const saved = isEdit ? await updateRole.mutateAsync(payload) : await createRole.mutateAsync(payload);
      toast.success(isEdit ? t('roles.form.toasts.updated') : t('roles.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('roles.form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="role_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('roles.form.nameLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('roles.form.descriptionLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('roles.form.descriptionPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('roles.form.permissionsLabel')}</FormLabel>
              <p className="text-sm text-muted-foreground">{t('roles.form.permissionsHint')}</p>
              <FormControl>
                <div className="max-h-80 space-y-space-4 overflow-y-auto rounded-md border p-space-4">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.key} className="space-y-space-2">
                      <p className="text-sm font-semibold">{t(`permissionGroups.${group.key}`)}</p>
                      <div className="grid gap-space-2 sm:grid-cols-2">
                        {group.resources.map((resource) => {
                          const [readPerm, writePerm] = permissionsForResource(resource);

                          const toggle = (permission, checked) => {
                            const next = checked
                              ? [...new Set([...field.value, permission])]
                              : field.value.filter((p) => p !== permission);
                            field.onChange(next);
                          };

                          return (
                            <div key={resource} className="flex items-center gap-space-4 text-sm">
                              <span className="min-w-0 flex-1 truncate capitalize">{resource.replace(/-/g, ' ')}</span>
                              <label className="flex items-center gap-space-1">
                                <Checkbox
                                  checked={field.value.includes(readPerm)}
                                  onCheckedChange={(checked) => toggle(readPerm, checked)}
                                />
                                <span className="text-xs text-muted-foreground">{t('roles.form.readLabel')}</span>
                              </label>
                              {writePerm && (
                                <label className="flex items-center gap-space-1">
                                  <Checkbox
                                    checked={field.value.includes(writePerm)}
                                    onCheckedChange={(checked) => toggle(writePerm, checked)}
                                  />
                                  <span className="text-xs text-muted-foreground">{t('roles.form.writeLabel')}</span>
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
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

export default RoleForm;
