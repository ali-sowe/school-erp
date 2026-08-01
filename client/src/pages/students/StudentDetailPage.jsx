import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useStudent } from '@/hooks/students/useStudents';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/erp/StatusBadge';
import StudentForm from '@/components/students/StudentForm';
import GuardianLinkPanel from '@/components/students/GuardianLinkPanel';
import EnrollmentPanel from '@/components/students/EnrollmentPanel';
import StudentAttendancePanel from '@/components/attendance/StudentAttendancePanel';
import StudentBorrowHistoryPanel from '@/components/library/StudentBorrowHistoryPanel';

function StudentDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('students');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('students.write');
  const canViewAttendance = hasPermission('attendance.read');
  const canViewLibrary = hasPermission('library.read');

  const { data: student, isLoading, isError } = useStudent(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{t('common:states.errorDescription', { ns: 'common' })}</AlertDescription>
        </Alert>
        <Link to="/students" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-6">
      <Link to="/students" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">{student.admission_number}</p>
            <CardTitle className="text-2xl">
              {student.first_name} {student.last_name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={student.status} />
            {canWrite && student.status !== 'ARCHIVED' && (
              <Button variant="outline" size="sm" onClick={() => setEditing((current) => !current)}>
                {editing ? t('detail.cancelButton') : t('detail.editButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <StudentForm student={student} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
          ) : (
            <dl className="grid gap-space-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.genderLabel')}</dt>
                <dd className="font-medium">{student.gender || t('detail.notSpecified')}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.dateOfBirthLabel')}</dt>
                <dd className="font-medium">{student.date_of_birth ? student.date_of_birth.slice(0, 10) : t('detail.notSpecified')}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.admissionDateLabel')}</dt>
                <dd className="font-medium">{student.admission_date ? student.admission_date.slice(0, 10) : '—'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <GuardianLinkPanel studentId={student.id} canWrite={canWrite} />
      <EnrollmentPanel studentId={student.id} canWrite={canWrite} />
      {/* StudentAttendancePanel was migrated to the new stack along with
          the rest of the Attendance module — reused here as-is. */}
      {canViewAttendance && <StudentAttendancePanel studentId={student.id} />}
      {canViewLibrary && <StudentBorrowHistoryPanel studentId={student.id} />}
    </div>
  );
}

export default StudentDetailPage;
