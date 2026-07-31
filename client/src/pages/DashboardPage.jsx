import { useTranslation } from 'react-i18next';
import { ClipboardList, Sparkles } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useMyPendingApprovals } from '@/hooks/useMyPendingApprovals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';

// Placeholder sections from the Frontend UX Principles doc's recommended
// dashboard list that don't have a wired query yet (each needs either a
// dedicated backend summary endpoint, or a resolved academic-year context
// this page doesn't have — see the comment on each card below). Left as
// clearly-labeled empty states rather than guessed-at numbers.
const PLACEHOLDER_SECTIONS = ['todayAttendance', 'feeCollection', 'upcomingExams', 'recentActivity'];

function PendingApprovalsCard() {
  const { t } = useTranslation('dashboard');
  const { data: approvals, isLoading, isError } = useMyPendingApprovals();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4" />
          {t('sections.pendingApprovals')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
            <AlertDescription>{t('common:states.errorDescription', { ns: 'common' })}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && approvals?.length === 0 && (
          <EmptyState icon={Sparkles} title={t('empty.pendingApprovals')} />
        )}

        {!isLoading && !isError && approvals?.length > 0 && (
          <ul className="space-y-3">
            {approvals.map((request) => (
              <li key={request.id} className="flex items-center justify-between gap-3 rounded-sm border p-space-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{request.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{request.workflow_type}</p>
                </div>
                <StatusBadge status={request.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PlaceholderCard({ sectionKey }) {
  const { t } = useTranslation('dashboard');
  const title = t(`sections.${sectionKey}`);
  const emptyCopy = t(`empty.${sectionKey}`, { defaultValue: null });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Not wired up yet — this card is a placeholder for the next frontend pass.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title={emptyCopy || 'No data source connected yet.'} />
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('greeting', { name: user?.first_name || '' })}
        </h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-space-4 sm:grid-cols-2 lg:grid-cols-3">
        <PendingApprovalsCard />
        {PLACEHOLDER_SECTIONS.map((sectionKey) => (
          <PlaceholderCard key={sectionKey} sectionKey={sectionKey} />
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
