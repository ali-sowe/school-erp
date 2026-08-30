import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { useBooks } from '@/hooks/library/useBooks';
import { useBookCopies } from '@/hooks/library/useBookCopies';
import { useBorrowBook } from '@/hooks/library/useBorrowRecords';
import { StudentSelector } from '@/components/erp/StudentSelector';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function BorrowBookForm({ bookId, onSaved, onCancel }) {
  const { t } = useTranslation('library');
  const { data: books } = useBooks({ status: 'ACTIVE' });

  const borrowSchema = z.object({
    book_id: bookId ? z.string().optional() : z.string().min(1, t('borrow.issueForm.errors.bookRequired')),
    student_id: z.string().min(1, t('borrow.issueForm.errors.studentRequired')),
    copy_id: z.string().optional(),
    borrowed_date: z.string(),
    due_date: z.string().min(1, t('borrow.issueForm.errors.dueDateRequired')),
  });

  const form = useForm({
    resolver: zodResolver(borrowSchema),
    defaultValues: { book_id: bookId ? String(bookId) : '', student_id: '', copy_id: '', borrowed_date: todayIso(), due_date: '' },
  });

  const selectedBookId = bookId ?? form.watch('book_id');
  const { data: availableCopies } = useBookCopies(selectedBookId, 'AVAILABLE');
  const borrowBook = useBorrowBook(selectedBookId);

  const onSubmit = async (values) => {
    const payload = {
      student_id: Number(values.student_id),
      borrowed_date: values.borrowed_date,
      due_date: values.due_date,
      ...(values.copy_id ? { copy_id: Number(values.copy_id) } : {}),
    };

    try {
      await borrowBook.mutateAsync(payload);
      toast.success(t('borrow.toasts.issued'));
      onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('borrow.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        {!bookId && (
          <FormField
            control={form.control}
            name="book_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('borrow.issueForm.bookLabel')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('borrow.issueForm.bookPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(books ?? []).map((book) => (
                      <SelectItem key={book.id} value={String(book.id)}>
                        {book.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('borrow.issueForm.studentLabel')}</FormLabel>
              <FormControl>
                <StudentSelector value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="copy_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('borrow.issueForm.copyLabel')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={!selectedBookId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('borrow.issueForm.copyPlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(availableCopies ?? []).map((copy) => (
                    <SelectItem key={copy.id} value={String(copy.id)}>
                      {copy.copy_number || `Copy #${copy.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="borrowed_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('borrow.issueForm.borrowedDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('borrow.issueForm.dueDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={borrowBook.isPending}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={borrowBook.isPending || !selectedBookId}>
            {borrowBook.isPending ? t('common:states.loading', { ns: 'common' }) : t('borrow.issueForm.submitButton')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default BorrowBookForm;
