import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';

import { useStudentEnrollments, useEnrollStudent, useTransferStudent, useWithdrawStudent, useCompleteEnrollment } from '@/hooks/students/useStudentEnrollments';
import { useClasses } from '@/hooks/shared/useClasses';
import { useAcademicYears } from '@/hooks/shared/useAcademicYears';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClassSelector } from '@/components/erp/ClassSelector';
import { AcademicYearSelector } from '@/components/erp/AcademicYearSelector';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';

// student_enrollments only stores class_id/academic_year_id, so this panel
// resolves names client-side from the shared classes/academic-years lookups
// rather than adding a join the repository doesn't already do.
function EnrollmentPanel({ studentId, canWrite }) {
  const { t } = useTranslation('students');

  const { data: history, isLoading } = useStudentEnrollments(studentId);
  const { data: classes } = useClasses();
  const { data: academicYears } = useAcademicYears();

  const enrollStudent = useEnrollStudent(studentId);
  const transferStudent = useTransferStudent(studentId);
  const withdrawStudent = useWithdrawStudent(studentId);
  const completeEnrollment = useCompleteEnrollment(studentId);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [classId, setClassId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [enrolledDate, setEnrolledDate] = useState('');

  const [transferState, setTransferState] = useState(null); // { enrollmentId, classId }
  const [withdrawState, setWithdrawState] = useState(null); // { enrollmentId, reason }
  const [confirmWithdrawId, setConfirmWithdrawId] = useState(null);

  const classNameFor = (id) => classes?.find((item) => item.id === id)?.name || `Class #${id}`;
  const yearNameFor = (id) => academicYears?.find((item) => item.id === id)?.name || `Year #${id}`;

  const handleEnroll = async (event) => {
    event.preventDefault();
    if (!classId) {
      toast.error(t('enrollment.toasts.classRequired'));
      return;
    }
    try {
      const payload = { class_id: Number(classId) };
      if (academicYearId) payload.academic_year_id = Number(academicYearId);
      if (enrolledDate) payload.enrolled_date = enrolledDate;
      await enrollStudent.mutateAsync(payload);
      toast.success(t('enrollment.toasts.enrolled'));
      setEnrollOpen(false);
      setClassId('');
      setAcademicYearId('');
      setEnrolledDate('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('enrollment.toasts.error'));
    }
  };

  const handleTransfer = async (enrollmentId) => {
    if (!transferState?.classId) {
      toast.error(t('enrollment.toasts.classRequired'));
      return;
    }
    try {
      await transferStudent.mutateAsync({ enrollmentId, classId: Number(transferState.classId) });
      toast.success(t('enrollment.toasts.transferred'));
      setTransferState(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('enrollment.toasts.error'));
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdrawStudent.mutateAsync({ enrollmentId: confirmWithdrawId, reason: withdrawState?.reason || undefined });
      toast.success(t('enrollment.toasts.withdrawn'));
      setWithdrawState(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('enrollment.toasts.error'));
      throw error;
    }
  };

  const handleComplete = async (enrollmentId) => {
    try {
      await completeEnrollment.mutateAsync({ enrollmentId });
      toast.success(t('enrollment.toasts.completed'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('enrollment.toasts.error'));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('enrollment.sectionTitle')}</CardTitle>
        {canWrite && <Button size="sm" onClick={() => setEnrollOpen(true)}>{t('enrollment.enrolButton')}</Button>}
      </CardHeader>
      <CardContent className="space-y-space-3">
        {!isLoading && (!history || history.length === 0) && (
          <EmptyState icon={CalendarClock} title={t('enrollment.empty')} />
        )}

        {history?.map((enrollment) => (
          <div key={enrollment.id} className="rounded-md border p-space-3 space-y-space-2">
            <div className="flex items-center justify-between gap-space-2">
              <div>
                <p className="font-medium">{yearNameFor(enrollment.academic_year_id)}</p>
                <p className="text-sm text-muted-foreground">
                  {classNameFor(enrollment.class_id)} · {t('enrollment.enrolledDateLabel').toLowerCase()} {enrollment.enrolled_date}
                  {enrollment.reason ? ` · ${enrollment.reason}` : ''}
                </p>
              </div>
              <StatusBadge status={enrollment.status} />
            </div>

            {canWrite && enrollment.status === 'ACTIVE' && (
              <div className="flex flex-wrap items-end gap-space-2 border-t pt-space-2">
                <div className="w-48 space-y-1">
                  <p className="text-xs text-muted-foreground">{t('enrollment.transferToLabel')}</p>
                  <ClassSelector
                    value={transferState?.enrollmentId === enrollment.id ? transferState.classId : ''}
                    onChange={(value) => setTransferState({ enrollmentId: enrollment.id, classId: value })}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTransfer(enrollment.id)}
                  disabled={transferState?.enrollmentId !== enrollment.id || !transferState?.classId}
                >
                  {t('enrollment.transferButton')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleComplete(enrollment.id)}>
                  {t('enrollment.markCompletedButton')}
                </Button>

                <div className="w-56 space-y-1">
                  <p className="text-xs text-muted-foreground">{t('enrollment.withdrawReasonLabel')}</p>
                  <Input
                    value={withdrawState?.enrollmentId === enrollment.id ? withdrawState.reason : ''}
                    onChange={(event) => setWithdrawState({ enrollmentId: enrollment.id, reason: event.target.value })}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmWithdrawId(enrollment.id)}
                >
                  {t('enrollment.withdrawButton')}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('enrollment.enrolButton')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-space-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('enrollment.classLabel')}</p>
              <ClassSelector value={classId} onChange={setClassId} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('enrollment.academicYearLabel')}</p>
              <AcademicYearSelector value={academicYearId} onChange={setAcademicYearId} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('enrollment.enrolledDateLabel')}</p>
              <Input type="date" value={enrolledDate} onChange={(event) => setEnrolledDate(event.target.value)} placeholder={t('enrollment.enrolledDatePlaceholder')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEnrollOpen(false)}>
                {t('enrollment.cancelButton')}
              </Button>
              <Button type="submit" disabled={enrollStudent.isPending}>
                {t('enrollment.submitButton')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmWithdrawId)}
        onOpenChange={(open) => !open && setConfirmWithdrawId(null)}
        title={t('enrollment.confirmWithdraw.title')}
        description={t('enrollment.confirmWithdraw.description')}
        confirmLabel={t('enrollment.withdrawButton')}
        onConfirm={handleWithdraw}
      />
    </Card>
  );
}

export default EnrollmentPanel;
