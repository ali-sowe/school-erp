import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { 
  Users, 
  UserRound, 
  CalendarCheck2, 
  ClipboardList, 
  DollarSign, 
  Calendar, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardStats, useRecentActivity, useUpcomingEvents } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { cn } from '@/lib/utils';

// ----- Stat Card Component -----
function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'text-primary' }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-space-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trendLabel && (
          <div className="flex items-center gap-space-1 text-xs">
            <TrendIcon className={cn('h-3 w-3', trendColor)} />
            <span className={trendColor}>{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----- Pending Approvals Card -----
function PendingApprovalsCard({ approvals, isLoading, isError }) {
  const { t } = useTranslation('dashboard');

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-space-2 text-base">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            {t('sections.pendingApprovals')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-space-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-space-2 text-base">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            {t('sections.pendingApprovals')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{t('common:states.errorTitle')}</AlertTitle>
            <AlertDescription>{t('common:states.errorDescription')}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-space-2 text-base">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            {t('sections.pendingApprovals')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={t('empty.pendingApprovals', { defaultValue: 'No pending approvals' })}
            description={t('empty.pendingApprovalsDescription', { defaultValue: 'All requests have been reviewed.' })}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-space-2 text-base">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          {t('sections.pendingApprovals')}
          <span className="ml-auto text-xs bg-primary/10 text-primary px-space-2 py-0.5 rounded-full">
            {approvals.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-space-3">
          {approvals.slice(0, 5).map((request) => (
            <li key={request.id} className="flex items-center justify-between gap-space-2 text-sm">
              <span className="truncate font-medium">{request.title}</span>
              <StatusBadge status={request.status} />
            </li>
          ))}
        </ul>
      </CardContent>
      {approvals.length > 0 && (
        <CardFooter>
          <Link to="/approvals" className="text-sm text-muted-foreground hover:text-primary">
            {t('common:actions.viewAll')} →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

// ----- Recent Activity Card -----
function RecentActivityCard({ activities, isLoading, isError }) {
  const { t } = useTranslation('dashboard');

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-space-2 text-base">
            <Activity className="h-5 w-5 text-muted-foreground" />
            {t('sections.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-space-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-space-2 text-base">
            <Activity className="h-5 w-5 text-muted-foreground" />
            {t('sections.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{t('common:states.errorTitle')}</AlertTitle>
            <AlertDescription>{t('common:states.errorDescription')}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-space-2 text-base">
            <Activity className="h-5 w-5 text-muted-foreground" />
            {t('sections.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No recent activity"
            description="Activity will appear here as actions are performed."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-space-2 text-base">
          <Activity className="h-5 w-5 text-muted-foreground" />
          {t('sections.recentActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-space-2">
          {activities.slice(0, 5).map((activity) => (
            <li key={activity.id} className="flex items-center gap-space-2 text-sm">
              <span className="text-muted-foreground text-xs">{activity.timestamp}</span>
              <span className="truncate">{activity.description}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ----- Main Dashboard Component -----
function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading, isError: activitiesError } = useRecentActivity();
  const { data: upcoming, isLoading: upcomingLoading, isError: upcomingError } = useUpcomingEvents();

  // Stats cards data (from real API)
  const statCards = stats ? [
    { key: 'students', title: t('sections.students'), value: stats.studentCount, icon: Users, color: 'text-blue-500' },
    { key: 'staff', title: t('sections.staff'), value: stats.staffCount, icon: UserRound, color: 'text-purple-500' },
    { key: 'attendance', title: t('sections.todayAttendance'), value: `${stats.attendanceRate}%`, icon: CalendarCheck2, color: 'text-green-500' },
    { key: 'pending', title: t('sections.pendingApprovals'), value: stats.pendingApprovals, icon: ClipboardList, color: 'text-orange-500' },
  ] : [];

  // Upcoming events (exams, etc.)
  const upcomingItems = upcoming || [];

  return (
    <div className="space-y-space-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('greeting', { name: user?.first_name || 'Admin' })}
        </h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats Grid - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 gap-space-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          // Loading skeletons for stats
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-space-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : statsError ? (
          <div className="col-span-full">
            <Alert variant="destructive">
              <AlertTitle>Error loading dashboard stats</AlertTitle>
              <AlertDescription>Please refresh the page or try again later.</AlertDescription>
            </Alert>
          </div>
        ) : (
          statCards.map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
            />
          ))
        )}
      </div>

      {/* Two-column layout: approvals + upcoming, and activity */}
      <div className="grid grid-cols-1 gap-space-4 lg:grid-cols-3">
        {/* Pending Approvals - takes 2/3 of the row on desktop */}
        <div className="lg:col-span-2">
          <PendingApprovalsCard 
            approvals={stats?.pendingApprovalList || []} 
            isLoading={statsLoading} 
            isError={statsError} 
          />
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-space-2 text-base">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                {t('sections.upcomingExams')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingLoading && (
                <div className="space-y-space-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {upcomingError && (
                <Alert variant="destructive">
                  <AlertTitle>{t('common:states.errorTitle')}</AlertTitle>
                  <AlertDescription>{t('common:states.errorDescription')}</AlertDescription>
                </Alert>
              )}
              {!upcomingLoading && !upcomingError && upcomingItems.length === 0 && (
                <EmptyState
                  title="No upcoming events"
                  description="No exams or events scheduled in the near future."
                />
              )}
              {!upcomingLoading && !upcomingError && upcomingItems.length > 0 && (
                <ul className="space-y-space-3">
                  {upcomingItems.slice(0, 5).map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-space-2 text-sm">
                      <span className="truncate font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {event.date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity - full width */}
      <div>
        <RecentActivityCard 
          activities={activities || []} 
          isLoading={activitiesLoading} 
          isError={activitiesError} 
        />
      </div>
    </div>
  );
}

export default DashboardPage;