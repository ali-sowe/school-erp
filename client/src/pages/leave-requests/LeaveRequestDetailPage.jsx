import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { useLeaveRequest } from '@/hooks/leave-requests/useLeaveRequests';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/erp/StatusBadge';

// No decision actions here, same reasoning as ExpenseDetailPage — a leave
// request has no mutation of its own once submitted (see
// leave-request.service.js's own comment: the approval itself is the
// outcome, with no further executor). Approve/reject/cancel all happen on
// the linked approval request's own page.
function LeaveRequestDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('leave-requests');

  const { data: leaveRequest, isLoading, isError } = useLeaveRequest(id);

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !leaveRequest) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/leave-requests" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-6">
      <Link to="/leave-requests" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">{t(`form.leaveTypes.${leaveRequest.leave_type}`, leaveRequest.leave_type)}</CardTitle>
          <StatusBadge status={leaveRequest.status} />
        </CardHeader>
        <CardContent className="space-y-space-4">
          <dl className="grid gap-space-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.leaveTypeLabel')}</dt>
              <dd className="font-medium">{t(`form.leaveTypes.${leaveRequest.leave_type}`, leaveRequest.leave_type)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.datesLabel')}</dt>
              <dd className="font-medium">
                {leaveRequest.start_date?.slice(0, 10)} → {leaveRequest.end_date?.slice(0, 10)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">{t('detail.reasonLabel')}</dt>
              <dd className="font-medium">{leaveRequest.reason || t('detail.notSet')}</dd>
            </div>
          </dl>

          {leaveRequest.approval_request_id && (
            <div className="border-t pt-space-4">
              <p className="mb-space-2 text-sm text-muted-foreground">{t('detail.approvalLinkLabel')}</p>
              <Button variant="outline" asChild>
                <Link to={`/approvals/${leaveRequest.approval_request_id}`}>
                  <ExternalLink className="h-4 w-4" />
                  {t('detail.viewApprovalButton')}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LeaveRequestDetailPage;
