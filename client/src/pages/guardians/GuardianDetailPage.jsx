import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, KeyRound, Users } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useGuardian } from '@/hooks/guardians/useGuardians';
import { useGuardianStudents } from '@/hooks/guardians/useGuardianStudents';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { EmptyState } from '@/components/erp/EmptyState';
import GuardianForm from '@/components/guardians/GuardianForm';
import GuardianPortalAccountForm from '@/components/guardians/GuardianPortalAccountForm';

function GuardianDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('guardians');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('guardians.write');

  const { data: guardian, isLoading, isError } = useGuardian(id);
  const { data: students, isLoading: studentsLoading } = useGuardianStudents(id);

  const [editing, setEditing] = useState(false);
  const [portalFormOpen, setPortalFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !guardian) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/guardians" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-6">
      <Link to="/guardians" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">
            {guardian.first_name} {guardian.last_name}
          </CardTitle>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={guardian.status} />
            {canWrite && guardian.status !== 'ARCHIVED' && (
              <Button variant="outline" size="sm" onClick={() => setEditing((current) => !current)}>
                {editing ? t('detail.cancelButton') : t('detail.editButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <GuardianForm guardian={guardian} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
          ) : (
            <dl className="grid gap-space-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.phoneLabel')}</dt>
                <dd className="font-medium">{guardian.phone || t('detail.notProvided')}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.emailLabel')}</dt>
                <dd className="font-medium">{guardian.email || t('detail.notProvided')}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.addressLabel')}</dt>
                <dd className="font-medium">{guardian.address || t('detail.notProvided')}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.occupationLabel')}</dt>
                <dd className="font-medium">{guardian.occupation || t('detail.notProvided')}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-space-2 text-base">
            <KeyRound className="h-4 w-4" />
            {t('portal.sectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-space-3">
          <p className="text-sm text-muted-foreground">
            {guardian.user_id ? t('portal.hasAccountDescription') : t('portal.noAccountDescription')}
          </p>
          {canWrite && !guardian.user_id && (
            <Button size="sm" onClick={() => setPortalFormOpen(true)}>
              {t('portal.grantButton')}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('students.sectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-space-2">
          {!studentsLoading && (!students || students.length === 0) && (
            <EmptyState icon={Users} title={t('students.empty')} description={t('students.linkFromStudentHint')} />
          )}
          {students?.map((student) => (
            <Link
              key={student.id}
              to={`/students/${student.id}`}
              className="flex items-center justify-between rounded-md border p-space-3 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">
                {student.first_name} {student.last_name}
              </span>
              <span className="text-muted-foreground">{student.admission_number}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Dialog open={portalFormOpen} onOpenChange={setPortalFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('portal.grantButton')}</DialogTitle>
          </DialogHeader>
          <GuardianPortalAccountForm
            guardianId={guardian.id}
            onSaved={() => setPortalFormOpen(false)}
            onCancel={() => setPortalFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GuardianDetailPage;
