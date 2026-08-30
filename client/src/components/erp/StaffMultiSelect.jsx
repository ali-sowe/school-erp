import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/admin/useUsers';
import { useAuth } from '@/context/AuthContext';

// Same grouped-checkbox-list pattern as RoleForm's permissions editor,
// rather than a search-as-you-type combobox — consistent with every other
// selector in this app (ClassSelector, TeacherSelector, StudentSelector all
// made the same "plain list, no combobox component yet" choice).
function StaffMultiSelect({ value, onChange }) {
  const { t } = useTranslation('communication');
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();

  const selectableUsers = (users ?? []).filter((candidate) => candidate.id !== currentUser?.id);

  const toggle = (userId, checked) => {
    const next = checked ? [...new Set([...value, userId])] : value.filter((id) => id !== userId);
    onChange(next);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('common:states.loading', { ns: 'common' })}</p>;
  }

  return (
    <div className="max-h-60 space-y-space-2 overflow-y-auto rounded-md border p-space-4">
      {selectableUsers.map((candidate) => (
        <label key={candidate.id} className="flex items-center gap-space-2 text-sm">
          <Checkbox checked={value.includes(candidate.id)} onCheckedChange={(checked) => toggle(candidate.id, checked)} />
          <span>
            {candidate.first_name} {candidate.last_name}
          </span>
        </label>
      ))}
    </div>
  );
}

export { StaffMultiSelect };
