import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

import { useStudentBorrowHistory } from '@/hooks/library/useStudentBorrowHistory';
import { useBooks } from '@/hooks/library/useBooks';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';

function StudentBorrowHistoryPanel({ studentId }) {
  const { t } = useTranslation('library');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState({ from: undefined, to: undefined });

  const { data: history, isLoading } = useStudentBorrowHistory(studentId, range);
  const { data: books } = useBooks();

  const bookTitleById = new Map((books ?? []).map((book) => [book.id, book.title]));

  const handleFilter = (event) => {
    event.preventDefault();
    setRange({ from: from || undefined, to: to || undefined });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          {t('studentHistory.sectionTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-space-4">
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-space-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('studentHistory.fromLabel')}</p>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('studentHistory.toLabel')}</p>
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <Button type="submit" variant="outline">
            {t('studentHistory.filterButton')}
          </Button>
        </form>

        {isLoading && (
          <div className="space-y-space-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && <EmptyState title={t('studentHistory.empty')} />}

        {!isLoading && history && history.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('borrow.columns.book')}</TableHead>
                  <TableHead>{t('borrow.columns.borrowedDate')}</TableHead>
                  <TableHead>{t('borrow.columns.dueDate')}</TableHead>
                  <TableHead>{t('borrow.columns.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{bookTitleById.get(record.book_id) || `Book #${record.book_id}`}</TableCell>
                    <TableCell>{record.borrowed_date?.slice(0, 10)}</TableCell>
                    <TableCell>{record.due_date?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-space-2">
                        <StatusBadge status={record.status} />
                        {record.is_overdue ? <StatusBadge status="OVERDUE" /> : null}
                      </div>
                    </TableCell>
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

export default StudentBorrowHistoryPanel;
