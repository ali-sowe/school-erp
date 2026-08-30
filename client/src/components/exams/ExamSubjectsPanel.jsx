import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

import { useExamSubjects, useAddExamSubject, useRemoveExamSubject } from '@/hooks/exams/useExamSubjects';
import { useSubjects } from '@/hooks/classes/useSubjects';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/erp/EmptyState';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// isScheduled gates the add/remove UI entirely — exam.service.js rejects
// both once the exam is ONGOING/COMPLETED (CANNOT_MODIFY_SUBJECTS_AFTER_START),
// so there's no point rendering controls that would just error on submit.
function ExamSubjectsPanel({ examId, isScheduled }) {
  const { t } = useTranslation('exams');

  const { data: examSubjects, isLoading } = useExamSubjects(examId);
  const { data: allSubjects } = useSubjects({ status: 'ACTIVE' });
  const addExamSubject = useAddExamSubject(examId);
  const removeExamSubject = useRemoveExamSubject(examId);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [removeTarget, setRemoveTarget] = useState(null);

  // Subjects already on this exam shouldn't be offered again — the
  // backend would reject a duplicate (SUBJECT_ALREADY_ADDED) anyway, but
  // filtering here avoids the user hitting that error at all.
  const alreadyAddedIds = new Set((examSubjects ?? []).map((row) => row.subject_id));
  const availableSubjects = (allSubjects ?? []).filter((subject) => !alreadyAddedIds.has(subject.id));

  const handleAdd = async () => {
    if (!selectedSubjectId) return;
    try {
      await addExamSubject.mutateAsync({ subjectId: Number(selectedSubjectId), maxScore: Number(maxScore) || 100 });
      toast.success(t('subjects.toasts.added'));
      setSelectedSubjectId('');
      setMaxScore('100');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('subjects.toasts.error'));
    }
  };

  const handleRemove = async () => {
    try {
      await removeExamSubject.mutateAsync(removeTarget);
      toast.success(t('subjects.toasts.removed'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('subjects.toasts.error'));
      throw error;
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-space-4">
      {!examSubjects || examSubjects.length === 0 ? (
        <EmptyState icon={BookOpen} title={t('subjects.empty')} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('subjects.columns.subject')}</TableHead>
              <TableHead>{t('subjects.columns.maxScore')}</TableHead>
              {isScheduled && <TableHead>{t('subjects.columns.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {examSubjects.map((row) => (
              <TableRow key={row.exam_subject_id}>
                <TableCell className="font-medium">
                  {row.name} <span className="text-muted-foreground">({row.code})</span>
                </TableCell>
                <TableCell>{row.max_score}</TableCell>
                {isScheduled && (
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => setRemoveTarget(row.subject_id)}>
                      {t('subjects.removeButton')}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isScheduled ? (
        <div className="flex flex-wrap items-end gap-space-2 border-t pt-space-4">
          <div className="w-56">
            <p className="mb-1 text-sm font-medium">{t('subjects.addSectionTitle')}</p>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder={t('subjects.chooseSubjectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <p className="mb-1 text-sm font-medium">{t('subjects.maxScoreLabel')}</p>
            <Input type="number" min="1" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
          </div>
          <Button onClick={handleAdd} disabled={!selectedSubjectId || addExamSubject.isPending}>
            {t('subjects.addButton')}
          </Button>
        </div>
      ) : (
        <Alert>
          <AlertDescription>{t('subjects.lockedNotice')}</AlertDescription>
        </Alert>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={t('subjects.confirmRemove.title')}
        description={t('subjects.confirmRemove.description')}
        confirmLabel={t('subjects.removeButton')}
        destructive
        onConfirm={handleRemove}
      />
    </div>
  );
}

export default ExamSubjectsPanel;
