import { useTranslation } from 'react-i18next';

import { useExamSummary } from '@/hooks/exams/useExamResults';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';

function formatScore(value) {
  return value === null || value === undefined ? '—' : Number(value).toFixed(1);
}

function ExamSummaryPanel({ examId, examSubjects }) {
  const { t } = useTranslation('exams');
  const { data: summary, isLoading } = useExamSummary(examId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!summary || summary.length === 0) {
    return <EmptyState title={t('summary.empty')} />;
  }

  const subjectNameById = new Map((examSubjects ?? []).map((row) => [row.subject_id, row.name]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('summary.columns.subject')}</TableHead>
          <TableHead>{t('summary.columns.resultsRecorded')}</TableHead>
          <TableHead>{t('summary.columns.average')}</TableHead>
          <TableHead>{t('summary.columns.lowest')}</TableHead>
          <TableHead>{t('summary.columns.highest')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summary.map((row) => (
          <TableRow key={row.subject_id}>
            <TableCell className="font-medium">{subjectNameById.get(row.subject_id) || `#${row.subject_id}`}</TableCell>
            <TableCell>{row.result_count}</TableCell>
            <TableCell>{formatScore(row.average_score)}</TableCell>
            <TableCell>{formatScore(row.lowest_score)}</TableCell>
            <TableCell>{formatScore(row.highest_score)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default ExamSummaryPanel;
