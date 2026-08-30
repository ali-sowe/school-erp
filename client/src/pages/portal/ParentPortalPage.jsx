import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { useMyChildren } from '@/hooks/portal/useParentPortal';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';

function ParentPortalPage() {
  const { t } = useTranslation('portal');
  const navigate = useNavigate();
  const { data: children, isLoading } = useMyChildren();

  return (
    <div className="space-y-space-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('parent.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('parent.subtitle')}</p>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {!isLoading && (children ?? []).length === 0 && (
        <EmptyState title={t('parent.empty.title')} description={t('parent.empty.description')} />
      )}

      <div className="space-y-space-3">
        {(children ?? []).map((child) => (
          <Card
            key={child.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate(`/portal/parent/children/${child.id}`)}
          >
            <CardContent className="flex items-center justify-between pt-space-4">
              <div>
                <p className="font-medium">
                  {child.first_name} {child.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`parent.relationships.${child.relationship}`, child.relationship)}
                  {child.is_primary_contact ? ` · ${t('parent.primaryContact')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-space-2">
                <StatusBadge status={child.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ParentPortalPage;
