import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BookMarked, Library, Plus } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useBooks, useArchiveBook, useRestoreBook } from '@/hooks/library/useBooks';
import { useBorrowRecords } from '@/hooks/library/useBorrowRecords';
import { useStudents } from '@/hooks/students/useStudents';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import BookForm from '@/components/library/BookForm';
import BorrowBookForm from '@/components/library/BorrowBookForm';
import ReturnBookForm from '@/components/library/ReturnBookForm';

function LibraryPage() {
  const { t } = useTranslation('library');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('library.write');

  // --- Books ---
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const { data: books, isLoading: booksLoading } = useBooks({ search: search || undefined, status: status === 'ALL' ? undefined : status });
  const archiveBook = useArchiveBook();
  const restoreBook = useRestoreBook();

  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [bookConfirm, setBookConfirm] = useState(null); // { id, action }

  const bookColumns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: t('books.columns.title'),
        cell: ({ row }) => (
          <Link to={`/library/books/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      { accessorKey: 'author', header: t('books.columns.author'), cell: ({ row }) => row.original.author || '—' },
      { accessorKey: 'category', header: t('books.columns.category'), cell: ({ row }) => row.original.category || '—' },
      { accessorKey: 'status', header: t('books.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: t('books.columns.actions'),
              cell: ({ row }) =>
                row.original.status === 'ARCHIVED' ? (
                  <Button variant="outline" size="sm" onClick={() => setBookConfirm({ id: row.original.id, action: 'restore' })}>
                    {t('common:actions.restore', { ns: 'common' })}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setBookConfirm({ id: row.original.id, action: 'archive' })}>
                    {t('common:actions.archive', { ns: 'common' })}
                  </Button>
                ),
            },
          ]
        : []),
    ],
    [t, canWrite]
  );

  const handleBookConfirm = async () => {
    try {
      if (bookConfirm.action === 'archive') {
        await archiveBook.mutateAsync(bookConfirm.id);
      } else {
        await restoreBook.mutateAsync(bookConfirm.id);
      }
      toast.success(bookConfirm.action === 'archive' ? t('books.toasts.archived') : t('books.toasts.restored'));
    } catch {
      toast.error(t('books.toasts.error'));
    }
  };

  // --- Circulation ---
  const [borrowStatusFilter, setBorrowStatusFilter] = useState('borrowed');
  const { data: borrowRecords, isLoading: borrowLoading } = useBorrowRecords(
    borrowStatusFilter === 'overdue'
      ? { overdueOnly: true }
      : borrowStatusFilter === 'all'
        ? {}
        : { status: borrowStatusFilter === 'borrowed' ? 'BORROWED' : 'RETURNED' }
  );
  const { data: allBooksForLookup } = useBooks();
  const { data: students } = useStudents();

  const bookTitleById = useMemo(() => new Map((allBooksForLookup ?? []).map((book) => [book.id, book.title])), [allBooksForLookup]);
  const studentNameById = useMemo(
    () => new Map((students ?? []).map((student) => [student.id, `${student.first_name} ${student.last_name}`])),
    [students]
  );

  const [issueFormOpen, setIssueFormOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null); // borrow record id

  const borrowColumns = useMemo(
    () => [
      { accessorKey: 'student_id', header: t('borrow.columns.student'), cell: ({ row }) => studentNameById.get(row.original.student_id) || '—' },
      { accessorKey: 'book_id', header: t('borrow.columns.book'), cell: ({ row }) => bookTitleById.get(row.original.book_id) || '—' },
      { accessorKey: 'borrowed_date', header: t('borrow.columns.borrowedDate'), cell: ({ row }) => row.original.borrowed_date?.slice(0, 10) },
      { accessorKey: 'due_date', header: t('borrow.columns.dueDate'), cell: ({ row }) => row.original.due_date?.slice(0, 10) },
      {
        accessorKey: 'status',
        header: t('borrow.columns.status'),
        cell: ({ row }) => (
          <div className="flex items-center gap-space-2">
            <StatusBadge status={row.original.status} />
            {row.original.is_overdue ? <StatusBadge status="OVERDUE" /> : null}
          </div>
        ),
      },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: t('borrow.columns.actions'),
              cell: ({ row }) =>
                row.original.status === 'BORROWED' ? (
                  <Button size="sm" onClick={() => setReturnTarget(row.original.id)}>
                    {t('borrow.returnButton')}
                  </Button>
                ) : null,
            },
          ]
        : []),
    ],
    [t, canWrite, bookTitleById, studentNameById]
  );

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Library className="h-4 w-4" />
            {t('books.sectionTitle')}
          </CardTitle>
          {canWrite && (
            <Button size="sm" onClick={() => setBookFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('books.addButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-space-4">
          <div className="flex flex-wrap gap-space-3">
            <Input placeholder={t('books.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-xs" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t('books.statusFilter.active')}</SelectItem>
                <SelectItem value="ARCHIVED">{t('books.statusFilter.archived')}</SelectItem>
                <SelectItem value="ALL">{t('books.statusFilter.all')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={bookColumns}
            data={books}
            isLoading={booksLoading}
            emptyState={<EmptyState icon={Library} title={t('books.empty.title')} description={t('books.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookMarked className="h-4 w-4" />
            {t('borrow.sectionTitle')}
          </CardTitle>
          {canWrite && (
            <Button size="sm" onClick={() => setIssueFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('borrow.issueButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-space-4">
          <Select value={borrowStatusFilter} onValueChange={setBorrowStatusFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="borrowed">{t('borrow.statusFilter.borrowed')}</SelectItem>
              <SelectItem value="overdue">{t('borrow.statusFilter.overdue')}</SelectItem>
              <SelectItem value="returned">{t('borrow.statusFilter.returned')}</SelectItem>
              <SelectItem value="all">{t('borrow.statusFilter.all')}</SelectItem>
            </SelectContent>
          </Select>

          <DataTable
            columns={borrowColumns}
            data={borrowRecords}
            isLoading={borrowLoading}
            emptyState={<EmptyState icon={BookMarked} title={t('borrow.empty.title')} description={t('borrow.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Dialog open={bookFormOpen} onOpenChange={setBookFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('books.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <BookForm onSaved={() => setBookFormOpen(false)} onCancel={() => setBookFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={issueFormOpen} onOpenChange={setIssueFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('borrow.issueForm.title')}</DialogTitle>
          </DialogHeader>
          <BorrowBookForm onSaved={() => setIssueFormOpen(false)} onCancel={() => setIssueFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ReturnBookForm
        borrowRecordId={returnTarget}
        open={Boolean(returnTarget)}
        onOpenChange={(open) => !open && setReturnTarget(null)}
        onSaved={() => setReturnTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(bookConfirm)}
        onOpenChange={(open) => !open && setBookConfirm(null)}
        title={bookConfirm?.action === 'archive' ? t('books.confirmArchive.title') : t('books.confirmRestore.title')}
        description={bookConfirm?.action === 'archive' ? t('books.confirmArchive.description') : t('books.confirmRestore.description')}
        destructive={bookConfirm?.action === 'archive'}
        onConfirm={handleBookConfirm}
      />
    </div>
  );
}

export default LibraryPage;
