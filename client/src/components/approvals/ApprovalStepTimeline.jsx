import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useUsers } from '@/hooks/admin/useUsers';
import { StatusBadge } from '@/components/erp/StatusBadge';

function ApprovalStepTimeline({ steps }) {
  const { t } = useTranslation('approvals');
  const { data: users } = useUsers();

  const nameById = useMemo(
    () => new Map((users ?? []).map((user) => [user.id, `${user.first_name} ${user.last_name}`])),
    [users]
  );

  return (
    <ol className="space-y-space-3">
      {steps.map((step) => (
        <li key={step.id} className="rounded-md border p-space-3">
          <div className="flex items-center justify-between gap-space-2">
            <p className="text-sm font-medium">
              {t('detail.stepsTitle')} {step.step_number}:{' '}
              {step.approver_user_id
                ? t('detail.step.assignedToUser', { name: nameById.get(step.approver_user_id) || `#${step.approver_user_id}` })
                : t('detail.step.assignedToRole', { role: step.approver_role_name })}
            </p>
            <StatusBadge status={step.status} />
          </div>
          {step.decided_by && (
            <p className="mt-space-2 text-sm text-muted-foreground">
              {t('detail.step.decidedBy', { name: nameById.get(step.decided_by) || `#${step.decided_by}` })}
              {step.decided_at ? ` · ${step.decided_at.slice(0, 10)}` : ''}
            </p>
          )}
          {step.decided_by && <p className="text-sm">{step.comment || t('detail.step.noComment')}</p>}
        </li>
      ))}
    </ol>
  );
}

export default ApprovalStepTimeline;
