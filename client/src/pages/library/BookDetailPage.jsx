import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookMarked } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useBook } from '@/hooks/library/useBooks';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/erp/StatusBadge';
import BookForm from '@/components/library/BookForm';
import CopiesPanel from '@/components/library/CopiesPanel';
import BorrowBookForm from '@/components/library/BorrowBookForm';

function BookDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('library');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('library.write');

  const { data: book, isLoading, isError } = useBook(id);
  const [editing, setEditing] = useState(false);
  const [borrowFormOpen, setBorrowFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="space-y-space-4">
        <Alert variant="destructive">
          <AlertTitle>{t('common:states.errorTitle', { ns: 'common' })}</AlertTitle>
          <AlertDescription>{isError ? t('common:states.errorDescription', { ns: 'common' }) : t('detail.notFound')}</AlertDescription>
        </Alert>
        <Link to="/library" className="text-sm text-primary hover:underline">
          ← {t('detail.backLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-6">
      <Link to="/library" className="inline-flex items-center gap-space-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('detail.backLink')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-2xl">{book.title}</CardTitle>
          <div className="flex items-center gap-space-2">
            <StatusBadge status={book.status} />
            {canWrite && book.status !== 'ARCHIVED' && (
              <Button variant="outline" size="sm" onClick={() => setEditing((current) => !current)}>
                {editing ? t('detail.cancelButton') : t('detail.editButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-space-4">
          {editing ? (
            <BookForm book={book} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
          ) : (
            <>
              <dl className="grid gap-space-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('detail.authorLabel')}</dt>
                  <dd className="font-medium">{book.author || t('detail.notProvided')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('detail.isbnLabel')}</dt>
                  <dd className="font-medium">{book.isbn || t('detail.notProvided')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('detail.categoryLabel')}</dt>
                  <dd className="font-medium">{book.category || t('detail.notProvided')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('detail.publisherLabel')}</dt>
                  <dd className="font-medium">{book.publisher || t('detail.notProvided')}</dd>
                </div>
              </dl>
              {book.description && (
                <div>
                  <dt className="text-sm text-muted-foreground">{t('detail.descriptionLabel')}</dt>
                  <dd>{book.description}</dd>
                </div>
              )}
              {book.copies && (
                <p className="text-sm text-muted-foreground">
                  {t('detail.copiesSummary', { available: book.copies.AVAILABLE, total: book.copies.TOTAL })}
                </p>
              )}
              {canWrite && book.status === 'ACTIVE' && (book.copies?.AVAILABLE ?? 0) > 0 && (
                <Button size="sm" onClick={() => setBorrowFormOpen(true)}>
                  <BookMarked className="h-4 w-4" />
                  {t('borrow.issueButton')}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CopiesPanel bookId={book.id} canWrite={canWrite} />

      <Dialog open={borrowFormOpen} onOpenChange={setBorrowFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('borrow.issueForm.title')}</DialogTitle>
          </DialogHeader>
          <BorrowBookForm bookId={book.id} onSaved={() => setBorrowFormOpen(false)} onCancel={() => setBorrowFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BookDetailPage;
