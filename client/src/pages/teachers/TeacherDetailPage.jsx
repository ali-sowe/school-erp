import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useTeacher } from '@/hooks/teachers/useTeachers';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/erp/StatusBadge';
import TeacherForm from '@/components/teachers/TeacherForm';
import TeacherAssignmentsPanel from '@/components/teachers/TeacherAssignmentsPanel';

function TeacherDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('teachers');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('teachers.write');

  const { data: teacher, isLoading, isError } = useTeacher(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !teacher) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/teachers" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-6">
      <Link to="/teachers" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">
            {teacher.first_name} {teacher.last_name}
          </CardTitle>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={teacher.status} />
            {canWrite && teacher.status !== 'ARCHIVED' && (
              <Button variant="outline" size="sm" onClick={() => setEditing((current) => !current)}>
                {editing ? t('detail.cancelButton') : t('detail.editButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <TeacherForm teacher={teacher} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
          ) : (
            <dl className="grid gap-space-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.employeeNumberLabel')}</dt>
                <dd className="font-medium">{teacher.employee_number || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.emailLabel')}</dt>
                <dd className="font-medium">{teacher.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.qualificationLabel')}</dt>
                <dd className="font-medium">{teacher.qualification || t('detail.notSet')}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.specializationLabel')}</dt>
                <dd className="font-medium">{teacher.specialization || t('detail.notSet')}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.hireDateLabel')}</dt>
                <dd className="font-medium">{teacher.hire_date ? teacher.hire_date.slice(0, 10) : t('detail.notSet')}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <TeacherAssignmentsPanel teacherId={teacher.id} />
    </div>
  );
}

export default TeacherDetailPage;
