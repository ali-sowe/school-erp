import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/hooks/exams/useExams';
import { useStartExam, useCompleteExam, useReopenExam } from '@/hooks/exams/useExamMutations';
import { useExamSubjects } from '@/hooks/exams/useExamSubjects';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import { cn } from '@/lib/utils';
import ExamEditForm from '@/components/exams/ExamEditForm';
import ExamSubjectsPanel from '@/components/exams/ExamSubjectsPanel';
import ExamResultsPanel from '@/components/exams/ExamResultsPanel';
import ExamSummaryPanel from '@/components/exams/ExamSummaryPanel';

const SECTIONS = ['subjects', 'results', 'summary'];

function ExamDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('exams');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('exams.write');

  const { data: exam, isLoading, isError } = useExam(id);
  const { data: examSubjects } = useExamSubjects(id);

  const startExam = useStartExam(id);
  const completeExam = useCompleteExam(id);
  const reopenExam = useReopenExam(id);

  const [activeSection, setActiveSection] = useState('subjects');
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenError, setReopenError] = useState('');

  const handleStart = async () => {
    try {
      await startExam.mutateAsync();
      toast.success(t('detail.toasts.started'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
      throw error;
    }
  };

  const handleComplete = async () => {
    try {
      await completeExam.mutateAsync();
      toast.success(t('detail.toasts.completed'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
      throw error;
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      setReopenError(t('detail.reopenDialog.reasonRequired'));
      return;
    }
    try {
      await reopenExam.mutateAsync({ reason: reopenReason.trim() });
      toast.success(t('detail.toasts.reopened'));
      setReopenDialogOpen(false);
      setReopenReason('');
      setReopenError('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('detail.toasts.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/exams" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  const isScheduled = exam.status === 'SCHEDULED';
  const isOngoing = exam.status === 'ONGOING';
  const isCompleted = exam.status === 'COMPLETED';

  return (
    <div className="space-y-space-6">
      <Link to="/exams" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">{exam.name}</CardTitle>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={exam.status} />
            {canWrite && isScheduled && (
              <Button variant="outline" onClick={() => setEditFormOpen(true)}>
                {t('detail.editButton')}
              </Button>
            )}
            {canWrite && isScheduled && <Button onClick={() => setConfirmStart(true)}>{t('detail.actions.start')}</Button>}
            {canWrite && isOngoing && <Button onClick={() => setConfirmComplete(true)}>{t('detail.actions.complete')}</Button>}
            {canWrite && isCompleted && (
              <Button variant="outline" onClick={() => setReopenDialogOpen(true)}>
                {t('detail.actions.reopen')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-space-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.typeLabel')}</dt>
              <dd className="font-medium">{exam.exam_type}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.plannedDatesLabel')}</dt>
              <dd className="font-medium">
                {exam.planned_start_date?.slice(0, 10)} → {exam.planned_end_date?.slice(0, 10)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('detail.actualDatesLabel')}</dt>
              <dd className="font-medium">
                {exam.actual_start_date ? exam.actual_start_date.slice(0, 10) : t('detail.notStarted')}
                {exam.actual_end_date ? ` → ${exam.actual_end_date.slice(0, 10)}` : ''}
              </dd>
            </div>
            {exam.reason && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('detail.reasonLabel')}</dt>
                <dd className="font-medium">{exam.reason}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex gap-space-2">
            {SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={cn(
                  'rounded-md px-space-3 py-space-2 text-sm font-medium transition-colors',
                  activeSection === section ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {t(`detail.tabs.${section}`)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeSection === 'subjects' && <ExamSubjectsPanel examId={exam.id} isScheduled={isScheduled} />}
          {activeSection === 'results' && (
            <ExamResultsPanel examId={exam.id} classId={exam.class_id} examSubjects={examSubjects} isOngoing={isOngoing} />
          )}
          {activeSection === 'summary' && <ExamSummaryPanel examId={exam.id} examSubjects={examSubjects} />}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmStart}
        onOpenChange={setConfirmStart}
        title={t('detail.confirmStart.title')}
        description={t('detail.confirmStart.description')}
        confirmLabel={t('detail.actions.start')}
        destructive={false}
        onConfirm={handleStart}
      />

      <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.editButton')}</DialogTitle>
          </DialogHeader>
          <ExamEditForm exam={exam} onSaved={() => setEditFormOpen(false)} onCancel={() => setEditFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title={t('detail.confirmComplete.title')}
        description={t('detail.confirmComplete.description')}
        confirmLabel={t('detail.actions.complete')}
        destructive={false}
        onConfirm={handleComplete}
      />

      <Dialog
        open={reopenDialogOpen}
        onOpenChange={(open) => {
          setReopenDialogOpen(open);
          if (!open) {
            setReopenReason('');
            setReopenError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.reopenDialog.title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('detail.reopenDialog.description')}</p>
          <Textarea
            value={reopenReason}
            onChange={(event) => setReopenReason(event.target.value)}
            placeholder={t('detail.reopenDialog.reasonPlaceholder')}
          />
          {reopenError && <p className="text-sm text-destructive">{reopenError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReopenDialogOpen(false)}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="button" onClick={handleReopen} disabled={reopenExam.isPending}>
              {reopenExam.isPending ? t('common:states.loading', { ns: 'common' }) : t('detail.reopenDialog.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExamDetailPage;
