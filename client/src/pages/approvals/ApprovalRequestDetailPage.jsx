import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useApprovalRequest } from '@/hooks/approvals/useApprovalRequests';
import { useApproveStep, useRejectStep, useExecuteRequest, useCancelRequest } from '@/hooks/approvals/useApprovalMutations';
import { useUsers } from '@/hooks/admin/useUsers';
import { getWorkflowTypeLabel, getEntityLink } from '@/lib/workflowTypeLabels';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/erp/StatusBadge';
import ApprovalStepTimeline from '@/components/approvals/ApprovalStepTimeline';
import DecisionDialog from '@/components/approvals/DecisionDialog';

function ApprovalRequestDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('approvals');
  const { user } = useAuth();

  const { data: request, isLoading, isError } = useApprovalRequest(id);
  const { data: users } = useUsers();

  const approveStep = useApproveStep(id);
  const rejectStep = useRejectStep(id);
  const executeRequest = useExecuteRequest(id);
  const cancelRequest = useCancelRequest(id);

  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | 'execute' | 'cancel' | null

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/approvals" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  const requesterName = (users ?? []).find((candidate) => candidate.id === request.requested_by);
  const requesterLabel = requesterName ? `${requesterName.first_name} ${requesterName.last_name}` : `#${request.requested_by}`;
  const entityLink = getEntityLink(request.entity_type, request.entity_id);
  const isRequester = request.requested_by === user?.id;

  // Client-side hints only, for which buttons to show — the backend is the
  // actual enforcer of all of this (see approval.service.js's own
  // belt-and-suspenders checks), so a stale hint here can at worst show a
  // button that then surfaces a clear error, never a security gap.
  const currentStep = request.steps?.find((step) => step.status === 'PENDING');
  const isEligibleApprover =
    currentStep && !isRequester && (currentStep.approver_user_id === user?.id || currentStep.approver_role_name === user?.role_name);

  const canDecide = request.status === 'PENDING_REVIEW' && isEligibleApprover;
  const canExecute = request.status === 'APPROVED' && isRequester;
  const canCancel = request.status === 'PENDING_REVIEW' && isRequester;

  const handleApprove = async (comment) => {
    try {
      await approveStep.mutateAsync(comment);
      toast.success(t('detail.toasts.approved'));
      setDialog(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
    }
  };

  const handleReject = async (comment) => {
    try {
      await rejectStep.mutateAsync(comment);
      toast.success(t('detail.toasts.rejected'));
      setDialog(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
    }
  };

  const handleExecute = async (note) => {
    try {
      await executeRequest.mutateAsync(note);
      toast.success(t('detail.toasts.executed'));
      setDialog(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
    }
  };

  const handleCancel = async (reason) => {
    try {
      await cancelRequest.mutateAsync(reason);
      toast.success(t('detail.toasts.cancelled'));
      setDialog(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
    }
  };

  return (
    <div className="space-y-space-6">
      <Link to="/approvals" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">{getWorkflowTypeLabel(request.workflow_type)}</p>
            <CardTitle className="text-2xl">{request.title}</CardTitle>
          </div>
          <StatusBadge status={request.status} />
        </CardHeader>
        <CardContent className="space-y-space-4">
          {request.description && <p>{request.description}</p>}

          <dl className="grid gap-space-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.requestedByLabel')}</dt>
              <dd className="font-medium">{requesterLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.requestedAtLabel')}</dt>
              <dd className="font-medium">{request.created_at?.slice(0, 10)}</dd>
            </div>
            {request.entity_type && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.relatedRecordLabel')}</dt>
                <dd className="font-medium">
                  {entityLink ? (
                    <Link to={entityLink} className="text-primary hover:underline">
                      {request.entity_type} #{request.entity_id}
                    </Link>
                  ) : (
                    `${request.entity_type} #${request.entity_id}`
                  )}
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap gap-space-2">
            {canDecide && (
              <>
                <Button onClick={() => setDialog('approve')}>{t('detail.actions.approve')}</Button>
                <Button variant="destructive" onClick={() => setDialog('reject')}>
                  {t('detail.actions.reject')}
                </Button>
              </>
            )}
            {canExecute && <Button onClick={() => setDialog('execute')}>{t('detail.actions.execute')}</Button>}
            {canCancel && (
              <Button variant="outline" onClick={() => setDialog('cancel')}>
                {t('detail.actions.cancel')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('detail.stepsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalStepTimeline steps={request.steps ?? []} />
        </CardContent>
      </Card>

      <DecisionDialog
        open={dialog === 'approve'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t('detail.approveDialog.title')}
        description={t('detail.approveDialog.description')}
        fieldLabel={t('detail.approveDialog.commentLabel')}
        fieldRequired={false}
        submitLabel={t('detail.actions.approve')}
        isPending={approveStep.isPending}
        onConfirm={handleApprove}
      />

      <DecisionDialog
        open={dialog === 'reject'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t('detail.rejectDialog.title')}
        description={t('detail.rejectDialog.description')}
        fieldLabel={t('detail.rejectDialog.commentLabel')}
        fieldRequired
        requiredError={t('detail.rejectDialog.commentRequired')}
        submitLabel={t('detail.actions.reject')}
        destructive
        isPending={rejectStep.isPending}
        onConfirm={handleReject}
      />

      <DecisionDialog
        open={dialog === 'execute'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t('detail.executeDialog.title')}
        description={t('detail.executeDialog.description')}
        fieldLabel={t('detail.executeDialog.noteLabel')}
        fieldRequired={false}
        submitLabel={t('detail.actions.execute')}
        isPending={executeRequest.isPending}
        onConfirm={handleExecute}
      />

      <DecisionDialog
        open={dialog === 'cancel'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t('detail.cancelDialog.title')}
        description={t('detail.cancelDialog.description')}
        fieldLabel={t('detail.cancelDialog.reasonLabel')}
        fieldRequired
        requiredError={t('detail.cancelDialog.reasonRequired')}
        submitLabel={t('detail.actions.cancel')}
        destructive
        isPending={cancelRequest.isPending}
        onConfirm={handleCancel}
      />
    </div>
  );
}

export default ApprovalRequestDetailPage;
