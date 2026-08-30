import { useTranslation } from 'react-i18next';

import { useStudentExamResults } from '@/hooks/students/useStudentExamResults';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';

// Staff-facing grade history for one student, across every exam — the
// counterpart to the portal's own GradesSection, gated on exams.read
// instead of a portal permission. Same findForStudent query server-side
// (exam_name/exam_type/subject_name all already joined there).
function StudentGradesPanel({ studentId }) {
  const { t } = useTranslation('students');
  const { data: results, isLoading } = useStudentExamResults(studentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('grades.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-space-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!isLoading && (!results || results.length === 0) && <EmptyState title={t('grades.empty')} />}

        {!isLoading && results && results.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('grades.columns.exam')}</TableHead>
                  <TableHead>{t('grades.columns.subject')}</TableHead>
                  <TableHead className="text-right">{t('grades.columns.score')}</TableHead>
                  <TableHead>{t('grades.columns.remarks')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      {result.exam_name}
                      <span className="ml-space-2 text-xs text-muted-foreground">{result.exam_type}</span>
                    </TableCell>
                    <TableCell>{result.subject_name}</TableCell>
                    <TableCell className="text-right">
                      {result.score} / {result.max_score}
                    </TableCell>
                    <TableCell>{result.remarks || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StudentGradesPanel;
