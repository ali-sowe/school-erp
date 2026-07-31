import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, ShieldCheck, Users as UsersIcon } from 'lucide-react';

import { useUsers } from '@/hooks/admin/useUsers';
import { useDeleteUser } from '@/hooks/admin/useUserMutations';
import { useRoles } from '@/hooks/admin/useRoles';
import { useDeleteRole } from '@/hooks/admin/useRoleMutations';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import UserForm from '@/components/admin/UserForm';
import RoleForm from '@/components/admin/RoleForm';

function AdminDashboard() {
  const { t } = useTranslation('admin');

  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const deleteUser = useDeleteUser();
  const deleteRole = useDeleteRole();

  const [userFormOpen, setUserFormOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const roleNameById = useMemo(() => {
    const map = new Map();
    (roles ?? []).forEach((role) => map.set(role.id, role.role_name));
    return map;
  }, [roles]);

  const userColumns = useMemo(
    () => [
      {
        accessorKey: 'first_name',
        header: t('users.table.name'),
        cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
      },
      { accessorKey: 'email', header: t('users.table.email') },
      {
        accessorKey: 'role_id',
        header: t('users.table.role'),
        cell: ({ row }) => roleNameById.get(row.original.role_id) || '—',
      },
      {
        accessorKey: 'status',
        header: t('users.table.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'active' ? 'success' : 'secondary'}>{row.original.status}</Badge>
        ),
      },
      {
        id: 'actions',
        header: t('users.table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-space-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveUser(row.original);
                setUserFormOpen(true);
              }}
            >
              {t('common:actions.edit', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setUserToDelete(row.original)}>
              {t('common:actions.delete', { ns: 'common' })}
            </Button>
          </div>
        ),
      },
    ],
    [t, roleNameById]
  );

  const roleColumns = useMemo(
    () => [
      { accessorKey: 'role_name', header: t('roles.table.name') },
      {
        accessorKey: 'description',
        header: t('roles.table.description'),
        cell: ({ row }) => row.original.description || '—',
      },
      {
        accessorKey: 'permissions',
        header: t('roles.table.permissions'),
        cell: ({ row }) => t('roles.permissionCount', { count: row.original.permissions?.length ?? 0 }),
      },
      {
        id: 'actions',
        header: t('roles.table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-space-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveRole(row.original);
                setRoleFormOpen(true);
              }}
            >
              {t('common:actions.edit', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setRoleToDelete(row.original)}>
              {t('common:actions.delete', { ns: 'common' })}
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  const handleDeleteUser = async () => {
    try {
      await deleteUser.mutateAsync(userToDelete.id);
      toast.success(t('users.deleteConfirm.toastSuccess'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('users.deleteConfirm.toastError'));
      throw error; // keep the confirm dialog open so the message above is seen
    }
  };

  const handleDeleteRole = async () => {
    try {
      await deleteRole.mutateAsync(roleToDelete.id);
      toast.success(t('roles.deleteConfirm.toastSuccess'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('roles.deleteConfirm.toastError'));
      throw error;
    }
  };

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="h-4 w-4" />
            {t('tabs.users')}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setActiveUser(null);
              setUserFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('users.addButton')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={users}
            isLoading={usersLoading}
            emptyState={<EmptyState icon={UsersIcon} title={t('users.empty.title')} description={t('users.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            {t('tabs.roles')}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setActiveRole(null);
              setRoleFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('roles.addButton')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={roleColumns}
            data={roles}
            isLoading={rolesLoading}
            emptyState={<EmptyState icon={ShieldCheck} title={t('roles.empty.title')} description={t('roles.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeUser ? t('users.form.editTitle') : t('users.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <UserForm
            user={activeUser}
            roles={roles ?? []}
            onSaved={() => setUserFormOpen(false)}
            onCancel={() => setUserFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={roleFormOpen} onOpenChange={setRoleFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeRole ? t('roles.form.editTitle') : t('roles.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <RoleForm role={activeRole} onSaved={() => setRoleFormOpen(false)} onCancel={() => setRoleFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title={t('users.deleteConfirm.title')}
        description={t('users.deleteConfirm.description', { name: userToDelete ? `${userToDelete.first_name} ${userToDelete.last_name}` : '' })}
        confirmLabel={t('users.deleteConfirm.confirmLabel')}
        onConfirm={handleDeleteUser}
      />

      <ConfirmDialog
        open={Boolean(roleToDelete)}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        title={t('roles.deleteConfirm.title')}
        description={t('roles.deleteConfirm.description', { name: roleToDelete?.role_name || '' })}
        confirmLabel={t('roles.deleteConfirm.confirmLabel')}
        onConfirm={handleDeleteRole}
      />
    </div>
  );
}

export default AdminDashboard;
