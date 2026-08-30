import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useClass } from '@/hooks/shared/useClasses';
import { useGradeLevels } from '@/hooks/classes/useGradeLevels';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/erp/StatusBadge';
import ClassForm from '@/components/classes/ClassForm';
import ClassRosterPanel from '@/components/classes/ClassRosterPanel';
import ClassSubjectsPanel from '@/components/classes/ClassSubjectsPanel';
import ClassTeachersPanel from '@/components/classes/ClassTeachersPanel';

function ClassDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('classes');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('classes.write');

  const { data: classItem, isLoading, isError } = useClass(id);
  const { data: gradeLevels } = useGradeLevels();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !classItem) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/classes" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  const gradeLevelName = gradeLevels?.find((gradeLevel) => gradeLevel.id === classItem.grade_level_id)?.name;

  return (
    <div className="space-y-space-6">
      <Link to="/classes" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">{classItem.name}</CardTitle>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={classItem.status} />
            {canWrite && classItem.status !== 'ARCHIVED' && (
              <Button variant="outline" size="sm" onClick={() => setEditing((current) => !current)}>
                {editing ? t('detail.cancelButton') : t('detail.editButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <ClassForm classItem={classItem} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
          ) : (
            <dl className="grid gap-space-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.gradeLevelLabel')}</dt>
                <dd className="font-medium">{gradeLevelName || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.capacityLabel')}</dt>
                <dd className="font-medium">{classItem.capacity ?? t('detail.notSet')}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <ClassRosterPanel classId={classItem.id} />
      <ClassSubjectsPanel classId={classItem.id} canWrite={canWrite} />
      <ClassTeachersPanel classId={classItem.id} canWrite={canWrite} />
    </div>
  );
}

export default ClassDetailPage;
