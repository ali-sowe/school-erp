import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useClassRoster } from '@/hooks/shared/useClassRoster';
import { useExamResultsForSubject, useRecordExamResults } from '@/hooks/exams/useExamResults';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Unlike attendance's findRosterWithAttendance, there's no single backend
// endpoint that joins "this class's roster" with "this exam+subject's
// results" — exam_results just stores raw student_id (see
// exam-result.repository.js's findForExam). So the merge happens here:
// roster is the source of truth for who to show a row for, results fill in
// any row that already has a score.
function ExamResultsPanel({ examId, classId, examSubjects, isOngoing }) {
  const { t } = useTranslation('exams');

  const [subjectId, setSubjectId] = useState('');

  const { data: roster, isLoading: rosterLoading } = useClassRoster(classId);
  const { data: results, isLoading: resultsLoading } = useExamResultsForSubject(examId, subjectId);
  const recordResults = useRecordExamResults(examId);

  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!roster) return;

    const resultsByStudentId = new Map((results ?? []).map((result) => [result.student_id, result]));

    setRows(
      roster.map((student) => {
        const existing = resultsByStudentId.get(student.id);
        return {
          student_id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          admission_number: student.admission_number,
          // existing.score is a string (DECIMAL column) — kept as a string
          // here too, since it only ever round-trips through a text input.
          score: existing ? String(existing.score) : '',
          remarks: existing?.remarks || '',
        };
      })
    );
  }, [roster, results]);

  const updateRow = (studentId, field, value) => {
    setRows((current) => current.map((row) => (row.student_id === studentId ? { ...row, [field]: value } : row)));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const entries = rows
      .filter((row) => row.score !== '')
      .map((row) => ({
        student_id: row.student_id,
        score: Number(row.score),
        remarks: row.remarks || undefined,
      }));

    if (entries.length === 0) return;

    try {
      await recordResults.mutateAsync({ subjectId: Number(subjectId), entries });
      toast.success(t('results.toasts.saved'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('results.toasts.error'));
    }
  };

  const selectedExamSubject = (examSubjects ?? []).find((row) => String(row.subject_id) === subjectId);

  return (
    <div className="space-y-space-4">
      <div className="w-64">
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder={t('subjects.chooseSubjectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {(examSubjects ?? []).map((row) => (
              <SelectItem key={row.subject_id} value={String(row.subject_id)}>
                {row.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!subjectId ? (
        <p className="text-sm text-muted-foreground">{t('results.chooseSubjectPrompt')}</p>
      ) : !isOngoing ? (
        <Alert>
          <AlertDescription>{t('results.notOngoingNotice')}</AlertDescription>
        </Alert>
      ) : rosterLoading || resultsLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState title={t('results.empty')} />
      ) : (
        <form onSubmit={handleSave} className="space-y-space-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('results.columns.student')}</TableHead>
                  <TableHead>{t('results.columns.admissionNumber')}</TableHead>
                  <TableHead>
                    {t('results.columns.score')} / {selectedExamSubject?.max_score}
                  </TableHead>
                  <TableHead>{t('results.columns.remarks')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.student_id}>
                    <TableCell className="font-medium">
                      {row.first_name} {row.last_name}
                    </TableCell>
                    <TableCell>{row.admission_number}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={selectedExamSubject?.max_score}
                        step="0.01"
                        className="w-24"
                        value={row.score}
                        onChange={(event) => updateRow(row.student_id, 'score', event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.remarks}
                        onChange={(event) => updateRow(row.student_id, 'remarks', event.target.value)}
                        placeholder={t('results.remarksPlaceholder')}
                        className="min-w-48"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button type="submit" disabled={recordResults.isPending}>
            {recordResults.isPending ? t('common:states.loading', { ns: 'common' }) : t('results.saveButton')}
          </Button>
        </form>
      )}
    </div>
  );
}

export default ExamResultsPanel;
